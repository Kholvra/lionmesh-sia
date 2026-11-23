#!/usr/bin/env node
// Verifies FND-006 acceptance criteria on an isolated local PostgreSQL database.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  throw new Error("SUPABASE_DB_URL must point to an isolated fnd006_test_* database.");
}

const target = new URL(DB_URL);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
  !target.pathname.slice(1).startsWith("fnd006_test_")
) {
  throw new Error("FND-006 verification requires an isolated local fnd006_test_* database.");
}

const client = new Client({ connectionString: DB_URL });
await client.connect();

const results = [];
const actorAccounting = "f0060000-0000-4000-8100-000000000001";
const actorGudang = "f0060000-0000-4000-8100-000000000002";

async function recordResult(id, name, runFn) {
  const detail = await runFn();
  results.push({ id, name, status: "PASS", detail });
  console.log(`[PASS] ${id}: ${name}`);
}

async function captureError(run) {
  try {
    await run();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function countRows(table) {
  const { rows } = await client.query(`select count(*)::int as count from public.${table}`);
  return rows[0].count;
}

async function insertTestUser(id, email, peran) {
  await client.query(
    `
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated',
        $2, '', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        now(), now(), '', '', '', ''
      )
    `,
    [id, email],
  );
  await client.query("update public.profiles set peran = $1 where id = $2", [
    peran,
    id,
  ]);
}

async function callPostJournal({
  tanggal,
  sumberTipe = "UJI_FND_006",
  sumberId = randomUUID(),
  sumberNomor = `UJI-${randomUUID()}`,
  sumberPemicu = "UJI_FND_006",
  mataUang = "IDR",
  actorId = actorAccounting,
  baris,
}) {
  const { rows } = await client.query(
    `
      select public.post_journal(
        $1::timestamptz, $2::text, $3::uuid, $4::text, $5::text, $6::jsonb,
        $7::text, $8::uuid
      ) as hasil
    `,
    [
      tanggal,
      sumberTipe,
      sumberId,
      sumberNomor,
      sumberPemicu,
      JSON.stringify(baris),
      mataUang,
      actorId,
    ],
  );
  return rows[0].hasil;
}

async function callReverseJournal({
  jurnalId,
  tanggal,
  sumberId = randomUUID(),
  sumberNomor = `BATAL-${randomUUID()}`,
  sumberPemicu = "PEMBATALAN_UJI",
  actorId = actorAccounting,
}) {
  const { rows } = await client.query(
    `
      select public.reverse_journal(
        $1::uuid, $2::timestamptz, $3::uuid, $4::text, $5::text, $6::uuid
      ) as hasil
    `,
    [jurnalId, tanggal, sumberId, sumberNomor, sumberPemicu, actorId],
  );
  return rows[0].hasil;
}

function line(akunPeran, debit, kredit) {
  return { akun_peran: akunPeran, debit, kredit };
}

console.log("=== Memulai Verifikasi FND-006 ===");

const { rows: versionRows } = await client.query("select version();");
console.log(`Database: ${versionRows[0].version}\n`);

const { rows: existing } = await client.query(`
  select
    to_regclass('public.akun') is not null as ledger_exists,
    (select count(*)::int from public.jurnal) as jurnal_count,
    (select count(*)::int from public.akun) as akun_count
`);
if (!existing[0].ledger_exists) {
  throw new Error("Ledger migration 0008 has not been applied.");
}
if (existing[0].jurnal_count !== 0 || existing[0].akun_count !== 0) {
  throw new Error("FND-006 verification requires a fresh, unseeded fnd006_test_* database.");
}

await client.query(readFileSync("supabase/seeds/0011_fnd_006_coa.sql", "utf8"));
await insertTestUser(
  actorAccounting,
  "fnd006-accounting@lionmesh.test",
  "Accounting",
);
await insertTestUser(actorGudang, "fnd006-gudang@lionmesh.test", "Gudang");
await client.query(`
  insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
  values ('UJI_FND_006', 'Sumber uji FND-006', array['Accounting']::text[])
`);

let jurnalUjiId;

await recordResult("AC-01", "Jurnal balance tersimpan dan id dikembalikan", async () => {
  const hasil = await callPostJournal({
    tanggal: "2026-11-20T10:00:00+07:00",
    sumberNomor: "UJI-AC-01",
    baris: [line("kas_bank", "100", "0"), line("penjualan", "0", "100")],
  });

  assert.equal(hasil.total_debit, "100.00");
  assert.equal(hasil.total_kredit, "100.00");
  jurnalUjiId = hasil.jurnal_id;

  const { rows } = await client.query(
    `
      select
        coalesce(sum(debit), 0)::text as debit,
        coalesce(sum(kredit), 0)::text as kredit
      from public.detail_jurnal
      where jurnal_id = $1
    `,
    [jurnalUjiId],
  );
  assert.equal(rows[0].debit, "100.00");
  assert.equal(rows[0].kredit, "100.00");
  return `jurnal=${jurnalUjiId}, debit=${rows[0].debit}, kredit=${rows[0].kredit}`;
});

await recordResult("AC-02", "Jurnal tidak balance ditolak tanpa baris tersimpan", async () => {
  const before = {
    jurnal: await countRows("jurnal"),
    detail: await countRows("detail_jurnal"),
  };

  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-20T11:00:00+07:00",
      sumberNomor: "UJI-AC-02",
      baris: [line("kas_bank", "100", "0"), line("penjualan", "0", "90")],
    }),
  );
  assert.match(message ?? "", /Jurnal tidak seimbang: debit 100, kredit 90\./);

  const after = {
    jurnal: await countRows("jurnal"),
    detail: await countRows("detail_jurnal"),
  };
  assert.deepEqual(after, before);

  await client.query("begin");
  const directId = randomUUID();
  await client.query(
    `
      insert into public.jurnal (
        id, tanggal, sumber_tipe, sumber_id, sumber_nomor, sumber_pemicu
      ) values ($1, now(), 'UJI_FND_006', $2, 'LANGSUNG-AC-02', 'UJI')
    `,
    [directId, randomUUID()],
  );
  const { rows: akunRows } = await client.query(
    "select id, nomor from public.akun where nomor in ('102', '401') order by nomor"
  );
  await client.query(
    `
      insert into public.detail_jurnal (jurnal_id, akun_id, debit, kredit) values
        ($1, $2, 100, 0),
        ($1, $3, 0, 90)
    `,
    [directId, akunRows[0].id, akunRows[1].id],
  );
  const commitMessage = await captureError(() => client.query("commit"));
  assert.match(commitMessage ?? "", /Jurnal tidak seimbang: debit 100, kredit 90\./);
  await client.query("rollback").catch(() => {});

  return `RPC ditolak; trigger database juga menolak commit tidak balance; jumlah jurnal tetap ${before.jurnal}`;
});

