#!/usr/bin/env node
// C-013 verification harness: proves AC-01 … AC-15 against a seeded local database.
// Run after `pnpm db:reset && pnpm db:seed`. Every value asserted here is the
// contract from docs/product/items/C-013-domain-pengadaan/02-acceptance-criteria.md.

import { Client } from "pg";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const target = new URL(DB_URL);

if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
  throw new Error("C-013 verification only permits a local database endpoint.");
}

const AKTOR = {
  gudang: "f0080000-0000-4000-8100-000000000003",
  purchasing: "f0080000-0000-4000-8100-000000000004",
  qc: "f0080000-0000-4000-8100-000000000005",
  produksi: "f0080000-0000-4000-8100-000000000006",
  manajemen: "f0080000-0000-4000-8100-000000000009",
};

// Fixed dates keep the snapshot deterministic across reset + seed runs.
const TANGGAL_DOKUMEN = "2026-11-24";
const TANGGAL_BUTUH = "2026-12-01";
const JAM_MUTASI = [
  "2026-11-24T10:00:00+07:00",
  "2026-11-24T10:05:00+07:00",
  "2026-11-24T10:10:00+07:00",
  "2026-11-24T10:15:00+07:00",
  "2026-11-24T10:20:00+07:00",
  "2026-11-24T10:25:00+07:00",
  "2026-11-24T10:30:00+07:00",
  "2026-11-24T10:35:00+07:00",
];

const client = new Client({ connectionString: DB_URL });
await client.connect();

// Never install a migration into the shared local database from a test harness.
const { rows: fungsi } = await client.query(
  "select to_regprocedure('public.ajukan_pr(uuid,uuid,date,jsonb,text,uuid,date)') as ada",
);
if (!fungsi[0].ada) {
  await client.end();
  throw new Error("Migrasi C-013 belum tersedia; gunakan database uji terisolasi yang sudah dimigrasi.");
}

// Keep the harness atomic: every row it creates is rolled back, so repeated runs
// on the same seeded database start from the same state (AC-10).
await client.query("begin");

const results = [];
const snapshot = {};

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

async function q(text, params = []) {
  const { rows } = await client.query(text, params);
  return rows;
}

async function recordResult(id, name, run) {
  try {
    const detail = await run();
    results.push({ id, name, status: "PASS", detail });
    console.log(`[PASS] ${id}: ${name}`);
  } catch (error) {
    results.push({ id, name, status: "FAIL", error: error.message });
    console.error(`[FAIL] ${id}: ${name} — ${error.message}`);
    throw error;
  }
}

