#!/usr/bin/env node
// Verifies C-010 acceptance criteria against the local stack.
//
// Prerequisites:
//   pnpm db:reset && pnpm db:seed:local
//   pnpm dev (set C010_BASE_URL when Next is not on port 3000)
//
// The script refuses to run when the C-010 fixture journals already exist, so
// the hand-calculated totals below stay trustworthy. Reset and seed again to
// repeat the run.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { createServerClient } from "@supabase/ssr";
import { Client } from "pg";

const ACTOR_ACCOUNTING = "f0080000-0000-4000-8100-000000000007";
const SUMBER_UJI = "UJI_C010";

function bacaEnvLocal() {
  const hasil = {};
  if (!existsSync(".env.local")) return hasil;
  for (const baris of readFileSync(".env.local", "utf8").split("\n")) {
    const cocok = /^([A-Z0-9_]+)=(.*)$/.exec(baris.trim());
    if (cocok) hasil[cocok[1]] = cocok[2];
  }
  return hasil;
}

const envLocal = bacaEnvLocal();
const DATABASE_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  envLocal.NEXT_PUBLIC_SUPABASE_URL ??
  "http://127.0.0.1:54321";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  envLocal.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BASE_URL = process.env.C010_BASE_URL ?? "http://127.0.0.1:3000";

if (!SUPABASE_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ditemukan. Isi .env.local.",
  );
}