await recordResult("AC-03", "Akun tidak aktif ditolak dengan kode akun", async () => {
  await client.query("update public.akun set aktif = false where nomor = '401'");
  const before = {
    jurnal: await countRows("jurnal"),
    detail: await countRows("detail_jurnal"),
  };

  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-20T12:00:00+07:00",
      sumberNomor: "UJI-AC-03",
      baris: [line("kas_bank", "10", "0"), line("penjualan", "0", "10")],
    }),
  );
  assert.match(message ?? "", /Akun 401 tidak ditemukan atau tidak aktif\./);

  const missingMessage = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-20T12:01:00+07:00",
      sumberNomor: "UJI-AC-03B",
      baris: [
        line("kas_bank", "10", "0"),
        line("akun_tidak_ada", "0", "10"),
      ],
    }),
  );
  assert.match(missingMessage ?? "", /Akun akun_tidak_ada/);
  assert.deepEqual(
    {
      jurnal: await countRows("jurnal"),
      detail: await countRows("detail_jurnal"),
    },
    before,
  );

  await client.query("update public.akun set aktif = true where nomor = '401'");
  return `${message}; akun peran tidak dikenal juga ditolak`;
});

await recordResult("AC-04", "Periode terkunci ditolak dengan nama periode", async () => {
  await client.query(
    `
      insert into public.periode_akuntansi (
        tahun, bulan, status, dikunci_at, dikunci_oleh
      ) values (2099, 1, 'kunci', now(), $1)
    `,
    [actorAccounting],
  );

  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2099-01-15T10:00:00+07:00",
      sumberNomor: "UJI-AC-04",
      baris: [line("kas_bank", "10", "0"), line("penjualan", "0", "10")],
    }),
  );
  assert.equal(message, "Periode Januari 2099 sudah dikunci; posting ditolak.");
  return message;
});