async function expectError(run, fragment) {
  // A failed statement aborts the whole transaction, so isolate each expected
  // rejection in a savepoint before rolling it back.
  await q("savepoint c013_harapan_gagal");
  let message = "";
  try {
    await run();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  await q("rollback to savepoint c013_harapan_gagal");
  assert(
    message.includes(fragment),
    `expected error containing "${fragment}", received "${message || "<no error>"}"`,
  );
  return message;
}

async function doc(dokumenId) {
  const [row] = await q(
    "select id, status, versi, nomor, pembuat_id from public.dokumen where id = $1",
    [dokumenId],
  );
  assert(row, `document ${dokumenId} not found`);
  return row;
}

async function historyCount(dokumenId) {
  const [row] = await q(
    "select count(*)::integer as jumlah from public.riwayat_status where dokumen_id = $1",
    [dokumenId],
  );
  return row.jumlah;
}

async function saldo(produkId, gudangId) {
  const [row] = await q(
    "select qty::text as qty from public.saldo_stok where produk_id = $1 and gudang_id = $2",
    [produkId, gudangId],
  );
  return row ? row.qty : "0";
}

async function ajukanPR({ actor, baris, woId = null, keterangan = null }) {
  const [row] = await q(
    `select public.ajukan_pr($1, $2, $3, $4::jsonb, $5, $6, $7) as hasil`,
    [
      actor,
      MASTER.gudang,
      TANGGAL_BUTUH,
      JSON.stringify(
        baris.map((item) => ({
          produk_id: item.produkId,
          satuan_id: item.satuanId,
          qty: item.qty,
        })),
      ),
      keterangan,
      woId,
      TANGGAL_DOKUMEN,
    ],
  );
  return row.hasil;
}

async function periksa(dokumenId) {
  const sebelum = await doc(dokumenId);
  const [row] = await q("select public.periksa_pr($1, $2, $3) as hasil", [
    dokumenId,
    sebelum.versi,
    AKTOR.purchasing,
  ]);
  return row.hasil;
}

async function setujui(dokumenId) {
  const sebelum = await doc(dokumenId);
  const [row] = await q("select public.setujui_dokumen($1, $2, $3) as hasil", [
    dokumenId,
    sebelum.versi,
    AKTOR.manajemen,
  ]);
  return row.hasil;
}

async function tolak(dokumenId, alasan) {
  const sebelum = await doc(dokumenId);
  const [row] = await q("select public.tolak_dokumen($1, $2, $3, $4) as hasil", [
    dokumenId,
    sebelum.versi,
    AKTOR.manajemen,
    alasan,
  ]);
  return row.hasil;
}

async function buatPO({ prId, pemasokId = MASTER.pemasok, baris, harga = "100" }) {
  const sebelum = await doc(prId);
  const [row] = await q(
    "select public.buat_po($1, $2, $3, $4::jsonb, $5, $6) as hasil",
    [
      prId,
      sebelum.versi,
      pemasokId,
      JSON.stringify(
        baris.map((item) => ({
          produk_id: item.produkId,
          qty: item.qty,
          harga_satuan: item.hargaSatuan ?? harga,
          ppn_persen: item.ppn ?? "0",
        })),
      ),
      TANGGAL_DOKUMEN,
      AKTOR.purchasing,
    ],
  );
  return row.hasil;
}

async function terima({ poId, jenis, baris }) {
  const sebelum = await doc(poId);
  const [row] = await q(
    "select public.catat_penerimaan($1, $2, $3, $4, $5::jsonb, $6, $7) as hasil",
    [
      poId,
      sebelum.versi,
      MASTER.gudang,
      jenis,
      JSON.stringify(baris),
      TANGGAL_DOKUMEN,
      AKTOR.gudang,
    ],
  );
  return row.hasil;
}

async function qc({ penerimaanId, baris, waktuIndex = 0 }) {
  const sebelum = await doc(penerimaanId);
  const [row] = await q(
    "select public.catat_qc_penerimaan($1, $2, $3::jsonb, $4::timestamptz, $5) as hasil",
    [
      penerimaanId,
      sebelum.versi,
      JSON.stringify(baris),
      JAM_MUTASI[waktuIndex % JAM_MUTASI.length],
      AKTOR.qc,
    ],
  );
  return row.hasil;
}

async function barisPO(poId) {
  return q(
    "select id, produk_id, qty::text as qty, harga_satuan::text as harga from public.po_item where po_id = $1 order by urutan",
    [poId],
  );
}

async function barisPenerimaan(penerimaanId) {
  return q(
    "select id, po_item_id, qty_diterima::text as qty from public.penerimaan_item where penerimaan_id = $1 order by id",
    [penerimaanId],
  );
}

// ---------------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------------

console.log("=== C-013 domain pengadaan verification ===");
const [versi] = await q("select version()");
console.log(`Database: ${versi.version}`);

const [satuan] = await q(
  `insert into public.satuan (kode, nama) values ('C013-SAT', 'Satuan uji C-013')
   on conflict (kode) do update set nama = excluded.nama returning id`,
);
const [produk] = await q(
  `insert into public.produk (kode, nama, satuan_dasar_id, aktif, tipe)
   values ('C013-PROD-1', 'Produk uji C-013', $1, true, 'bahan')
   on conflict (kode) do update set nama = excluded.nama, satuan_dasar_id = excluded.satuan_dasar_id
   returning id`,
  [satuan.id],
);
const [gudang] = await q(
  `insert into public.gudang (kode, nama, aktif) values ('C013-GDG', 'Gudang uji C-013', true)
   on conflict (kode) do update set nama = excluded.nama, aktif = true returning id`,
);
const [pemasokLama] = await q(
  "select id from public.pemasok where lower(btrim(nama)) = lower('PT C013 Uji')",
);
const pemasokId =
  pemasokLama?.id ??
  (
    await q(
      `insert into public.pemasok (nama, termin_hari, toleransi_persen, toleransi_nominal, aktif)
       values ('PT C013 Uji', 30, 0, 0, true) returning id`,
    )
  )[0].id;

const MASTER = {
  satuan: satuan.id,
  produk: produk.id,
  gudang: gudang.id,
  pemasok: pemasokId,
};

const barisProduk = [{ produkId: MASTER.produk, satuanId: MASTER.satuan, qty: "10" }];

// ---------------------------------------------------------------------------
// AC-01 — one table for Gudang and Produksi PRs
// ---------------------------------------------------------------------------

let prGudang;
let prProduksi;
await recordResult("AC-01", "PR Gudang tanpa wo_id dan PR Produksi dengan wo_id di satu tabel", async () => {
  prGudang = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  prProduksi = await ajukanPR({
    actor: AKTOR.produksi,
    baris: barisProduk,
    woId: "c0130000-0000-4000-8000-0000000000aa",
    keterangan: "kebutuhan bahan produksi",
  });

  const rows = await q(
    `select dokumen_id, wo_id, gudang_id from public.permintaan_pembelian
     where dokumen_id = any($1::uuid[]) order by wo_id nulls first`,
    [[prGudang.permintaan_id, prProduksi.permintaan_id]],
  );

  assert(rows.length === 2, `expected 2 PR rows, got ${rows.length}`);
  assert(rows[0].wo_id === null, "Gudang PR should have null wo_id");
  assert(
    rows[1].wo_id === "c0130000-0000-4000-8000-0000000000aa",
    "Produksi PR should keep its wo_id",
  );

  const items = await q(
    "select count(*)::integer as jumlah from public.permintaan_pembelian_item where permintaan_id = any($1::uuid[])",
    [[prGudang.permintaan_id, prProduksi.permintaan_id]],
  );
  assert(items[0].jumlah === 2, `expected 2 PR item rows, got ${items[0].jumlah}`);

  snapshot.pr_wo_id = rows.map((row) => row.wo_id);
  return `dua PR di permintaan_pembelian; wo_id = ${JSON.stringify(rows.map((r) => r.wo_id))}`;
});

// ---------------------------------------------------------------------------
// AC-07 — exactly one riwayat row per transition
// ---------------------------------------------------------------------------

await recordResult("AC-07", "setiap transisi PR/PO menambah tepat satu baris riwayat dengan aktor", async () => {
  const awal = await historyCount(prGudang.permintaan_id);
  assert(awal === 1, `creation should write 1 riwayat row, got ${awal}`);

  await periksa(prGudang.permintaan_id);
  const setelahPeriksa = await historyCount(prGudang.permintaan_id);
  assert(setelahPeriksa === awal + 1, "periksa must add exactly one riwayat row");

  await setujui(prGudang.permintaan_id);
  const setelahSetujui = await historyCount(prGudang.permintaan_id);
  assert(setelahSetujui === setelahPeriksa + 1, "setujui must add exactly one riwayat row");

  const rows = await q(
    `select aksi, actor_id, created_at, status_tujuan from public.riwayat_status
     where dokumen_id = $1 order by created_at, aksi`,
    [prGudang.permintaan_id],
  );
  assert(rows.every((row) => row.actor_id && row.created_at), "actor and time must be recorded");
  const aksi = rows.map((row) => row.aksi);
  assert(
    aksi.join(",") === "BUAT,PERIKSA,SETUJUI",
    `unexpected actions: ${aksi.join(",")}`,
  );

  snapshot.riwayat_aksi = rows.map((row) => `${row.aksi}:${row.status_tujuan}`);
  return `riwayat: ${snapshot.riwayat_aksi.join(" → ")}`;
});

// ---------------------------------------------------------------------------
// AC-02 / AC-11 — rejected PR never becomes PO and has no exit transition
// ---------------------------------------------------------------------------

await recordResult("AC-02", "PR DITOLAK tidak bisa menjadi PO dan tidak ada PO baru", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  await tolak(pr.permintaan_id, "harga belum lengkap");

  const pesan = await expectError(
    () => buatPO({ prId: pr.permintaan_id, baris: [{ produkId: MASTER.produk, qty: "1" }] }),
    "DITOLAK",
  );
  const po = await q("select count(*)::integer as jumlah from public.po where permintaan_id = $1", [
    pr.permintaan_id,
  ]);
  assert(po[0].jumlah === 0, "rejected PR must not have a PO");
  snapshot.rejected_pr_po_count = po[0].jumlah;
  return `pesan: ${pesan}; PO untuk PR DITOLAK = ${po[0].jumlah}`;
});

