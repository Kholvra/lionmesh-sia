#!/usr/bin/env node
// Verifies C-009 acceptance criteria against the local stack.
//
// Prerequisites:
//   pnpm db:reset && pnpm db:seed:local
//   pnpm dev (set C009_BASE_URL when Next is not on port 3000)
//
// The script refuses to run when the C-009 fixture journals already exist, so
// the hand-calculated totals below stay trustworthy. Reset and seed again to
// repeat the run.

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { Client } from "pg";
import { DB_URL } from "./lib/db-url.mjs";
import { ambilEnv, bacaEnvLocal, wajibEnv } from "./lib/env.mjs";
import { buatLaporan } from "./lib/harness.mjs";
import { validasiLokal } from "./lib/local-host.mjs";
import { masukSesi } from "./lib/session-login.mjs";
import { buatVerifikasiUi } from "./lib/ui-verify.mjs";


const ACTOR_ACCOUNTING = "f0080000-0000-4000-8100-000000000007";
const PRODUK_UJI = "c0090000-0000-4000-8000-000000000001";
const GUDANG_UTAMA = "f0080000-0000-4000-8000-000000000002";

const envLocal = bacaEnvLocal();
const DATABASE_URL = DB_URL;
const SUPABASE_URL = ambilEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  envLocal,
  "http://127.0.0.1:54321",
);
const SUPABASE_KEY = wajibEnv(
  ambilEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", envLocal),
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ditemukan. Isi .env.local.",
);
const PASSWORD = wajibEnv(
  ambilEnv("FND_TEST_PASSWORD", envLocal),
  "FND_TEST_PASSWORD",
  "Atur FND_TEST_PASSWORD untuk akun uji lokal sebelum verifikasi.",
);
const BASE_URL = process.env.C009_BASE_URL ?? "http://127.0.0.1:3000";

validasiLokal(
  DATABASE_URL,
  "Verifikasi C-009 hanya boleh berjalan pada database lokal.",
);

const { ambil, harusMemuat, uangTampil } = buatVerifikasiUi(BASE_URL);


const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

const laporan = buatLaporan({ gaya: "kurung" });
const { pass: catat } = laporan;


async function postJournal({ tanggal, nomor, baris }) {
  const { rows } = await client.query(
    `select public.post_journal(
       $1::timestamptz, 'UJI_C009', $2::uuid, $3::text, 'UJI_C009',
       $4::jsonb, 'IDR', $5::uuid, null
     ) as hasil`,
    [tanggal, randomUUID(), nomor, JSON.stringify(baris), ACTOR_ACCOUNTING],
  );
  return rows[0].hasil;
}