await recordResult("AC-05", "Jurnal tersimpan tidak bisa diubah atau dihapus", async () => {
  const detail = await client.query(
    "select id from public.detail_jurnal where jurnal_id = $1 limit 1",
    [jurnalUjiId],
  );

  const attempts = [
    ["update jurnal", () => client.query("update public.jurnal set sumber_nomor = 'X' where id = $1", [jurnalUjiId])],
    ["delete jurnal", () => client.query("delete from public.jurnal where id = $1", [jurnalUjiId])],
    ["update detail", () => client.query("update public.detail_jurnal set debit = 999 where id = $1", [detail.rows[0].id])],
    ["delete detail", () => client.query("delete from public.detail_jurnal where id = $1", [detail.rows[0].id])],
  ];

  for (const [label, run] of attempts) {
    const message = await captureError(run);
    assert.match(
      message ?? "",
      /Jurnal yang sudah diposting tidak bisa diubah atau dihapus\. Koreksi dengan jurnal pembalik\./,
      `${label} harus ditolak`,
    );
  }

  return "UPDATE dan DELETE pada header/detail ditolak trigger immutability";
});

await recordResult("AC-06", "Sumber kosong atau tidak terdaftar ditolak", async () => {
  const before = await countRows("jurnal");
  const baris = [line("kas_bank", "10", "0"), line("penjualan", "0", "10")];

  const tanpaSumber = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-20T13:00:00+07:00",
      sumberTipe: null,
      sumberNomor: "UJI-AC-06",
      baris,
    }),
  );
  const tidakTerdaftar = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-20T13:01:00+07:00",
      sumberTipe: "TIDAK_TERDAFTAR",
      sumberNomor: "UJI-AC-06B",
      baris,
    }),
  );

  const expected = "Sumber jurnal wajib diisi dan harus jenis yang terdaftar.";
  assert.equal(tanpaSumber, expected);
  assert.equal(tidakTerdaftar, expected);
  assert.equal(await countRows("jurnal"), before);
  return expected;
});

await recordResult("AC-07", "Tidak ada penulisan tabel jurnal dari luar core", async () => {
  const roles = ["anon", "authenticated", "service_role"];
  const detailId = randomUUID();

  for (const role of roles) {
    for (const statement of [
      `insert into public.jurnal (tanggal, sumber_tipe, sumber_id, sumber_nomor, sumber_pemicu) values (now(), 'UJI_FND_006', gen_random_uuid(), 'HACK', 'HACK')`,
      `insert into public.detail_jurnal (id, jurnal_id, akun_id, debit, kredit) values ('${detailId}', '${jurnalUjiId}', gen_random_uuid(), 1, 0)`,
    ]) {
      await client.query("begin");
      await client.query(`set local role ${role}`);
      const message = await captureError(() => client.query(statement));
      await client.query("rollback").catch(() => {});
      assert.match(message ?? "", /permission denied/i, `${role} harus ditolak`);
    }
  }

  await client.query("begin");
  await client.query("set local role authenticated");
  const rpcMessage = await captureError(() =>
    client.query(
      `
        select public.post_journal(
          now(), 'UJI_FND_006', gen_random_uuid(), 'HACK-RPC', 'HACK',
          '[]'::jsonb, 'IDR', $1::uuid
        )
      `,
      [actorAccounting],
    ),
  );
  await client.query("rollback").catch(() => {});
  assert.match(rpcMessage ?? "", /permission denied/i);

  const before = await countRows("jurnal");
  await client.query("begin");
  await client.query("set local role service_role");
  await client.query(
    `
      select public.post_journal(
        '2026-11-20T14:00:00+07:00'::timestamptz,
        'UJI_FND_006', gen_random_uuid(), 'SERVICE-ROLE', 'UJI',
        $1::jsonb, 'IDR', $2::uuid
      )
    `,
    [
      JSON.stringify([line("kas_bank", "5", "0"), line("penjualan", "0", "5")]),
      actorAccounting,
    ],
  );
  await client.query("rollback");
  assert.equal(await countRows("jurnal"), before);

  return "DML anon/authenticated/service_role ditolak; RPC authenticated ditolak; RPC service_role dapat dipanggil";
});