await recordResult("AC-11", "PR DITOLAK tidak punya transisi keluar; PR baru berhasil", async () => {
  const [rejected] = await q(
    `select d.id, d.versi from public.dokumen d
     join public.permintaan_pembelian p on p.dokumen_id = d.id
     where d.status = 'DITOLAK' order by d.created_at desc limit 1`,
  );
  await expectError(
    () =>
      q("select public.pindah_status_dokumen($1, $2, 'REVISI', 'REVISI', $3)", [
        rejected.id,
        rejected.versi,
        AKTOR.manajemen,
      ]),
    "tidak bisa diubah",
  );

  const baru = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  const [row] = await q("select status from public.dokumen where id = $1", [baru.permintaan_id]);
  assert(row.status === "DIAJUKAN", `new PR should start DIAJUKAN, got ${row.status}`);
  return "DITOLAK tetap buntu; PR baru berstatus DIAJUKAN";
});

// ---------------------------------------------------------------------------
// AC-14 — the requester cannot approve their own PR
// ---------------------------------------------------------------------------

await recordResult("AC-14", "pemohon tidak bisa menyetujui PR miliknya", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  const sebelum = await doc(pr.permintaan_id);

  const pesan = await expectError(
    () =>
      q("select public.setujui_dokumen($1, $2, $3)", [
        pr.permintaan_id,
        sebelum.versi,
        AKTOR.gudang,
      ]),
    "tidak bisa menyetujui dokumen yang Anda ajukan sendiri",
  );

  const [row] = await q("select status from public.dokumen where id = $1", [pr.permintaan_id]);
  assert(row.status === "MENUNGGU_PERSETUJUAN", "status must not change after a rejected approval");
  return pesan;
});

