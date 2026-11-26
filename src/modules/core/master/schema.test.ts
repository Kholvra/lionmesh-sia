import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidMasterId,
  parseGudangForm,
  parseKategoriProdukForm,
  parseKonversiSatuanForm,
  parseKursForm,
  parseMataUangForm,
  parseProdukForm,
  parseSatuanForm,
} from "./schema.ts";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const SATUAN_ID = "f0080000-0000-4000-8000-000000000001";
const KATEGORI_ID = "c0110000-0000-4000-8000-000000000001";

function pesanProduk(values: Record<string, string>): Record<string, string> {
  const hasil = parseProdukForm(formData(values));
  assert.equal(hasil.input, null, "produk seharusnya ditolak");
  return hasil.fieldErrors as Record<string, string>;
}

test("produk tanpa satuan dasar ditolak dan menyebut field satuan dasar (AC-03)", () => {
  const errors = pesanProduk({ kode: "PRD-01", nama: "Besi Beton", tipe: "bahan" });
  assert.equal(errors.satuan_dasar, "Satuan dasar wajib dipilih");
});

test("produk tanpa tipe ditolak dengan tiga nilai yang sah (D-41)", () => {
  const errors = pesanProduk({
    kode: "PRD-01",
    nama: "Besi Beton",
    satuan_dasar: SATUAN_ID,
  });
  assert.equal(
    errors.tipe,
    "Tipe produk harus bahan, barang dalam proses, atau barang jadi",
  );
});

test("produk dengan tipe dan satuan dasar yang sah diterima", () => {
  for (const tipe of ["bahan", "barang_dalam_proses", "barang_jadi"]) {
    const hasil = parseProdukForm(
      formData({
        kode: " PRD-01 ",
        nama: "Besi Beton",
        tipe,
        satuan_dasar: SATUAN_ID,
        kategori: KATEGORI_ID,
      }),
    );
    assert.ok(hasil.input, `tipe ${tipe} seharusnya diterima`);
    assert.equal(hasil.input.kode, "PRD-01");
    assert.equal(hasil.input.tipe, tipe);
    assert.equal(hasil.input.satuanDasarId, SATUAN_ID);
    assert.equal(hasil.input.kategoriId, KATEGORI_ID);
  }
});