const target = new URL(DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
  throw new Error("Verifikasi C-010 hanya boleh berjalan pada database lokal.");
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

const results = [];
let lulus = 0;

function catat(id, nama, detail = "") {
  lulus += 1;
  results.push({ id, nama, detail });
  console.log(`[PASS] ${id}: ${nama}${detail ? ` — ${detail}` : ""}`);
}

async function postJournal({
  tanggal,
  nomor,
  baris,
  sumberId = randomUUID(),
  sumberTipe = SUMBER_UJI,
  actor = ACTOR_ACCOUNTING,
}) {
  const { rows } = await client.query(
    `select public.post_journal(
       $1::timestamptz, $2::text, $3::uuid, $4::text, $5::text,
       $6::jsonb, 'IDR', $7::uuid, null
     ) as hasil`,
    [tanggal, sumberTipe, sumberId, nomor, SUMBER_UJI, JSON.stringify(baris), actor],
  );
  return { ...rows[0].hasil, sumberId };
}

async function reverseJournal({ jurnalId, tanggal, sumberId, nomor }) {
  const { rows } = await client.query(
    `select public.reverse_journal(
       $1::uuid, $2::timestamptz, $3::uuid, $4::text, $5::text, $6::uuid
     ) as hasil`,
    [jurnalId, tanggal, sumberId, nomor, SUMBER_UJI, ACTOR_ACCOUNTING],
  );
  return rows[0].hasil;
}

async function tutupPeriode(tahun, bulan, actor = ACTOR_ACCOUNTING) {
  const { rows } = await client.query(
    "select public.tutup_periode($1, $2, $3) as hasil",
    [tahun, bulan, actor],
  );
  return rows[0].hasil;
}

async function tutupTahun(tahun, actor = ACTOR_ACCOUNTING) {
  const { rows } = await client.query(
    "select public.tutup_buku_tahunan($1, $2) as hasil",
    [tahun, actor],
  );
  return rows[0].hasil;
}

async function harusGagal(fn, potongan, label) {
  try {
    await fn();
  } catch (error) {
    const pesan = String(error?.message ?? error);
    assert.ok(
      pesan.includes(potongan),
      `${label}: pesan "${pesan}" tidak memuat "${potongan}"`,
    );
    catat(label, `ditolak: ${pesan}`);
    return pesan;
  }
  throw new Error(`${label}: seharusnya ditolak`);
}

async function hitungBaris() {
  const { rows } = await client.query(
    `select
       (select count(*)::int from public.jurnal) as jurnal,
       (select count(*)::int from public.detail_jurnal) as detail,
       (select count(*)::int from public.periode_akuntansi) as periode,
       (select count(*)::int from public.tahun_buku) as tahun,
       (select count(*)::int from public.jurnal where sumber_tipe = 'TUTUP_BUKU') as tutup`,
  );
  return rows[0];
}

async function statusPeriode(tahun, bulan) {
  const { rows } = await client.query(
    "select status from public.periode_akuntansi where tahun = $1 and bulan = $2",
    [tahun, bulan],
  );
  return rows[0]?.status ?? "belum_ada";
}

async function statusTahun(tahun) {
  const { rows } = await client.query(
    "select status from public.tahun_buku where tahun = $1",
    [tahun],
  );
  return rows[0]?.status ?? "tidak_ada";
}

async function semuaStatus(tahun) {
  const { rows } = await client.query(
    "select bulan, status from public.periode_akuntansi where tahun = $1 order by bulan",
    [tahun],
  );
  const hasil = {};
  for (let bulan = 1; bulan <= 12; bulan += 1) hasil[bulan] = "belum_ada";
  for (const row of rows) hasil[row.bulan] = row.status;
  return hasil;
}

async function riwayatPeriode(tahun, bulan, aksi) {
  const { rows } = await client.query(
    `select count(*)::int as jumlah
     from public.periode_akuntansi_riwayat_status
     where tahun = $1 and bulan = $2 and aksi = $3`,
    [tahun, bulan, aksi],
  );
  return rows[0].jumlah;
}

async function hitungJurnalPeriode() {
  const { rows } = await client.query(
    `select to_char(j.tanggal at time zone 'Asia/Jakarta', 'YYYY-MM') as periode,
            count(*)::int as jumlah
     from public.jurnal j
     group by 1`,
  );
  return Object.fromEntries(rows.map((row) => [row.periode, row.jumlah]));
}

async function saldoNominal(tahun) {
  const { rows } = await client.query(
    `select a.nomor, (sum(d.debit) - sum(d.kredit))::text as neto
     from public.detail_jurnal d
     join public.jurnal j on j.id = d.jurnal_id
     join public.akun a on a.id = d.akun_id
     where j.tanggal >= make_timestamptz($1, 1, 1, 0, 0, 0, 'Asia/Jakarta')
       and j.tanggal < make_timestamptz($1 + 1, 1, 1, 0, 0, 0, 'Asia/Jakarta')
       and a.nomor in ('302', '401', '501', '601', '602', '701')
     group by a.nomor
     order by a.nomor`,
    [tahun],
  );
  return rows;
}

async function jurnalPenutup(tahun) {
  const { rows } = await client.query(
    `select j.id, j.sumber_id, j.sumber_nomor,
            (select sum(d.debit) from public.detail_jurnal d where d.jurnal_id = j.id)::text as debit,
            (select sum(d.kredit) from public.detail_jurnal d where d.jurnal_id = j.id)::text as kredit
     from public.jurnal j
     where j.sumber_tipe = 'TUTUP_BUKU'
       and j.sumber_nomor = 'TUTUP-BUKU/' || $1::text`,
    [tahun],
  );
  return rows[0] ?? null;
}

async function idTahunBuku(tahun) {
  const { rows } = await client.query(
    "select id from public.tahun_buku where tahun = $1",
    [tahun],
  );
  return rows[0]?.id ?? null;
}

async function insertDokumen({
  tipe,
  nomor,
  periode,
  status,
  diposting,
  dipostingAt = null,
}) {
  const { rows } = await client.query(
    `insert into public.dokumen (
       id, tipe, nomor, periode, status, pembuat_id, diposting, diposting_at
     ) values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [tipe, nomor, periode, status, ACTOR_ACCOUNTING, diposting, dipostingAt],
  );
  return rows[0].id;
}

async function statusDokumen(id) {
  const { rows } = await client.query(
    "select status from public.dokumen where id = $1",
    [id],
  );
  return rows[0]?.status ?? null;
}

function teksHalaman(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function uangTampil(teks) {
  return [...teks.matchAll(/Rp [\d.]+,\d{2}/g)].map((item) => item[0]);
}

async function buatSesi(email, password) {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (items) =>
        items.forEach(({ name, value }) => jar.set(name, value)),
    },
  });

  let terakhir;
  for (let percobaan = 0; percobaan < 15; percobaan += 1) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      return [...jar]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    }
    terakhir = error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Gagal masuk sebagai ${email}: ${terakhir?.message}`);
}

async function ambil(cookie, path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { cookie },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, teks: teksHalaman(html), html };
}