// ---------------------------------------------------------------------------
// AC-03 — PO only from an approved PR
// ---------------------------------------------------------------------------

let po1;
await recordResult("AC-03", "PO hanya dari PR DISETUJUI/PEMASOK_DITETAPKAN", async () => {
  const prBelum = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(prBelum.permintaan_id);
  await expectError(
    () => buatPO({ prId: prBelum.permintaan_id, baris: [{ produkId: MASTER.produk, qty: "1" }] }),
    "Status PR saat ini: MENUNGGU_PERSETUJUAN",
  );

  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  await setujui(pr.permintaan_id);
  po1 = await buatPO({
    prId: pr.permintaan_id,
    baris: [{ produkId: MASTER.produk, qty: "10", hargaSatuan: "100" }],
  });

  const poDoc = await doc(po1.po_id);
  assert(poDoc.status === "DITERBITKAN", `PO should be DITERBITKAN, got ${poDoc.status}`);
  const prDoc = await doc(pr.permintaan_id);
  assert(prDoc.status === "PEMASOK_DITETAPKAN", `PR should be PEMASOK_DITETAPKAN, got ${prDoc.status}`);

  const prPemasok = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(prPemasok.permintaan_id);
  await setujui(prPemasok.permintaan_id);
  const sebelum = await doc(prPemasok.permintaan_id);
  await q("select public.tetapkan_pemasok_pr($1, $2, $3, $4)", [
    prPemasok.permintaan_id,
    sebelum.versi,
    MASTER.pemasok,
    AKTOR.purchasing,
  ]);
  const poDariPemasok = await buatPO({
    prId: prPemasok.permintaan_id,
    baris: [{ produkId: MASTER.produk, qty: "1", hargaSatuan: "100" }],
  });
  assert(poDariPemasok.po_id, "PO from PEMASOK_DITETAPKAN must succeed");

  snapshot.po_status = poDoc.status;
  snapshot.pr_status_setelah_po = prDoc.status;
  return `PO ${poDoc.status}; PR ${prDoc.status}; jalur pemasok ditetapkan juga berhasil`;
});

// ---------------------------------------------------------------------------
// AC-04 — short receipt is an exception with the difference
// ---------------------------------------------------------------------------

await recordResult("AC-04", "penerimaan kurang dari qty PO tercatat sebagai exception", async () => {
  const [item] = await barisPO(po1.po_id);
  const hasil = await terima({
    poId: po1.po_id,
    jenis: "SEBAGIAN",
    baris: [{ po_item_id: item.id, qty_diterima: "8" }],
  });
  assert(hasil.diterima === true, "partial receipt should be stored");

  const exceptions = await q(
    `select tipe, qty_po::text as qty_po, qty_diterima::text as qty_diterima, selisih::text as selisih
     from public.pengadaan_exception where penerimaan_id = $1 order by created_at`,
    [hasil.penerimaan_id],
  );
  assert(exceptions.length === 1, `expected 1 exception, got ${exceptions.length}`);
  assert(exceptions[0].tipe === "SELISIH_QTY", `expected SELISIH_QTY, got ${exceptions[0].tipe}`);
  assert(Number(exceptions[0].selisih) === 2, `expected selisih 2, got ${exceptions[0].selisih}`);

  snapshot.selisih = exceptions[0];
  return `exception ${exceptions[0].tipe} selisih ${exceptions[0].selisih}`;
});

// ---------------------------------------------------------------------------
// AC-05 — over-receipt is rejected, exception recorded, stock untouched
// ---------------------------------------------------------------------------