await recordResult("AC-08", "Jurnal tanpa baris atau satu baris ditolak", async () => {
  const before = await countRows("jurnal");
  const cases = [
    [],
    [line("kas_bank", "10", "0")],
  ];

  for (const baris of cases) {
    const message = await captureError(() =>
      callPostJournal({
        tanggal: "2026-11-20T15:00:00+07:00",
        sumberNomor: "UJI-AC-08",
        baris,
      }),
    );
    assert.equal(message, "Jurnal minimal dua baris.");
  }
  assert.equal(await countRows("jurnal"), before);
  return "Dua kasus ditolak dengan pesan minimal dua baris";
});

await recordResult("AC-09", "Akun terpakai tidak bisa dihapus dan bisa dinonaktifkan", async () => {
  const { rows: akun } = await client.query(
    "select id, aktif from public.akun where nomor = '102'"
  );
  const detailCount = await client.query(
    "select count(*)::int as count from public.detail_jurnal where akun_id = $1",
    [akun[0].id],
  );

  const message = await captureError(() =>
    client.query("delete from public.akun where id = $1", [akun[0].id]),
  );
  assert.equal(
    message,
    "Akun yang sudah dipakai di jurnal tidak bisa dihapus. Nonaktifkan akun.",
  );

  await client.query("update public.akun set aktif = false where id = $1", [
    akun[0].id,
  ]);
  const { rows: after } = await client.query(
    `
      select a.aktif, count(d.id)::int as detail_count
      from public.akun a
      left join public.detail_jurnal d on d.akun_id = a.id
      where a.id = $1
      group by a.aktif
    `,
    [akun[0].id],
  );
  assert.equal(after[0].aktif, false);
  assert.equal(after[0].detail_count, detailCount.rows[0].count);
  await client.query("update public.akun set aktif = true where id = $1", [
    akun[0].id,
  ]);

  return `DELETE ditolak; status nonaktif dipertahankan dengan ${after[0].detail_count} baris lama`;
});

await recordResult("AC-10", "Header dan baris ditulis dalam satu transaksi", async () => {
  const before = {
    jurnal: await countRows("jurnal"),
    detail: await countRows("detail_jurnal"),
  };

  await client.query(`
    create or replace function public.fnd006_test_fail_second_detail()
    returns trigger
    language plpgsql
    as $$
    begin
      if (select count(*) from public.detail_jurnal where jurnal_id = new.jurnal_id) >= 1 then
        raise exception 'forced failure on second detail';
      end if;
      return new;
    end;
    $$
  `);
  await client.query(`
    create trigger fnd006_test_fail_second_detail
    before insert on public.detail_jurnal
    for each row execute function public.fnd006_test_fail_second_detail()
  `);

  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-20T16:00:00+07:00",
      sumberNomor: "UJI-AC-10",
      baris: [line("kas_bank", "10", "0"), line("penjualan", "0", "10")],
    }),
  );
  assert.match(message ?? "", /forced failure on second detail/);

  await client.query("drop trigger fnd006_test_fail_second_detail on public.detail_jurnal");
  await client.query("drop function public.fnd006_test_fail_second_detail()");

  assert.deepEqual(
    {
      jurnal: await countRows("jurnal"),
      detail: await countRows("detail_jurnal"),
    },
    before,
  );

  await client.query("begin");
  await client.query(
    `
      insert into public.jurnal (
        tanggal, sumber_tipe, sumber_id, sumber_nomor, sumber_pemicu
      ) values (now(), 'UJI_FND_006', $1, 'TANPA-BARIS', 'UJI')
    `,
    [randomUUID()],
  );
  const emptyCommit = await captureError(() => client.query("commit"));
  assert.equal(emptyCommit, "Jurnal minimal dua baris.");
  await client.query("rollback").catch(() => {});
  assert.deepEqual(
    {
      jurnal: await countRows("jurnal"),
      detail: await countRows("detail_jurnal"),
    },
    before,
  );

  return "Kegagalan paksa di baris kedua me-rollback header/baris; header tanpa baris ditolak saat commit";
});