async function harusMemuat(cookie, path, potongan, label) {
  const hasil = await ambil(cookie, path);
  assert.equal(hasil.status, 200, `${label}: HTTP ${hasil.status}`);
  for (const teks of potongan) {
    assert.ok(
      hasil.teks.includes(teks),
      `${label}: tidak menemukan teks "${teks}"`,
    );
  }
  return hasil;
}

async function siapkanFixture() {
  const { rows } = await client.query(
    "select count(*)::int as jumlah from public.jurnal where sumber_tipe = $1",
    [SUMBER_UJI],
  );
  if (rows[0].jumlah > 0) {
    throw new Error(
      "Fixture C-010 sudah ada. Jalankan `pnpm db:reset && pnpm db:seed:local` lalu ulangi.",
    );
  }

  await client.query(
    `insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
     values ($1, 'Uji C-010', '{Accounting}')
     on conflict (kode) do nothing`,
    [SUMBER_UJI],
  );

  await postJournal({
    tanggal: "2026-09-15T09:00:00+07:00",
    nomor: "UJI-C010-2026-09",
    baris: [
      { akun_peran: "piutang_usaha", debit: "1000000", kredit: "0" },
      { akun_peran: "penjualan", debit: "0", kredit: "1000000" },
    ],
  });
  const oktHpp = await postJournal({
    tanggal: "2026-10-15T09:00:00+07:00",
    nomor: "UJI-C010-2026-10",
    baris: [
      { akun_peran: "hpp", debit: "600000", kredit: "0" },
      { akun_peran: "persediaan_barang_jadi", debit: "0", kredit: "600000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-15T09:00:00+07:00",
    nomor: "UJI-C010-2026-11-A",
    baris: [
      { akun_peran: "beban_gaji_admin", debit: "200000", kredit: "0" },
      { akun_peran: "kas_bank", debit: "0", kredit: "200000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-16T09:00:00+07:00",
    nomor: "UJI-C010-2026-11-B",
    baris: [
      { akun_peran: "tenaga_kerja_langsung", debit: "400000", kredit: "0" },
      { akun_peran: "utang_gaji", debit: "0", kredit: "400000" },
    ],
  });
  await postJournal({
    tanggal: "2026-12-15T09:00:00+07:00",
    nomor: "UJI-C010-2026-12-A",
    baris: [
      { akun_peran: "piutang_usaha", debit: "4000000", kredit: "0" },
      { akun_peran: "penjualan", debit: "0", kredit: "4000000" },
    ],
  });
  await postJournal({
    tanggal: "2026-12-16T09:00:00+07:00",
    nomor: "UJI-C010-2026-12-B",
    baris: [
      { akun_peran: "hpp", debit: "2400000", kredit: "0" },
      { akun_peran: "persediaan_barang_jadi", debit: "0", kredit: "2400000" },
    ],
  });
  await postJournal({
    tanggal: "2026-12-17T09:00:00+07:00",
    nomor: "UJI-C010-2026-12-C",
    baris: [
      { akun_peran: "beban_gaji_admin", debit: "300000", kredit: "0" },
      { akun_peran: "kas_bank", debit: "0", kredit: "300000" },
    ],
  });
  await postJournal({
    tanggal: "2026-12-18T09:00:00+07:00",
    nomor: "UJI-C010-2026-12-D",
    baris: [
      { akun_peran: "overhead_pabrik", debit: "100000", kredit: "0" },
      { akun_peran: "kas_bank", debit: "0", kredit: "100000" },
    ],
  });
  await postJournal({
    tanggal: "2028-01-15T09:00:00+07:00",
    nomor: "UJI-C010-2028-01",
    baris: [
      { akun_peran: "piutang_usaha", debit: "100000", kredit: "0" },
      { akun_peran: "penjualan", debit: "0", kredit: "100000" },
    ],
  });

  const payrollId = await insertDokumen({
    tipe: "PERIODE_GAJI",
    nomor: "UJI-C010-PAYROLL",
    periode: "2026-11-01",
    status: "TERBUKA",
    diposting: false,
  });

  return { oktHpp, payrollId };
}

const { oktHpp, payrollId } = await siapkanFixture();

const cookieAccounting = await buatSesi(
  "accounting@lionmesh.test",
  "lionmesh-dev-2026",
);

// September is a prerequisite for closing October; the first close also
// materializes January–August.
await tutupPeriode(2026, 9);
assert.equal(await statusPeriode(2026, 9), "kunci");

const laporanSebelum = await ambil(
  cookieAccounting,
  "/laporan/laba-rugi?periode=2026-10",
);
const uangSebelum = uangTampil(laporanSebelum.teks);
assert.ok(uangSebelum.length > 0, "AC-08: laporan Oktober harus memuat angka");

const statusSebelumOktober = await semuaStatus(2026);
await tutupPeriode(2026, 10);
const statusSesudahOktober = await semuaStatus(2026);

assert.equal(statusSesudahOktober[10], "kunci");
for (let bulan = 1; bulan <= 12; bulan += 1) {
  if (bulan !== 10) {
    assert.equal(
      statusSesudahOktober[bulan],
      statusSebelumOktober[bulan],
      `AC-01: periode ${bulan} tidak boleh berubah`,
    );
  }
}
catat(
  "AC-01",
  "Oktober 2026 terkunci; periode lain tidak berubah",
  "September sudah kunci, November/Desember tetap buka",
);

const sebelumPost = await hitungBaris();
await harusGagal(
  () =>
    postJournal({
      tanggal: "2026-10-20T09:00:00+07:00",
      nomor: "UJI-C010-OKT-LOCKED",
      baris: [
        { akun_peran: "piutang_usaha", debit: "1000", kredit: "0" },
        { akun_peran: "penjualan", debit: "0", kredit: "1000" },
      ],
    }),
  "sudah dikunci",
  "AC-02",
);
const sesudahPost = await hitungBaris();
assert.equal(sesudahPost.jurnal, sebelumPost.jurnal);
assert.equal(sesudahPost.detail, sebelumPost.detail);
catat("AC-02", "posting ke Oktober terkunci ditolak tanpa baris baru");

const laporanSesudah = await ambil(
  cookieAccounting,
  "/laporan/laba-rugi?periode=2026-10",
);
assert.deepEqual(
  uangTampil(laporanSesudah.teks),
  uangSebelum,
  "AC-08: laporan Oktober harus sama sebelum/sesudah tutup",
);
catat(
  "AC-08",
  "laporan bulanan Oktober sama sebelum/sesudah tutup",
  `${uangSebelum.length} angka dibandingkan`,
);

await harusGagal(
  () => tutupPeriode(2026, 10),
  "sudah ditutup",
  "AC-05",
);
assert.equal(await statusPeriode(2026, 10), "kunci");
assert.equal(await riwayatPeriode(2026, 10, "TUTUP_PERIODE"), 1);
catat("AC-05", "tutup Oktober dua kali ditolak; riwayat TUTUP_PERIODE tetap 1");

await client.query("begin");
await client.query("set local role authenticated");
let bukaDitolak = false;
try {
  await client.query(
    "update public.periode_akuntansi set status = 'buka' where tahun = 2026 and bulan = 10",
  );
} catch {
  bukaDitolak = true;
}
await client.query("rollback");
assert.ok(bukaDitolak, "AC-07: update langsung harus ditolak");
assert.equal(await statusPeriode(2026, 10), "kunci");
catat(
  "AC-07",
  "tidak ada jalur buka kembali; update langsung ditolak RLS/grant",
);

const jurnalSebelumReversal = await hitungJurnalPeriode();
await reverseJournal({
  jurnalId: oktHpp.jurnal_id,
  tanggal: "2026-11-20T09:00:00+07:00",
  sumberId: oktHpp.sumberId,
  nomor: "UJI-C010-REV-01",
});
const jurnalSesudahReversal = await hitungJurnalPeriode();
assert.equal(
  jurnalSesudahReversal["2026-10"],
  jurnalSebelumReversal["2026-10"],
  "AC-10: Oktober tidak boleh menerima jurnal baru",
);
assert.equal(
  jurnalSesudahReversal["2026-11"],
  (jurnalSebelumReversal["2026-11"] ?? 0) + 1,
  "AC-10: jurnal pembalik harus di November",
);
catat(
  "AC-10",
  "koreksi Oktober dibuat sebagai jurnal pembalik di November",
  "Oktober tidak berubah; November +1 jurnal",
);

await harusGagal(
  () => tutupPeriode(2028, 3),
  "Januari 2028 belum ditutup",
  "AC-11",
);
assert.equal(await statusPeriode(2028, 1), "buka");
catat(
  "AC-11",
  "tutup Maret 2028 saat Januari terbuka ditolak dan menyebut Januari",
);

await tutupPeriode(2030, 2);
assert.equal(await statusPeriode(2030, 1), "kunci");
assert.equal(await statusPeriode(2030, 2), "kunci");
await harusGagal(
  () =>
    postJournal({
      tanggal: "2030-01-10T09:00:00+07:00",
      nomor: "UJI-C010-2030-LOCKED",
      baris: [
        { akun_peran: "piutang_usaha", debit: "1000", kredit: "0" },
        { akun_peran: "penjualan", debit: "0", kredit: "1000" },
      ],
    }),
  "sudah dikunci",
  "AC-11 materialisasi",
);
catat(
  "AC-11",
  "Januari 2030 yang belum punya baris dibuat + dikunci saat Februari ditutup",
);

await harusGagal(
  () => tutupPeriode(2031, 1),
  "Tahun buku 2030 belum ditutup",
  "AC-11 gate tahun",
);
catat(
  "AC-11",
  "Januari 2031 ditolak selama tahun buku 2030 belum ditutup",
);

const hasil2030 = await tutupTahun(2030);
assert.equal(hasil2030.status, "ditutup");
assert.equal(await statusTahun(2030), "ditutup");
assert.equal(await jurnalPenutup(2030), null);
for (let bulan = 1; bulan <= 12; bulan += 1) {
  assert.equal(await statusPeriode(2030, bulan), "kunci");
}
catat(
  "AC-13",
  "tahun tanpa jurnal: 12/12 terkunci, tanpa jurnal penutup",
  "2030",
);

await tutupPeriode(2031, 1);
assert.equal(await statusPeriode(2031, 1), "kunci");
await tutupTahun(2031);
assert.equal(await statusTahun(2031), "ditutup");
catat(
  "AC-11",
  "Januari 2031 dapat ditutup setelah 2030 ditutup",
  "2031 tahun ditutup tanpa jurnal",
);

await postJournal({
  tanggal: "2032-01-15T09:00:00+07:00",
  nomor: "UJI-C010-2032-01",
  baris: [
    { akun_peran: "piutang_usaha", debit: "1000", kredit: "0" },
    { akun_peran: "penjualan", debit: "0", kredit: "1000" },
  ],
});
await insertDokumen({
  tipe: "PURCHASE_ORDER",
  nomor: "UJI-C010-HALF-1",
  periode: "2032-01-01",
  status: "DITERBITKAN",
  diposting: true,
  dipostingAt: new Date(),
});
await harusGagal(
  () => tutupPeriode(2032, 1),
  "Dokumen setengah posting pada Januari 2032",
  "AC-12 setengah posting",
);
assert.equal(await statusPeriode(2032, 1), "buka");
catat(
  "AC-12",
  "diposting=true tanpa jurnal ditolak; Januari tetap buka",
);

const dokumenBalik = await insertDokumen({
  tipe: "PURCHASE_ORDER",
  nomor: "UJI-C010-HALF-2",
  periode: "2034-01-01",
  status: "DITERBITKAN",
  diposting: false,
});
await postJournal({
  tanggal: "2034-01-15T09:00:00+07:00",
  nomor: "UJI-C010-2034-DOC",
  sumberId: dokumenBalik,
  baris: [
    { akun_peran: "piutang_usaha", debit: "1000", kredit: "0" },
    { akun_peran: "penjualan", debit: "0", kredit: "1000" },
  ],
});
await harusGagal(
  () => tutupPeriode(2034, 1),
  "Dokumen setengah posting pada Januari 2034",
  "AC-12 setengah posting balik",
);
catat(
  "AC-12",
  "diposting=false tetapi ada jurnal sumber_id ditolak",
);

await postJournal({
  tanggal: "2036-01-15T09:00:00+07:00",
  nomor: "UJI-C010-2036-01",
  baris: [
    { akun_peran: "piutang_usaha", debit: "100000", kredit: "0" },
    { akun_peran: "penjualan", debit: "0", kredit: "100000" },
  ],
});
await tutupPeriode(2036, 1);
assert.equal(await statusPeriode(2036, 1), "kunci");

await client.query("begin");
const { rows: [jurnalUnbal] } = await client.query(
  `insert into public.jurnal (
     tanggal, sumber_tipe, sumber_id, sumber_nomor, sumber_pemicu,
     created_by, updated_by
   ) values (
     '2036-02-15T09:00:00+07:00', $1, $2, 'UJI-C010-UNBAL', $1, $3, $3
   ) returning id`,
  [SUMBER_UJI, randomUUID(), ACTOR_ACCOUNTING],
);
await client.query(
  `insert into public.detail_jurnal (
     jurnal_id, akun_id, debit, kredit, created_by, updated_by
   ) values
     ($1, (select id from public.akun where peran = 'piutang_usaha'), 100, 0, $2, $2),
     ($1, (select id from public.akun where peran = 'penjualan'), 0, 90, $2, $2)`,
  [jurnalUnbal.id, ACTOR_ACCOUNTING],
);
await harusGagal(
  () => tutupPeriode(2036, 2),
  "Neraca saldo",
  "AC-12 neraca",
);
await client.query("rollback");
assert.equal(await statusPeriode(2036, 2), "belum_ada");
catat(
  "AC-12",
  "neraca tidak seimbang ditolak; fixture di-rollback",
);

await tutupTahun(2036);
assert.equal(await statusTahun(2036), "ditutup");

await harusGagal(
  () => tutupTahun(2026),
  "November 2026 belum ditutup",
  "AC-13 gagal",
);
catat(
  "AC-13",
  "tutup tahun 2026 dengan November terbuka ditolak dan menyebut November",
);

const payrollSebelum = await statusDokumen(payrollId);
await tutupPeriode(2026, 11);
assert.equal(await statusPeriode(2026, 11), "kunci");
const payrollSesudah = await statusDokumen(payrollId);
assert.equal(payrollSesudah, payrollSebelum);
catat(
  "AC-09",
  "status dokumen payroll tidak berubah setelah tutup November",
  payrollSebelum,
);

const hasil2026 = await tutupTahun(2026);
assert.equal(hasil2026.status, "ditutup");
assert.equal(await statusTahun(2026), "ditutup");
assert.equal(await statusPeriode(2026, 12), "kunci");
for (let bulan = 1; bulan <= 12; bulan += 1) {
  assert.equal(await statusPeriode(2026, bulan), "kunci");
}
catat("AC-13", "tutup tahun 2026 berhasil; 12/12 bulan terkunci");

const saldo2026 = await saldoNominal(2026);
const neto = (nomor) => saldo2026.find((row) => row.nomor === nomor)?.neto ?? "0.00";
for (const nomor of ["401", "501", "601", "602", "701"]) {
  assert.equal(neto(nomor), "0.00", `AC-03: saldo ${nomor} harus nol`);
}
assert.equal(neto("302"), "-1600000.00", "AC-03: 302 naik 1.600.000");
catat(
  "AC-03",
  "saldo 401/501/601/602/701 nol; 302 naik Rp 1.600.000",
  "termasuk sisa 601 dan 602",
);

const penutup2026 = await jurnalPenutup(2026);
assert.ok(penutup2026, "AC-04: jurnal penutup harus ada");
assert.equal(penutup2026.debit, "5000000.00");
assert.equal(penutup2026.kredit, "5000000.00");
assert.equal(penutup2026.sumber_id, await idTahunBuku(2026));
catat(
  "AC-04",
  "jurnal penutup debit = kredit Rp 5.000.000 dan sumber_id = tahun_buku",
);

const sebelumTutupPost = await hitungBaris();
await harusGagal(
  () =>
    postJournal({
      tanggal: "2026-12-20T09:00:00+07:00",
      nomor: "UJI-C010-CLOSED-YEAR",
      baris: [
        { akun_peran: "piutang_usaha", debit: "1000", kredit: "0" },
        { akun_peran: "penjualan", debit: "0", kredit: "1000" },
      ],
    }),
  "sudah dikunci",
  "AC-13 posting",
);
const sesudahTutupPost = await hitungBaris();
assert.equal(sesudahTutupPost.jurnal, sebelumTutupPost.jurnal);
assert.equal(sesudahTutupPost.detail, sebelumTutupPost.detail);
catat("AC-13", "posting ke tahun 2026 yang sudah ditutup ditolak");

await postJournal({
  tanggal: "2037-01-15T09:00:00+07:00",
  nomor: "UJI-C010-2037-01",
  baris: [
    { akun_peran: "piutang_usaha", debit: "100000", kredit: "0" },
    { akun_peran: "penjualan", debit: "0", kredit: "100000" },
  ],
});
await tutupPeriode(2037, 1);
assert.equal(await statusPeriode(2037, 1), "kunci");

await client.query(
  "update public.akun set aktif = false where peran = 'laba_ditahan'",
);
const sebelumGagal302 = await hitungBaris();
await harusGagal(
  () => tutupTahun(2037),
  "Akun 302",
  "AC-06",
);
const sesudahGagal302 = await hitungBaris();
assert.equal(sesudahGagal302.tutup, sebelumGagal302.tutup);
assert.notEqual(await statusTahun(2037), "ditutup");
await client.query(
  "update public.akun set aktif = true where peran = 'laba_ditahan'",
);
catat(
  "AC-06",
  "akun laba ditahan tidak tersedia: tutup tahun ditolak tanpa jurnal penutup",
);

await tutupTahun(2037);
assert.equal(await statusTahun(2037), "ditutup");

await tutupPeriode(2038, 1);
assert.equal(await statusPeriode(2038, 1), "kunci");
assert.equal(await riwayatPeriode(2038, 1, "TUTUP_PERIODE"), 1);
await harusGagal(
  () => tutupPeriode(2038, 1),
  "sudah ditutup",
  "AC-13 ganda",
);
assert.equal(await riwayatPeriode(2038, 1, "TUTUP_PERIODE"), 1);
catat(
  "AC-13",
  "tutup ganda tidak menambah riwayat TUTUP_PERIODE",
  "2038 Januari",
);

const cookiePenjualan = await buatSesi(
  "penjualan@lionmesh.test",
  "lionmesh-dev-2026",
);

await harusMemuat(
  cookieAccounting,
  "/laporan/periode?tahun=2026",
  ["Tutup buku tahunan 2026", "Ditutup", "Tidak ada yang terbuka"],
  "UI daftar",
);
catat("UI-01", "daftar periode menampilkan tahun 2026 ditutup");

await harusMemuat(
  cookieAccounting,
  "/laporan/periode/2026-10/tutup",
  [
    "Tutup periode Oktober 2026",
    "Periode Oktober 2026 sudah ditutup",
    "Tidak bisa dibuka kembali",
    "Batal",
  ],
  "UI terkunci",
);
catat("UI-02", "halaman konfirmasi Oktober menampilkan status terkunci");

await harusMemuat(
  cookieAccounting,
  "/laporan/periode/2026-12/tutup",
  [
    "Desember ditutup lewat tutup buku tahunan",
    "Tutup periode",
    "Batal",
  ],
  "UI Desember",
);
catat("UI-03", "Desember diarahkan ke tutup buku tahunan");

await harusMemuat(
  cookiePenjualan,
  "/laporan/periode",
  [
    "Akses ditolak",
    "Periode akuntansi hanya dapat ditutup oleh Accounting",
  ],
  "UI akses",
);
catat("UI-04", "Penjualan mendapat akses ditolak");

await harusMemuat(
  cookieAccounting,
  "/laporan/periode/2038-02/tutup",
  [
    "Tutup periode Februari 2038",
    "Pemeriksaan",
    "Januari 2038",
    "Terkunci",
    "Seimbang",
    "Tidak ada",
    "Tutup periode",
    "Batal",
  ],
  "UI konfirmasi aktif",
);
catat("UI-05", "halaman konfirmasi aktif siap untuk screenshot 1280px");

await client.end();

console.log(`\n${lulus} pemeriksaan lulus.`);
console.log(
  "Screenshot target: /laporan/periode/2038-02/tutup (sesi Accounting).",
);