let po2;
await recordResult("AC-05", "penerimaan melebihi qty PO ditolak sebagai exception tanpa stok masuk", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  await setujui(pr.permintaan_id);
  po2 = await buatPO({
    prId: pr.permintaan_id,
    baris: [{ produkId: MASTER.produk, qty: "10", hargaSatuan: "50" }],
  });

  const [item] = await barisPO(po2.po_id);
  const saldoSebelum = await saldo(MASTER.produk, MASTER.gudang);

  const hasil = await terima({
    poId: po2.po_id,
    jenis: "PENUH",
    baris: [{ po_item_id: item.id, qty_diterima: "12" }],
  });
  assert(hasil.diterima === false, "over-receipt must be rejected");
  assert(String(hasil.pesan).includes("melebihi sisa PO"), `unexpected message: ${hasil.pesan}`);

  const penerimaan = await q("select count(*)::integer as jumlah from public.penerimaan where po_id = $1", [
    po2.po_id,
  ]);
  assert(penerimaan[0].jumlah === 0, "rejected receipt must not create a penerimaan row");

  const exceptions = await q(
    "select tipe, selisih::text as selisih from public.pengadaan_exception where po_id = $1",
    [po2.po_id],
  );
  assert(exceptions.length === 1, `expected 1 over-receipt exception, got ${exceptions.length}`);
  assert(exceptions[0].tipe === "KELEBIHAN_QTY", `expected KELEBIHAN_QTY, got ${exceptions[0].tipe}`);
  assert(Number(exceptions[0].selisih) === 2, `expected selisih 2, got ${exceptions[0].selisih}`);

  const saldoSesudah = await saldo(MASTER.produk, MASTER.gudang);
  assert(saldoSesudah === saldoSebelum, `stock must not change: ${saldoSebelum} → ${saldoSesudah}`);

  snapshot.over_receipt = { diterima: hasil.diterima, exception: exceptions[0].tipe, saldo: saldoSesudah };
  return `ditolak; exception KELEBIHAN_QTY 2; saldo tetap ${saldoSesudah}`;
});

// ---------------------------------------------------------------------------
// AC-06 — receipt alone does not move stock; QC lulus does
// ---------------------------------------------------------------------------

let penerimaan6;
await recordResult("AC-06", "stok hanya bertambah setelah QC lulus sebesar qty lolos", async () => {
  const [item] = await barisPO(po2.po_id);
  const sebelum = await saldo(MASTER.produk, MASTER.gudang);

  const hasil = await terima({
    poId: po2.po_id,
    jenis: "SEBAGIAN",
    baris: [{ po_item_id: item.id, qty_diterima: "6" }],
  });
  assert(hasil.diterima === true, "partial receipt should be stored");
  penerimaan6 = hasil.penerimaan_id;

  const setelahTerima = await saldo(MASTER.produk, MASTER.gudang);
  assert(setelahTerima === sebelum, `receipt must not change stock: ${sebelum} → ${setelahTerima}`);

  const [jurnalSebelumQC] = await q(
    "select count(*)::integer as jumlah from public.jurnal where sumber_id = $1",
    [penerimaan6],
  );
  assert(jurnalSebelumQC.jumlah === 0, "receipt without QC must not create a journal");

  const [pItem] = await barisPenerimaan(penerimaan6);
  await qc({
    penerimaanId: penerimaan6,
    baris: [{ penerimaan_item_id: pItem.id, qty_lulus: "6" }],
    waktuIndex: 0,
  });

  const setelahQC = await saldo(MASTER.produk, MASTER.gudang);
  assert(
    Number(setelahQC) - Number(setelahTerima) === 6,
    `QC lulus must add 6: ${setelahTerima} → ${setelahQC}`,
  );

  snapshot.stok = { sebelum, setelah_terima: setelahTerima, setelah_qc: setelahQC };
  return `stok ${sebelum} → ${setelahTerima} (terima) → ${setelahQC} (QC lulus)`;
});

// ---------------------------------------------------------------------------
// AC-13 — QC lulus posts Dr persediaan_bahan / Cr gr_ir
// ---------------------------------------------------------------------------

