import assert from "node:assert/strict";
import test from "node:test";

import { cekIzin } from "./permissions.ts";

test("laporan keuangan hanya untuk Accounting, Manajemen, dan Direksi", () => {
  assert.equal(cekIzin("Accounting", "lihat_laporan_keuangan"), true);
  assert.equal(cekIzin("Manajemen", "lihat_laporan_keuangan"), true);
  assert.equal(cekIzin("Direksi", "lihat_laporan_keuangan"), true);

  for (const peran of ["Penjualan", "Gudang", "Finance", "HR", "Karyawan"] as const) {
    assert.equal(cekIzin(peran, "lihat_laporan_keuangan"), false, peran);
  }
  assert.equal(cekIzin(null, "lihat_laporan_keuangan"), false);
});