async function siapkanFixture() {
  const { rows } = await client.query(
    "select count(*)::int as jumlah from public.jurnal where sumber_tipe = 'UJI_C009'",
  );
  if (rows[0].jumlah > 0) {
    throw new Error(
      "Fixture C-009 sudah ada. Jalankan `pnpm db:reset && pnpm db:seed:local` lalu ulangi.",
    );
  }

  await client.query(
    `insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
     values ('UJI_C009', 'Uji C-009', '{Accounting}')
     on conflict (kode) do nothing`,
  );

  await client.query(
    `insert into public.produk (id, kode, nama, satuan_dasar_id, tipe)
     values ($1, 'UJI-C009', 'Produk uji C-009',
       'f0080000-0000-4000-8000-000000000001', 'barang_jadi')
     on conflict (kode) do nothing`,
    [PRODUK_UJI],
  );

  await postJournal({
    tanggal: "2026-10-15 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-001",
    baris: [
      { akun_peran: "kas_bank", debit: "10000000", kredit: "0" },
      { akun_peran: "laba_ditahan", debit: "0", kredit: "10000000" },
    ],
  });
  await postJournal({
    tanggal: "2026-10-15 09:05:00 Asia/Jakarta",
    nomor: "UJI-C009-002",
    baris: [
      { akun_peran: "persediaan_barang_jadi", debit: "4000000", kredit: "0" },
      { akun_peran: "laba_ditahan", debit: "0", kredit: "4000000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-02 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-003",
    baris: [
      { akun_peran: "piutang_usaha", debit: "5000000", kredit: "0" },
      { akun_peran: "penjualan", debit: "0", kredit: "5000000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-03 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-004",
    baris: [
      { akun_peran: "hpp", debit: "3000000", kredit: "0" },
      { akun_peran: "persediaan_barang_jadi", debit: "0", kredit: "3000000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-05 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-005",
    baris: [
      { akun_peran: "kas_bank", debit: "2000000", kredit: "0" },
      { akun_peran: "piutang_usaha", debit: "0", kredit: "2000000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-10 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-006",
    baris: [
      { akun_peran: "beban_gaji_admin", debit: "500000", kredit: "0" },
      { akun_peran: "kas_bank", debit: "0", kredit: "500000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-15 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-007",
    baris: [
      { akun_peran: "persediaan_bahan", debit: "1500000", kredit: "0" },
      { akun_peran: "utang_usaha", debit: "0", kredit: "1500000" },
    ],
  });
  await postJournal({
    tanggal: "2026-11-20 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-008",
    baris: [
      { akun_peran: "utang_usaha", debit: "500000", kredit: "0" },
      { akun_peran: "kas_bank", debit: "0", kredit: "500000" },
    ],
  });
  const asal = await postJournal({
    tanggal: "2026-11-21 09:00:00 Asia/Jakarta",
    nomor: "UJI-C009-009",
    baris: [
      { akun_peran: "beban_gaji_admin", debit: "100000", kredit: "0" },
      { akun_peran: "kas_bank", debit: "0", kredit: "100000" },
    ],
  });

  await client.query(
    `select public.reverse_journal(
       $1::uuid, '2026-11-22 09:00:00 Asia/Jakarta'::timestamptz,
       $2::uuid, 'UJI-C009-010', 'UJI_C009_PEMBATALAN', $3::uuid
     )`,
    [asal.jurnal_id, randomUUID(), ACTOR_ACCOUNTING],
  );

  const mutasi = [
    ["2026-10-10 09:00:00 Asia/Jakarta", "MASUK", 100, 10000],
    ["2026-11-03 09:00:00 Asia/Jakarta", "KELUAR", 30, null],
    ["2026-11-12 09:00:00 Asia/Jakarta", "MASUK", 50, 12000],
    ["2026-11-15 09:00:00 Asia/Jakarta", "KELUAR", 20, null],
  ];
  for (const [tanggal, tipe, qty, harga] of mutasi) {
    await client.query(
      `select public.catat_mutasi_stok(
         $1::uuid, $2::uuid, $3::timestamptz, $4::text, $5::numeric,
         $6::numeric, 'UJI_C009', $7::uuid, null, $8::uuid
       )`,
      [PRODUK_UJI, GUDANG_UTAMA, tanggal, tipe, qty, harga, randomUUID(), ACTOR_ACCOUNTING],
    );
  }
}

async function hitungBaris() {
  const { rows } = await client.query(
    `select
       (select count(*)::int from public.jurnal) as jurnal,
       (select count(*)::int from public.detail_jurnal) as detail,
       (select count(*)::int from public.periode_akuntansi) as periode`,
  );
  return rows[0];
}



await siapkanFixture();

const akun = {
  kas: "f0060000-0000-4000-8000-000000000001",
  piutang: "f0060000-0000-4000-8000-000000000002",
  utang: "f0060000-0000-4000-8000-000000000006",
};

const sebelum = await hitungBaris();
const cookieAccounting = (
  await masukSesi({
    url: SUPABASE_URL,
    key: SUPABASE_KEY,
    email: "accounting@lionmesh.test",
    password: PASSWORD,
    attempts: 15,
  })
).cookie;


const bukuBesar = await harusMemuat(
  cookieAccounting,
  `/laporan/buku-besar?periode=2026-11&akun=${akun.kas}`,
  [
    "Buku besar 102 · Bank",
    "Rp 10.000.000,00",
    "Rp 2.100.000,00",
    "Rp 1.100.000,00",
    "Rp 11.000.000,00",
    "UJI-C009-009",
    "UJI-C009-010",
  ],
  "AC-01/AC-11",
);
catat("AC-01", "buku besar menampilkan baris jurnal dan saldo berjalan", "kas 102");

await harusMemuat(
  cookieAccounting,
  "/laporan/neraca-saldo?periode=2026-11",
  ["Total debit", "Total kredit", "Rp 20.000.000,00", "Seimbang"],
  "AC-02",
);
catat("AC-02", "neraca saldo seimbang dan selisihnya nol", "20.000.000 debit = kredit");

const labaRugi = await harusMemuat(
  cookieAccounting,
  "/laporan/laba-rugi?periode=2026-11",
  [
    "Total pendapatan",
    "Rp 5.000.000,00",
    "Total beban",
    "Rp 3.500.000,00",
    "Laba bersih",
    "Rp 1.500.000,00",
  ],
  "AC-03",
);
assert.ok(
  !labaRugi.teks.includes("Beban penyusutan kantor"),
  "AC-03: akun 702 tidak boleh muncul",
);
catat("AC-03", "laba rugi hanya memuat pendapatan dan beban yang berlaku");

await harusMemuat(
  cookieAccounting,
  "/laporan/neraca?periode=2026-11",
  [
    "Rp 16.500.000,00",
    "Total kewajiban",
    "Rp 1.000.000,00",
    "Total ekuitas",
    "Rp 15.500.000,00",
    "Laba tahun berjalan",
    "Seimbang",
  ],
  "AC-04",
);
catat("AC-04", "neraca seimbang dan memuat laba tahun berjalan");

const daftarJurnal = await harusMemuat(
  cookieAccounting,
  "/laporan/daftar-jurnal?periode=2026-11",
  ["Jumlah jurnal", "8", "Jumlah baris", "16", "Rp 12.700.000,00"],
  "AC-09 daftar jurnal",
);
assert.ok(
  daftarJurnal.teks.includes("UJI-C009-010"),
  "AC-09: jurnal pembalik harus tampil di daftar jurnal",
);

await harusMemuat(
  cookieAccounting,
  "/laporan/arus-kas?periode=2026-11",
  [
    "Arus kas 102 · Bank",
    "Rp 10.000.000,00",
    "Rp 2.100.000,00",
    "Rp 1.100.000,00",
    "Rp 11.000.000,00",
  ],
  "AC-09 arus kas",
);

await harusMemuat(
  cookieAccounting,
  `/laporan/kartu-persediaan?periode=2026-11&produk=${PRODUK_UJI}&gudang=${GUDANG_UTAMA}`,
  [
    "100 unit · Rp 1.000.000,00",
    "Qty masuk",
    "50",
    "Qty keluar",
    "50",
    "100 unit · Rp 1.083.333,33",
    "Rekonsiliasi dengan buku besar",
    "Total nilai mutasi",
    "Rp 83.333,33",
    "Total jurnal persediaan",
    "-Rp 1.500.000,00",
    "Rp 1.583.333,33",
    "Status",
    "Selisih",
  ],
  "AC-09 kartu persediaan",
);

const { rows: [rekJurnal] } = await client.query(
  `select round(sum(d.debit - d.kredit), 2)::text as neto
   from public.detail_jurnal d
   join public.jurnal j on j.id = d.jurnal_id
   join public.akun a on a.id = d.akun_id
   where j.tanggal >= '2026-11-01 00:00:00 Asia/Jakarta'
     and j.tanggal < '2026-12-01 00:00:00 Asia/Jakarta'
     and a.peran in (
       'persediaan_bahan', 'barang_dalam_proses', 'persediaan_barang_jadi'
     )`,
);
assert.equal(rekJurnal.neto, "-1500000.00", "AC-09: sisi jurnal rekonsiliasi");

const { rows: [rekMutasi] } = await client.query(
  `select round(sum(case when qty > 0 then nilai else -nilai end), 2)::text as neto
   from public.mutasi_stok
   where tanggal >= '2026-11-01 00:00:00 Asia/Jakarta'
     and tanggal < '2026-12-01 00:00:00 Asia/Jakarta'`,
);
assert.equal(rekMutasi.neto, "83333.33", "AC-09: sisi mutasi rekonsiliasi");
catat(
  "AC-09",
  "daftar jurnal, arus kas, dan kartu persediaan memakai baris ledger",
  "8 jurnal / 16 baris / 3 mutasi / rekonsiliasi cocok-SQL",
);

const sesudah = await hitungBaris();
assert.deepEqual(sesudah, sebelum, "AC-05: membuka laporan tidak boleh menulis");
catat("AC-05", "membuka tujuh laporan tidak menambah atau mengubah baris");

const ulang = await ambil(
  cookieAccounting,
  `/laporan/buku-besar?periode=2026-11&akun=${akun.kas}`,
);
assert.deepEqual(
  uangTampil(ulang.teks),
  uangTampil(bukuBesar.teks),
  "AC-06: dua kali membuka laporan harus menghasilkan angka identik",
);
catat("AC-06", "angka identik saat laporan dibuka dua kali");

const { rows: nilaiDb } = await client.query(
  `select d.debit::text as debit
   from public.detail_jurnal d
   join public.jurnal j on j.id = d.jurnal_id
   where j.sumber_nomor = 'UJI-C009-003'
     and d.akun_id = $1`,
  [akun.piutang],
);
assert.equal(nilaiDb[0].debit, "5000000.00");
assert.ok(
  labaRugi.teks.includes("Rp 5.000.000,00"),
  "AC-07: nilai 5000000.00 harus tampil sebagai Rp 5.000.000,00",
);
catat("AC-07", "nilai database numeric(18,2) dibulatkan dua desimal saat tampil");

const cookiePenjualan = (
  await masukSesi({
    url: SUPABASE_URL,
    key: SUPABASE_KEY,
    email: "penjualan@lionmesh.test",
    password: PASSWORD,
    attempts: 15,
  })
).cookie;

const ditolak = await ambil(
  cookiePenjualan,
  "/laporan/neraca-saldo?periode=2026-11",
);
assert.equal(ditolak.status, 200);
assert.ok(ditolak.teks.includes("Akses ditolak"), "AC-08: pesan akses ditolak");
assert.ok(
  !/Rp [\d.]+,\d{2}/.test(ditolak.teks),
  "AC-08: angka tidak boleh muncul untuk peran tanpa hak",
);
catat("AC-08", "peran tanpa hak ditolak tanpa menampilkan angka");

const rentang = await ambil(
  cookieAccounting,
  "/laporan/neraca-saldo?periode=2026-11,2026-12",
);
assert.equal(rentang.status, 200);
assert.ok(
  rentang.teks.includes("Pilih tepat satu bulan kalender"),
  "AC-10: pesan harus meminta satu bulan",
);
assert.ok(
  !rentang.teks.includes("Total debit"),
  "AC-10: angka tidak boleh tampil untuk rentang lebih dari satu bulan",
);
catat("AC-10", "rentang lebih dari satu bulan ditolak");

const jurnalSebelumDokumen = await hitungBaris();
const { rows: [dibuat] } = await client.query(
  `select public.buat_dokumen(
     'PERMINTAAN_PEMBELIAN', $1::uuid, 1500000, '2026-11-18'
   ) as hasil`,
  [ACTOR_ACCOUNTING],
);
const dokumenUji = dibuat.hasil.dokumen;
assert.ok(dokumenUji && dokumenUji.id, "AC-11: dokumen uji harus terbuat");
await client.query(
  `select public.batalkan_dokumen(
     $1::uuid, $2::bigint, $3::uuid, 'Uji batal C-009'
   )`,
  [dokumenUji.id, dokumenUji.versi, ACTOR_ACCOUNTING],
);
const jurnalSesudahDokumen = await hitungBaris();
assert.deepEqual(
  jurnalSesudahDokumen,
  jurnalSebelumDokumen,
  "AC-11: dokumen batal tanpa jurnal tidak boleh menulis jurnal",
);
const nomorDokumen = String(dokumenUji.nomor ?? dokumenUji.id);
const bukuBesarUlang = await ambil(
  cookieAccounting,
  `/laporan/buku-besar?periode=2026-11&akun=${akun.kas}`,
);
assert.ok(
  !bukuBesarUlang.teks.includes(nomorDokumen),
  "AC-11: nomor dokumen batal tidak boleh muncul di buku besar",
);
const daftarUlang = await ambil(
  cookieAccounting,
  "/laporan/daftar-jurnal?periode=2026-11",
);
assert.ok(
  !daftarUlang.teks.includes(nomorDokumen),
  "AC-11: nomor dokumen batal tidak boleh muncul di daftar jurnal",
);
assert.ok(
  bukuBesar.teks.includes("UJI-C009-009") &&
    bukuBesar.teks.includes("UJI-C009-010"),
  "AC-11: jurnal asal dan jurnal pembalik harus tampil",
);
catat("AC-11", "dokumen batal tanpa jurnal tidak muncul; jurnal pembalik netto nol");

console.log("");
console.log(`C-009 verification: ${laporan.jumlahLulus} pemeriksaan lulus.`);
console.log(`Jurnal: ${sebelum.jurnal} header / ${sebelum.detail} baris (tetap).`);

await client.end();