await recordResult("AC-13", "QC lulus menghasilkan jurnal Dr persediaan_bahan / Cr gr_ir", async () => {
  const [jurnal] = await q(
    `select j.id, j.sumber_tipe, j.sumber_nomor
     from public.jurnal j where j.sumber_id = $1`,
    [penerimaan6],
  );
  assert(jurnal, "QC lulus must create a journal");

  const baris = await q(
    `select a.peran, d.debit::text as debit, d.kredit::text as kredit
     from public.detail_jurnal d join public.akun a on a.id = d.akun_id
     where d.jurnal_id = $1 order by a.peran`,
    [jurnal.id],
  );
  const persediaan = baris.find((row) => row.peran === "persediaan_bahan");
  const grIr = baris.find((row) => row.peran === "gr_ir");
  assert(persediaan, "journal must debit persediaan_bahan");
  assert(grIr, "journal must credit gr_ir");
  assert(Number(persediaan.debit) === 300, `debit should be 6 × 50 = 300, got ${persediaan.debit}`);
  assert(Number(grIr.kredit) === 300, `credit should be 300, got ${grIr.kredit}`);

  const [tanpaJurnal] = await q(
    "select count(*)::integer as jumlah from public.jurnal where sumber_id = $1",
    [penerimaan6],
  );
  assert(tanpaJurnal.jumlah === 1, "exactly one journal per QC lulus");

  snapshot.jurnal = { debit: persediaan.debit, kredit: grIr.kredit, sumber: jurnal.sumber_tipe };
  return `jurnal ${jurnal.sumber_tipe}: Dr persediaan_bahan ${persediaan.debit} / Cr gr_ir ${grIr.kredit}`;
});

// ---------------------------------------------------------------------------
// AC-12 — partial receipts until the PO is fully received
// ---------------------------------------------------------------------------

await recordResult("AC-12", "penerimaan parsial 4 + 6 menutup PO, penerimaan ke-3 ditolak", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  await setujui(pr.permintaan_id);
  const po = await buatPO({
    prId: pr.permintaan_id,
    baris: [{ produkId: MASTER.produk, qty: "10", hargaSatuan: "10" }],
  });
  const [item] = await barisPO(po.po_id);

  const pertama = await terima({
    poId: po.po_id,
    jenis: "SEBAGIAN",
    baris: [{ po_item_id: item.id, qty_diterima: "4" }],
  });
  assert(pertama.status_po === "DITERIMA_SEBAGIAN", `expected DITERIMA_SEBAGIAN, got ${pertama.status_po}`);

  const kedua = await terima({
    poId: po.po_id,
    jenis: "SEBAGIAN",
    baris: [{ po_item_id: item.id, qty_diterima: "6" }],
  });
  assert(kedua.status_po === "DITERIMA", `expected DITERIMA, got ${kedua.status_po}`);

  await q("savepoint c013_penerimaan_ketiga");
  let pesanKetiga = "";
  try {
    await terima({
      poId: po.po_id,
      jenis: "SEBAGIAN",
      baris: [{ po_item_id: item.id, qty_diterima: "1" }],
    });
  } catch (error) {
    pesanKetiga = error instanceof Error ? error.message : String(error);
  }
  await q("rollback to savepoint c013_penerimaan_ketiga");
  assert(
    pesanKetiga.includes("sudah diterima penuh"),
    `third receipt must be rejected, received "${pesanKetiga || "<no error>"}"`,
  );

  snapshot.penerimaan_parsial = ["DITERIMA_SEBAGIAN", "DITERIMA", "DITOLAK"];
  return "4 → DITERIMA_SEBAGIAN; 6 → DITERIMA; 1 → ditolak";
});

// ---------------------------------------------------------------------------
// AC-08 — cancellation keeps the row and requires a reason
// ---------------------------------------------------------------------------

await recordResult("AC-08", "PR dibatalkan tetap ada dengan status DIBATALKAN dan alasan", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  const sebelum = await doc(pr.permintaan_id);

  await expectError(
    () =>
      q("select public.batalkan_pr($1, $2, $3, $4)", [
        pr.permintaan_id,
        sebelum.versi,
        "   ",
        AKTOR.gudang,
      ]),
    "alasan",
  );

  await q("select public.batalkan_pr($1, $2, $3, $4)", [
    pr.permintaan_id,
    sebelum.versi,
    "salah input",
    AKTOR.gudang,
  ]);

  const [row] = await q("select status from public.dokumen where id = $1", [pr.permintaan_id]);
  assert(row.status === "DIBATALKAN", `expected DIBATALKAN, got ${row.status}`);

  const [riwayat] = await q(
    `select alasan from public.riwayat_status
     where dokumen_id = $1 and aksi = 'BATAL' order by created_at desc limit 1`,
    [pr.permintaan_id],
  );
  assert(riwayat?.alasan === "salah input", "cancellation reason must be stored");
  snapshot.pembatalan_pr = { status: row.status, alasan: riwayat.alasan };
  return `status ${row.status}, alasan "${riwayat.alasan}", baris tetap ada`;
});

// ---------------------------------------------------------------------------
// AC-15 — PO cancellation window
// ---------------------------------------------------------------------------