let jurnalAsal;

await recordResult("AC-11", "Jurnal pembalik membalik tanpa mengubah jurnal asal", async () => {
  const asal = await callPostJournal({
    tanggal: "2026-11-21T09:00:00+07:00",
    sumberNomor: "UJI-AC-11",
    baris: [line("kas_bank", "250", "0"), line("penjualan", "0", "250")],
  });
  jurnalAsal = asal.jurnal_id;

  const beforeOrphan = await countRows("jurnal");
  const orphanMessage = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-22T08:30:00+07:00",
      sumberTipe: "PEMBALIKAN",
      sumberNomor: "BATAL-AC-11-YATIM",
      baris: [line("kas_bank", "250", "0"), line("penjualan", "0", "250")],
    }),
  );
  assert.match(orphanMessage ?? "", /Jurnal pembalik wajib merujuk jurnal asal\./);
  assert.equal(await countRows("jurnal"), beforeOrphan);

  const { rows: before } = await client.query(
    "select id, tanggal, sumber_nomor from public.jurnal where id = $1",
    [jurnalAsal],
  );
  const { rows: detailBefore } = await client.query(
    "select id, akun_id, debit::text, kredit::text from public.detail_jurnal where jurnal_id = $1 order by id",
    [jurnalAsal],
  );

  const balik = await callReverseJournal({
    jurnalId: jurnalAsal,
    tanggal: "2026-11-22T09:00:00+07:00",
    sumberNomor: "BATAL-AC-11",
  });

  const { rows: after } = await client.query(
    "select id, tanggal, sumber_nomor from public.jurnal where id = $1",
    [jurnalAsal],
  );
  const { rows: detailAfter } = await client.query(
    "select id, akun_id, debit::text, kredit::text from public.detail_jurnal where jurnal_id = $1 order by id",
    [jurnalAsal],
  );
  assert.deepEqual(after, before);
  assert.deepEqual(detailAfter, detailBefore);

  const { rows: saldo } = await client.query(
    `
      select
        coalesce(sum(debit), 0)::text as debit,
        coalesce(sum(kredit), 0)::text as kredit
      from public.detail_jurnal
      where jurnal_id in ($1, $2)
    `,
    [jurnalAsal, balik.jurnal_id],
  );
  assert.equal(saldo[0].debit, saldo[0].kredit);

  const secondMessage = await captureError(() =>
    callReverseJournal({
      jurnalId: jurnalAsal,
      tanggal: "2026-11-22T10:00:00+07:00",
      sumberNomor: "BATAL-AC-11-KEDUA",
    }),
  );
  assert.match(secondMessage ?? "", /Jurnal asal sudah dibalik\./);

  return `Jurnal PEMBALIKAN tanpa jurnal asal ditolak; pembalik ${balik.jurnal_id}; debit=kredit=${saldo[0].debit}; pembalik ganda ditolak`;
});

await recordResult("AC-12", "Koreksi periode tertutup dilakukan di periode berjalan", async () => {
  const asal = await callPostJournal({
    tanggal: "2026-09-15T09:00:00+07:00",
    sumberNomor: "UJI-AC-12",
    baris: [line("kas_bank", "20", "0"), line("penjualan", "0", "20")],
  });

  await client.query(
    `
      insert into public.periode_akuntansi (
        tahun, bulan, status, dikunci_at, dikunci_oleh
      ) values (2026, 9, 'kunci', now(), $1)
      on conflict (tahun, bulan) do update set
        status = 'kunci', dikunci_at = now(), dikunci_oleh = excluded.dikunci_oleh
    `,
    [actorAccounting],
  );

  const { rows: before } = await client.query(
    `
      select count(*)::int as count
      from public.jurnal
      where tanggal >= '2026-09-01T00:00:00+07:00'
        and tanggal < '2026-10-01T00:00:00+07:00'
    `,
  );

  const balik = await callReverseJournal({
    jurnalId: asal.jurnal_id,
    tanggal: "2026-11-22T11:00:00+07:00",
    sumberNomor: "BATAL-AC-12",
  });

  const { rows: after } = await client.query(
    `
      select count(*)::int as count
      from public.jurnal
      where tanggal >= '2026-09-01T00:00:00+07:00'
        and tanggal < '2026-10-01T00:00:00+07:00'
    `,
  );
  assert.equal(after[0].count, before[0].count);

  const { rows: reversed } = await client.query(
    "select tanggal::text as tanggal from public.jurnal where id = $1",
    [balik.jurnal_id],
  );
  assert.match(reversed[0].tanggal, /^2026-11-22/);

  return `Periode September terkunci; pembalik ${balik.jurnal_id} tersimpan di November`;
});

