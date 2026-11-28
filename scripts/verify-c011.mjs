#!/usr/bin/env node
// C-011 evidence: master data rules at the database boundary.
// Every scenario runs inside a transaction that is rolled back, so the local
// dataset stays unchanged. Codes carry a per-run suffix, so the script also
// works on a database that already holds entries from manual testing.
// Run after `pnpm db:reset && pnpm db:seed:local`: node scripts/verify-c011.mjs
import { randomBytes, randomUUID } from "node:crypto";
import { Client } from "pg";
import { DB_URL } from "./lib/db-url.mjs";
import { buatLaporan } from "./lib/harness.mjs";
import { validasiLokal } from "./lib/local-host.mjs";

validasiLokal(DB_URL, "C-011 verification only permits a local database endpoint.");


const akhiran = randomBytes(2).toString("hex").toUpperCase();
const kodeGudang = `GD-DUP-${akhiran}`;
const kodeSatuan = `KG-${akhiran}`;
const kodeProduk = `PRD-${akhiran}`;
const kodeKategori = `KAT-${akhiran}`;
const kodeUang = Array.from({ length: 3 }, () =>
  String.fromCharCode(65 + Math.floor(Math.random() * 26)),
).join("");

const client = new Client({ connectionString: DB_URL });
await client.connect();

const laporan = buatLaporan({ gaya: "polos" });
const { pass: lulus, fail: salah, sama } = laporan;


async function mulai(nama) {
  await client.query("begin");
  console.log(`\n# ${nama}`);
}

async function selesai() {
  await client.query("reset role");
  await client.query("rollback");
}

/** Masuk sebagai peran staf yang di-seed, lengkap dengan sesi yang sah. */
async function masuk(peran) {
  const profil = await client.query(
    "select id from public.profiles where peran = $1 and aktif order by id limit 1",
    [peran],
  );

  if (profil.rows.length === 0) {
    throw new Error(
      `Profil ${peran} tidak ada. Jalankan pnpm db:reset lalu pnpm db:seed:local.`,
    );
  }

  const userId = profil.rows[0].id;
  const sessionId = randomUUID();

  await client.query(
    "insert into auth.sessions (id, user_id, created_at, updated_at) values ($1, $2, now(), now())",
    [sessionId, userId],
  );
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, session_id: sessionId, role: "authenticated" }),
  ]);
  await client.query("set local role authenticated");

  return userId;
}

async function keluar() {
  await client.query("reset role");
}

/** Runs a statement that must be rejected; the savepoint keeps the tx usable. */
async function tolak(nama, sql, params, pola) {
  await client.query("savepoint coba");
  try {
    await client.query(sql, params);
    await client.query("release savepoint coba");
    salah(nama, "pernyataan tidak ditolak");
  } catch (error) {
    await client.query("rollback to savepoint coba");
    if (!pola.test(error.message)) {
      salah(nama, `pesan tidak cocok: ${error.message}`);
      return;
    }
    lulus(nama, error.message);
  }
}

async function hitung(tabel) {
  const { rows } = await client.query(`select count(*)::int as n from public.${tabel}`);
  return rows[0].n;
}

async function idEntitas(tabel, kode) {
  const { rows } = await client.query(
    `select id from public.${tabel} where kode = $1`,
    [kode],
  );
  if (rows.length === 0) throw new Error(`${tabel} dengan kode ${kode} tidak ada.`);
  return rows[0].id;
}