await recordResult("AC-15", "PO tanpa penerimaan bisa dibatalkan; setelah penerimaan ditolak", async () => {
  const prBatal = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(prBatal.permintaan_id);
  await setujui(prBatal.permintaan_id);
  const poBatal = await buatPO({
    prId: prBatal.permintaan_id,
    baris: [{ produkId: MASTER.produk, qty: "2", hargaSatuan: "10" }],
  });
  const sebelumBatal = await doc(poBatal.po_id);
  await expectError(() => q("select public.batalkan_po($1, $2, $3, $4)", [
    poBatal.po_id, sebelumBatal.versi, "tidak berwenang", AKTOR.gudang,
  ]), "Hanya Purchasing pembuat PO");
  await q("savepoint c013_purchasing_lain");
  await q("update public.profiles set peran = 'Purchasing' where id = $1", [AKTOR.produksi]);
  await expectError(() => q("select public.batalkan_po($1, $2, $3, $4)", [
    poBatal.po_id, sebelumBatal.versi, "bukan pembuat", AKTOR.produksi,
  ]), "Hanya Purchasing pembuat PO");
  await q("rollback to savepoint c013_purchasing_lain");
  await q("select public.batalkan_po($1, $2, $3, $4)", [
    poBatal.po_id,
    sebelumBatal.versi,
    "pemasok tidak sanggup",
    AKTOR.purchasing,
  ]);
  const sesudahBatal = await doc(poBatal.po_id);
  assert(sesudahBatal.status === "DIBATALKAN", `expected DIBATALKAN, got ${sesudahBatal.status}`);

  const prTerima = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(prTerima.permintaan_id);
  await setujui(prTerima.permintaan_id);
  const poTerima = await buatPO({
    prId: prTerima.permintaan_id,
    baris: [{ produkId: MASTER.produk, qty: "2", hargaSatuan: "10" }],
  });
  const [item] = await barisPO(poTerima.po_id);
  await terima({
    poId: poTerima.po_id,
    jenis: "SEBAGIAN",
    baris: [{ po_item_id: item.id, qty_diterima: "1" }],
  });

  const sebelumTolak = await doc(poTerima.po_id);
  const pesan = await expectError(
    () =>
      q("select public.batalkan_po($1, $2, $3, $4)", [
        poTerima.po_id,
        sebelumTolak.versi,
        "mau batal",
        AKTOR.purchasing,
      ]),
    "sudah ada penerimaan",
  );

  snapshot.pembatalan_po = { tanpa_penerimaan: sesudahBatal.status, setelah_penerimaan: "DITOLAK" };
  return `PO tanpa penerimaan → DIBATALKAN; setelah penerimaan → ${pesan}`;
});

// D-64 / AC-18: production requires a production-order reference.
await recordResult("AC-18", "Produksi wajib menyertakan wo_id", async () => {
  await expectError(() => ajukanPR({ actor: AKTOR.produksi, baris: barisProduk }), "Perintah produksi wajib diisi");
  const gudang = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  assert(gudang.permintaan_id, "Gudang tanpa wo_id harus berhasil");
  return "Produksi tanpa wo_id ditolak; Gudang tanpa wo_id berhasil";
});

await recordResult("AC-19", "QC bernilai jurnal nol ditolak tanpa mutasi", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  await setujui(pr.permintaan_id);
  const po = await buatPO({ prId: pr.permintaan_id, baris: [{ produkId: MASTER.produk, qty: "1", hargaSatuan: "0.0001" }] });
  const [item] = await barisPO(po.po_id);
  const receipt = await terima({ poId: po.po_id, jenis: "PENUH", baris: [{ po_item_id: item.id, qty_diterima: "1" }] });
  const [line] = await barisPenerimaan(receipt.penerimaan_id);
  const before = await saldo(MASTER.produk, MASTER.gudang);
  await expectError(() => qc({ penerimaanId: receipt.penerimaan_id, baris: [{ penerimaan_item_id: line.id, qty_lulus: "1" }] }), "nilai jurnal lebih dari nol");
  assert(await saldo(MASTER.produk, MASTER.gudang) === before, "saldo tidak boleh berubah");
  assert((await doc(receipt.penerimaan_id)).status === "DITERIMA", "status penerimaan tidak boleh berubah");
  return "nilai nol ditolak dan saldo serta status tidak berubah";
});