test("kategori kosong disimpan sebagai null, bukan string kosong", () => {
  const hasil = parseProdukForm(
    formData({
      kode: "PRD-01",
      nama: "Besi Beton",
      tipe: "bahan",
      satuan_dasar: SATUAN_ID,
      kategori: "",
    }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.kategoriId, null);
});

test("satuan dasar yang bukan uuid ditolak sebelum menyentuh database", () => {
  const errors = pesanProduk({
    kode: "PRD-01",
    nama: "Besi Beton",
    tipe: "bahan",
    satuan_dasar: "bukan-uuid",
  });
  assert.equal(errors.satuan_dasar, "Satuan dasar tidak valid");
});

test("kode produk wajib diisi dan dibatasi panjangnya", () => {
  assert.equal(
    pesanProduk({ kode: "   ", nama: "Besi", tipe: "bahan", satuan_dasar: SATUAN_ID })
      .kode,
    "Kode produk wajib diisi",
  );
  assert.equal(
    pesanProduk({
      kode: "A".repeat(33),
      nama: "Besi",
      tipe: "bahan",
      satuan_dasar: SATUAN_ID,
    }).kode,
    "Kode produk maksimal 32 karakter",
  );
});

test("gudang dan satuan memakai aturan kode plus nama yang sama", () => {
  const gudang = parseGudangForm(formData({ kode: "GD-01", nama: "Gudang Utama" }));
  assert.ok(gudang.input);
  assert.equal(gudang.input.kode, "GD-01");

  const gudangKosong = parseGudangForm(formData({}));
  assert.equal(gudangKosong.input, null);
  assert.deepEqual(gudangKosong.fieldErrors, {
    kode: "Kode gudang wajib diisi",
    nama: "Nama gudang wajib diisi",
  });

  const satuan = parseSatuanForm(formData({ kode: "UNIT", nama: "Unit" }));
  assert.ok(satuan.input);
});

test("kategori produk wajib berkode dan bernama", () => {
  const hasil = parseKategoriProdukForm(formData({ kode: "KAT-01", nama: "Bahan Baku" }));
  assert.ok(hasil.input);

  const kosong = parseKategoriProdukForm(formData({}));
  assert.equal(kosong.fieldErrors?.kode, "Kode kategori wajib diisi");
  assert.equal(kosong.fieldErrors?.nama, "Nama kategori wajib diisi");
});

test("konversi satuan menolak satuan yang sama (AC-09)", () => {
  const hasil = parseKonversiSatuanForm(
    formData({
      satuan_dari: SATUAN_ID,
      satuan_ke: SATUAN_ID,
      faktor: "12",
    }),
  );
  assert.equal(hasil.input, null);
  assert.equal(
    hasil.fieldErrors?.satuan_ke,
    "Satuan asal dan satuan tujuan harus berbeda",
  );
});

test("konversi satuan menyimpan faktor sebagai string desimal", () => {
  const hasil = parseKonversiSatuanForm(
    formData({
      satuan_dari: SATUAN_ID,
      satuan_ke: KATEGORI_ID,
      faktor: "1,5",
    }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.faktor, "1.5");
});

test("faktor konversi harus lebih dari nol dan maksimal 6 desimal", () => {
  const nol = parseKonversiSatuanForm(
    formData({ satuan_dari: SATUAN_ID, satuan_ke: KATEGORI_ID, faktor: "0" }),
  );
  assert.equal(nol.fieldErrors?.faktor, "Faktor konversi harus lebih dari nol");

  const terlaluPresisi = parseKonversiSatuanForm(
    formData({
      satuan_dari: SATUAN_ID,
      satuan_ke: KATEGORI_ID,
      faktor: "1,1234567",
    }),
  );
  assert.equal(
    terlaluPresisi.fieldErrors?.faktor,
    "Faktor konversi maksimal 6 angka desimal",
  );
});

test("mata uang wajib berkode tiga huruf (AC-10)", () => {
  const salah = parseMataUangForm(formData({ kode: "US", nama: "Dolar" }));
  assert.equal(salah.fieldErrors?.kode, "Kode mata uang harus 3 huruf, contoh USD");

  const hasil = parseMataUangForm(
    formData({ kode: "usd", nama: "Dolar Amerika", simbol: "$" }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.kode, "USD");
  assert.equal(hasil.input.simbol, "$");
});

test("kurs menolak tanggal kosong dan nilai nol (AC-10)", () => {
  const kosong = parseKursForm(
    formData({ mata_uang: SATUAN_ID, tanggal: "", nilai: "16000" }),
  );
  assert.equal(kosong.fieldErrors?.tanggal, "Tanggal kurs wajib diisi");

  const nol = parseKursForm(
    formData({ mata_uang: SATUAN_ID, tanggal: "2026-11-24", nilai: "0" }),
  );
  assert.equal(nol.fieldErrors?.nilai, "Nilai kurs harus lebih dari nol");
});

test("kurs menerima tanggal ISO dan menyimpan nilai sebagai string desimal", () => {
  const hasil = parseKursForm(
    formData({ mata_uang: SATUAN_ID, tanggal: "2026-11-24", nilai: "16250,75" }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.tanggal, "2026-11-24");
  assert.equal(hasil.input.nilai, "16250.75");
});

test("validasi id master harus uuid", () => {
  assert.equal(isValidMasterId(SATUAN_ID), true);
  assert.equal(isValidMasterId("bukan-uuid"), false);
  assert.equal(isValidMasterId(null), false);
});
