import assert from "node:assert/strict";
import test from "node:test";

import { cekIzin, MATRIKS_IZIN } from "./permissions.ts";

test("laporan keuangan hanya untuk Accounting, Manajemen, dan Direksi", () => {
  assert.equal(cekIzin("Accounting", "lihat_laporan_keuangan"), true);
  assert.equal(cekIzin("Manajemen", "lihat_laporan_keuangan"), true);
  assert.equal(cekIzin("Direksi", "lihat_laporan_keuangan"), true);

  for (const peran of ["Penjualan", "Gudang", "Finance", "HR", "Karyawan"] as const) {
    assert.equal(cekIzin(peran, "lihat_laporan_keuangan"), false, peran);
  }
  assert.equal(cekIzin(null, "lihat_laporan_keuangan"), false);
});

test("izin baca karyawan mempertahankan batas tiap kolom", () => {
  for (const [aksi, peran] of [
    ["baca_data_karyawan", "HR"],
    ["baca_identitas_karyawan", "Accounting"],
    ["baca_gaji_ptkp_karyawan", "Accounting"],
    ["baca_rekening_karyawan", "Finance"],
  ] as const) {
    assert.equal(cekIzin(peran, aksi), true, `${aksi}: ${peran}`);
  }
  assert.equal(cekIzin("Finance", "baca_identitas_karyawan"), false);
  assert.equal(cekIzin("Accounting", "baca_rekening_karyawan"), false);
  assert.equal(cekIzin("Karyawan", "baca_data_karyawan"), false);
  assert.equal(cekIzin(null, "baca_data_karyawan"), false);
});

test("laporan produksi PR-007: Gudang hanya melihat persediaan", () => {
  assert.deepEqual([...MATRIKS_IZIN.lihat_laporan_hasil_produksi], [
    "Produksi",
    "Accounting",
    "Manajemen",
  ]);
  assert.deepEqual([...MATRIKS_IZIN.lihat_laporan_saldo_wip], [
    "Produksi",
    "Accounting",
    "Manajemen",
  ]);
  assert.deepEqual([...MATRIKS_IZIN.lihat_laporan_persediaan_jadi], [
    "Gudang",
    "Accounting",
    "Manajemen",
  ]);
  assert.equal(cekIzin("Gudang", "lihat_laporan_hasil_produksi"), false);
  assert.equal(cekIzin("Gudang", "lihat_laporan_persediaan_jadi"), true);
  assert.equal(cekIzin("QC", "lihat_perintah_produksi"), true);
});

test("permintaan pembelian: Gudang/Produksi hanya pengajuan sendiri", () => {
  for (const peran of ["Gudang", "Produksi", "Purchasing", "Manajemen"] as const) {
    assert.equal(cekIzin(peran, "lihat_permintaan_pembelian"), true, peran);
  }
  for (const peran of ["Gudang", "Produksi"] as const) {
    assert.equal(cekIzin(peran, "lihat_permintaan_pembelian_sendiri"), true, peran);
  }
  for (const peran of ["Purchasing", "Manajemen"] as const) {
    assert.equal(cekIzin(peran, "lihat_permintaan_pembelian_sendiri"), false, peran);
  }
  assert.equal(cekIzin("Accounting", "lihat_permintaan_pembelian"), false);
});

test("item navigasi Periode akuntansi tetap khusus Accounting", () => {
  assert.deepEqual([...MATRIKS_IZIN.tutup_periode], ["Accounting"]);
});