// Fail each side effect inside the same transaction and verify all effects roll back.
await recordResult("AC-16/17", "QC gagal atomik dan periode terkunci ditolak", async () => {
  const pr = await ajukanPR({ actor: AKTOR.gudang, baris: barisProduk });
  await periksa(pr.permintaan_id);
  await setujui(pr.permintaan_id);
  const po = await buatPO({ prId: pr.permintaan_id, baris: [{ produkId: MASTER.produk, qty: "1", hargaSatuan: "10" }] });
  const [item] = await barisPO(po.po_id);
  const penerimaan = await terima({ poId: po.po_id, jenis: "PENUH", baris: [{ po_item_id: item.id, qty_diterima: "1" }] });
  const id = penerimaan.penerimaan_id;
  const [baris] = await barisPenerimaan(id);
  const before = await q(`select (select count(*) from public.mutasi_stok)::int as stok,
    (select count(*) from public.jurnal)::int as jurnal,
    (select count(*) from public.riwayat_status)::int as riwayat,
    (select status from public.dokumen where id = $1) as status`, [id]);
  await q("create function pg_temp.c013_fail() returns trigger language plpgsql as $$ begin raise exception 'uji gagal atomik'; end $$");
  for (const table of ["mutasi_stok", "jurnal", "riwayat_status"]) {
    await q(`create trigger c013_fail before insert on public.${table} for each row execute function pg_temp.c013_fail()`);
    await expectError(() => qc({ penerimaanId: id, baris: [{ penerimaan_item_id: baris.id, qty_lulus: "1" }] }), "uji gagal atomik");
    await q(`drop trigger c013_fail on public.${table}`);
    const after = await q(`select (select count(*) from public.mutasi_stok)::int as stok,
      (select count(*) from public.jurnal)::int as jurnal,
      (select count(*) from public.riwayat_status)::int as riwayat,
      (select status from public.dokumen where id = $1) as status`, [id]);
    assert(JSON.stringify(after) === JSON.stringify(before), `perubahan parsial setelah ${table}`);
  }
  await q("insert into public.periode_akuntansi (tahun, bulan, status) values (2026, 11, 'kunci') on conflict (tahun, bulan) do update set status = 'kunci'");
  await expectError(() => qc({ penerimaanId: id, baris: [{ penerimaan_item_id: baris.id, qty_lulus: "1" }] }), "dikunci");
  const after = await q(`select (select count(*) from public.mutasi_stok)::int as stok,
    (select count(*) from public.jurnal)::int as jurnal,
    (select count(*) from public.riwayat_status)::int as riwayat,
    (select status from public.dokumen where id = $1) as status`, [id]);
  assert(JSON.stringify(after) === JSON.stringify(before), "perubahan parsial pada periode terkunci");
  return "stok, jurnal, riwayat dan status tidak berubah pada kegagalan dan periode terkunci";
});

// ---------------------------------------------------------------------------
// AC-09 — writes stay in core; authenticated cannot write the tables
// ---------------------------------------------------------------------------

await recordTestAC09();

async function recordTestAC09() {
  await recordResult("AC-09", "tidak ada peran klien yang bisa menulis tabel pengadaan", async () => {
    const tables = [
      "permintaan_pembelian",
      "permintaan_pembelian_item",
      "po",
      "po_item",
      "penerimaan",
      "penerimaan_item",
      "pengadaan_exception",
    ];
    const rows = await q(
      `select c.relname,
              has_table_privilege('authenticated', c.oid, 'INSERT') as auth_insert,
              has_table_privilege('authenticated', c.oid, 'UPDATE') as auth_update,
              has_table_privilege('authenticated', c.oid, 'DELETE') as auth_delete,
              has_table_privilege('anon', c.oid, 'INSERT') as anon_insert
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = any($1::text[])
       order by c.relname`,
      [tables],
    );
    assert(rows.length === tables.length, "all procurement tables must exist");
    for (const row of rows) {
      assert(!row.auth_insert && !row.auth_update && !row.auth_delete && !row.anon_insert,
        `${row.relname} grants a client write privilege`);
    }
    snapshot.tabel_pengadaan = rows.map((row) => row.relname);
    return `${rows.length} tabel: hanya SELECT untuk klien, tulis lewat RPC core`;
  });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const [jumlahBaris] = await q(`
  select
    (select count(*) from public.permintaan_pembelian)::integer as permintaan,
    (select count(*) from public.po)::integer as po,
    (select count(*) from public.penerimaan)::integer as penerimaan,
    (select count(*) from public.pengadaan_exception)::integer as exception,
    (select count(*) from public.jurnal where sumber_tipe = 'PENERIMAAN_BARANG')::integer as jurnal
`);
snapshot.jumlah_baris = jumlahBaris;

const gagal = results.filter((row) => row.status === "FAIL");
console.log(`\n=== ${results.length - gagal.length}/${results.length} AC PASS ===`);
console.log("SNAPSHOT " + JSON.stringify(snapshot));

await client.query("rollback");
await client.end();
if (gagal.length > 0) process.exit(1);