await recordResult("AC-13", "Akun tidak aktif tidak bisa dipakai di jurnal baru", async () => {
  await client.query("update public.akun set aktif = false where nomor = '110'");
  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-22T12:00:00+07:00",
      sumberNomor: "UJI-AC-13",
      baris: [line("piutang_usaha", "10", "0"), line("penjualan", "0", "10")],
    }),
  );
  await client.query("update public.akun set aktif = true where nomor = '110'");
  assert.match(message ?? "", /Akun 110 tidak ditemukan atau tidak aktif\./);
  return message;
});

await recordResult("AC-14", "Aktor yang tidak berhak atas pemicu ditolak", async () => {
  const before = await countRows("jurnal");
  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-22T13:00:00+07:00",
      sumberNomor: "UJI-AC-14",
      actorId: actorGudang,
      baris: [line("kas_bank", "10", "0"), line("penjualan", "0", "10")],
    }),
  );
  assert.equal(message, "Anda tidak berwenang memposting transaksi ini.");
  assert.equal(await countRows("jurnal"), before);
  return message;
});

await recordResult("AC-15", "Jurnal selain IDR ditolak", async () => {
  const before = await countRows("jurnal");
  const message = await captureError(() =>
    callPostJournal({
      tanggal: "2026-11-22T14:00:00+07:00",
      sumberNomor: "UJI-AC-15",
      mataUang: "USD",
      baris: [line("kas_bank", "10", "0"), line("penjualan", "0", "10")],
    }),
  );
  assert.equal(message, "Jurnal hanya boleh dalam mata uang IDR.");
  assert.equal(await countRows("jurnal"), before);
  return message;
});

await recordResult("AC-16", "COA dasar D-41 tepat 14 akun tanpa akun cadangan", async () => {
  const { rows } = await client.query(
    "select nomor, nama, peran from public.akun order by nomor"
  );
  assert.deepEqual(
    rows,
    [
      { nomor: "102", nama: "Bank", peran: "kas_bank" },
      { nomor: "110", nama: "Piutang usaha", peran: "piutang_usaha" },
      { nomor: "120", nama: "Persediaan bahan baku", peran: "persediaan_bahan" },
      { nomor: "121", nama: "Barang dalam proses", peran: "barang_dalam_proses" },
      { nomor: "122", nama: "Persediaan barang jadi", peran: "persediaan_barang_jadi" },
      { nomor: "201", nama: "Utang usaha", peran: "utang_usaha" },
      { nomor: "202", nama: "Utang belum difakturkan", peran: "gr_ir" },
      { nomor: "210", nama: "Utang gaji", peran: "utang_gaji" },
      { nomor: "302", nama: "Laba ditahan", peran: "laba_ditahan" },
      { nomor: "401", nama: "Penjualan", peran: "penjualan" },
      { nomor: "501", nama: "Harga pokok penjualan", peran: "hpp" },
      { nomor: "601", nama: "Tenaga kerja langsung", peran: "tenaga_kerja_langsung" },
      { nomor: "602", nama: "Overhead pabrik", peran: "overhead_pabrik" },
      { nomor: "701", nama: "Beban gaji administrasi", peran: "beban_gaji_admin" },
    ],
  );
  for (const nomor of ["150", "159", "702"]) {
    assert.equal(rows.some((row) => row.nomor === nomor), false);
  }
  return "14 akun sesuai D-41; 150, 159, dan 702 tidak ada";
});

console.log("\n=== Ringkasan FND-006 ===");
for (const result of results) {
  console.log(`${result.id}: ${result.status} — ${result.detail}`);
}

await client.end();