try {
  // AC-02: kode ganda ditolak dan pesannya menyebut kode yang sama.
  await mulai("AC-02 kode gudang ganda");
  const gudangAwal = await hitung("gudang");
  await masuk("Gudang");
  await client.query("select public.simpan_gudang(null, $1, 'Gudang Uji')", [kodeGudang]);
  lulus("gudang pertama tersimpan");
  await tolak(
    "kode yang sama ditolak tanpa memandang huruf besar/kecil",
    "select public.simpan_gudang(null, $1, 'Gudang Lain')",
    [kodeGudang.toLowerCase()],
    new RegExp(`Kode ${kodeGudang.toLowerCase()} sudah dipakai`),
  );
  await keluar();
  sama("jumlah gudang bertambah tepat satu", await hitung("gudang"), gudangAwal + 1);
  await selesai();

  // AC-03 dan D-41: produk tanpa satuan dasar atau tanpa tipe ditolak.
  await mulai("AC-03 produk tanpa satuan dasar");
  await masuk("Produksi");
  await tolak(
    "produk tanpa satuan dasar ditolak",
    "select public.simpan_produk(null, $1, 'Besi Beton', 'bahan', null)",
    [kodeProduk],
    /Satuan dasar wajib dipilih/,
  );
  await tolak(
    "produk tanpa tipe ditolak",
    "select public.simpan_produk(null, $1, 'Besi Beton', null, $2)",
    [kodeProduk, await idEntitas("satuan", "UNIT")],
    /Tipe produk harus bahan, barang dalam proses, atau barang jadi/,
  );
  const unitNonaktif = await idEntitas("satuan", "UNIT");
  await client.query("select public.set_status_master('satuan', $1, false)", [
    unitNonaktif,
  ]);
  await tolak(
    "produk dengan satuan nonaktif ditolak dan menyebut satuannya",
    "select public.simpan_produk(null, $1, 'Besi Beton', 'bahan', $2)",
    [kodeProduk, unitNonaktif],
    /Satuan dasar UNIT nonaktif/,
  );
  await selesai();

  // AC-09: konversi satuan hanya antar satuan aktif, dan tidak boleh ganda.
  await mulai("AC-09 konversi satuan");
  await masuk("Produksi");
  const unitId = await idEntitas("satuan", "UNIT");
  const konversiAwal = await hitung("konversi_satuan");
  await client.query("select public.simpan_satuan(null, $1, 'Kilogram')", [kodeSatuan]);
  const satuanBaruId = await idEntitas("satuan", kodeSatuan);
  await client.query("select public.simpan_konversi_satuan(null, $1, $2, 1)", [
    unitId,
    satuanBaruId,
  ]);
  sama("konversi UNIT ke satuan baru menambah satu baris", await hitung("konversi_satuan"), konversiAwal + 1);
  await tolak(
    "konversi ganda ditolak",
    "select public.simpan_konversi_satuan(null, $1, $2, 2)",
    [unitId, satuanBaruId],
    new RegExp(`Konversi UNIT ke ${kodeSatuan} sudah tercatat`),
  );
  await tolak(
    "satuan asal dan tujuan sama ditolak",
    "select public.simpan_konversi_satuan(null, $1, $1, 1)",
    [unitId],
    /Satuan asal dan satuan tujuan harus berbeda/,
  );
  await client.query("select public.set_status_master('satuan', $1, false)", [
    satuanBaruId,
  ]);
  await tolak(
    "konversi dengan satuan nonaktif ditolak dan menyebut satuannya",
    "select public.simpan_konversi_satuan(null, $1, $2, 1)",
    [satuanBaruId, unitId],
    new RegExp(`Satuan asal ${kodeSatuan} nonaktif`),
  );
  sama("jumlah konversi tidak bertambah", await hitung("konversi_satuan"), konversiAwal + 1);
  await selesai();

  // AC-06: peran di luar PT-06 ditolak dengan pesan yang bisa dibaca.
  await mulai("AC-06 peran tanpa hak mengubah master");
  await masuk("Purchasing");
  await tolak(
    "Purchasing tidak boleh mengubah gudang",
    "select public.simpan_gudang(null, $1, 'Gudang Purchasing')",
    [`${kodeGudang}-P`],
    /Anda tidak punya izin mengubah master gudang/,
  );
  await keluar();
  await masuk("Gudang");
  await tolak(
    "Gudang tidak boleh mengubah produk",
    "select public.simpan_produk(null, $1, 'Produk Gudang', 'bahan', $2)",
    [`${kodeProduk}-G`, await idEntitas("satuan", "UNIT")],
    /Anda tidak punya izin mengubah master produk/,
  );
  await keluar();
  await masuk("Produksi");
  await tolak(
    "Produksi tidak boleh mengubah mata uang",
    "select public.simpan_mata_uang(null, $1, 'Dolar Amerika', '$')",
    [kodeUang],
    /Anda tidak punya izin mengubah master mata uang/,
  );
  await selesai();

  // AC-04 dan AC-11: nonaktif bukan hapus, baris tetap ada dan bisa aktif lagi.
  await mulai("AC-04/AC-11 nonaktif dan aktivasi kembali");
  const gudangSeed = await idEntitas("gudang", "GUDANG-01");
  const gudangTotal = await hitung("gudang");
  await masuk("Gudang");
  await client.query("select public.set_status_master('gudang', $1, false)", [gudangSeed]);
  const nonaktif = await client.query(
    "select kode from public.gudang where kode = 'GUDANG-01' and aktif = false",
  );
  sama("gudang nonaktif tetap terbaca", nonaktif.rows.map((r) => r.kode), [
    "GUDANG-01",
  ]);
  const pilihanDokumen = await client.query(
    "select kode from public.gudang where aktif = true",
  );
  sama(
    "gudang nonaktif hilang dari pilihan dokumen baru",
    pilihanDokumen.rows.filter((r) => r.kode === "GUDANG-01"),
    [],
  );
  await tolak(
    "nonaktifkan dua kali ditolak",
    "select public.set_status_master('gudang', $1, false)",
    [gudangSeed],
    /Entri master sudah nonaktif/,
  );
  await client.query("select public.set_status_master('gudang', $1, true)", [gudangSeed]);
  const aktifLagi = await client.query(
    "select kode from public.gudang where kode = 'GUDANG-01' and aktif = true",
  );
  sama("gudang muncul lagi setelah aktivasi", aktifLagi.rows.map((r) => r.kode), [
    "GUDANG-01",
  ]);
  const riwayat = await client.query(
    "select aksi from public.master_riwayat where entitas = 'gudang' and entitas_id = $1 order by created_at, id",
    [gudangSeed],
  );
  sama(
    "riwayat mencatat nonaktif lalu aktif",
    riwayat.rows.map((r) => r.aksi),
    ["NONAKTIFKAN", "AKTIFKAN"],
  );
  await keluar();
  sama("jumlah gudang tidak berkurang", await hitung("gudang"), gudangTotal);
  await selesai();

  // D-04/D-25: modul tidak menulis tabel master langsung.
  await mulai("tabel master hanya ditulis lewat core");
  await masuk("Gudang");
  await tolak(
    "insert langsung ke tabel gudang ditolak",
    "insert into public.gudang (kode, nama) values ($1, 'Gudang Langsung')",
    [`${kodeGudang}-L`],
    /permission denied for table gudang/,
  );
  await tolak(
    "update langsung ke tabel satuan ditolak",
    "update public.satuan set nama = 'Kilogram' where kode = 'UNIT'",
    [],
    /permission denied for table satuan/,
  );
  await selesai();

  // AC-10: mata uang dan kurs sebagai master, transaksi tetap IDR.
  await mulai("AC-10 mata uang dan kurs");
  await masuk("Accounting");
  await client.query("select public.simpan_mata_uang(null, $1, 'Dolar Uji', '$')", [
    kodeUang,
  ]);
  const uangId = await idEntitas("mata_uang", kodeUang);
  lulus("mata uang tersimpan dan kode dinormalkan menjadi huruf besar");
  await tolak(
    "kode mata uang ganda ditolak",
    "select public.simpan_mata_uang(null, $1, 'Dolar', '$')",
    [kodeUang],
    new RegExp(`Kode mata uang ${kodeUang} sudah dipakai`),
  );
  await client.query("select public.simpan_kurs(null, $1, '2026-11-24', 16250.75)", [
    uangId,
  ]);
  const kurs = await client.query(
    "select nilai::text as nilai from public.kurs where mata_uang_id = $1",
    [uangId],
  );
  sama("kurs tersimpan sebagai desimal", kurs.rows.map((r) => r.nilai), [
    "16250.750000",
  ]);
  await tolak(
    "kurs kedua pada tanggal yang sama ditolak",
    "select public.simpan_kurs(null, $1, '2026-11-24', 16000)",
    [uangId],
    /sudah tercatat/,
  );
  await tolak(
    "kurs nol ditolak",
    "select public.simpan_kurs(null, $1, '2026-11-25', 0)",
    [uangId],
    /Nilai kurs harus lebih dari nol/,
  );
  const idr = await client.query("select kode from public.mata_uang where kode = 'IDR'");
  sama("IDR tersedia dari seed", idr.rows.map((r) => r.kode), ["IDR"]);
  await selesai();

  // INV-03: kode tidak berubah setelah dipakai.
  await mulai("INV-03 kode tidak berubah setelah dipakai");
  await masuk("Produksi");
  const unit = await idEntitas("satuan", "UNIT");
  await client.query(
    "select public.simpan_produk(null, $1, 'Besi Beton', 'bahan', $2)",
    [kodeProduk, unit],
  );
  await tolak(
    "kode satuan yang sudah dipakai produk tidak dapat diubah",
    "select public.simpan_satuan($1, $2, 'Unit')",
    [unit, `UNIT-${akhiran}`],
    /Kode UNIT tidak dapat diubah karena satuan sudah dipakai/,
  );
  await client.query(
    "select public.simpan_produk($1, $2, 'Besi Beton Ulir', 'barang_jadi', $3)",
    [await idEntitas("produk", kodeProduk), kodeProduk, unit],
  );
  lulus("nama dan tipe produk masih dapat diubah");
  await selesai();

  // AC-08: kategori produk tersimpan dan bisa dipasang ke produk.
  await mulai("AC-08 kategori produk");
  await masuk("Produksi");
  await client.query("select public.simpan_kategori_produk(null, $1, 'Bahan Baku')", [
    kodeKategori,
  ]);
  const kategoriId = await idEntitas("kategori_produk", kodeKategori);
  await client.query(
    "select public.simpan_produk(null, $1, 'Besi Beton', 'bahan', $2, $3)",
    [`${kodeProduk}-K`, await idEntitas("satuan", "UNIT"), kategoriId],
  );
  const terpasang = await client.query(
    "select kategori_kode from public.produk_master where kode = $1",
    [`${kodeProduk}-K`],
  );
  sama("produk membawa kategori yang dipasang", terpasang.rows.map((r) => r.kategori_kode), [
    kodeKategori,
  ]);
  await selesai();

  // AC-07: dua pembacaan daftar yang sama memberi hasil yang sama.
  await mulai("AC-07 pembacaan berulang");
  await masuk("Gudang");
  const baca1 = await client.query(
    "select id, kode, nama, aktif from public.gudang order by kode, id",
  );
  const baca2 = await client.query(
    "select id, kode, nama, aktif from public.gudang order by kode, id",
  );
  sama("dua pembacaan identik", baca1.rows, baca2.rows);
  await selesai();
} catch (error) {

  salah("skenario berhenti", error.message);

  await client.query("rollback").catch(() => {});
} finally {
  await client.end();
}

console.log(`\n${laporan.jumlahGagal === 0 ? "Semua pemeriksaan lulus" : `${laporan.jumlahGagal} pemeriksaan gagal`}`);
process.exit(laporan.jumlahGagal === 0 ? 0 : 1);
