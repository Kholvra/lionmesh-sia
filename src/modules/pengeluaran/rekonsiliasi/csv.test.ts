import assert from "node:assert/strict";
import test from "node:test";

import { headerCsv, parseCsv, parseNominalRupiah, parseTanggal, petakanBaris } from "./csv.ts";

test("CSV koma dan titik koma terbaca", () => {
  assert.deepEqual(parseCsv("a,b\n1,2\n"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCsv("a;b\n1;2\n"), [["a", "b"], ["1", "2"]]);
});

test("CSV dengan kutip berisi pemisah tetap satu sel", () => {
  const rows = parseCsv('tanggal,nominal\n"2026-11-01","1.000"\n');
  assert.deepEqual(rows[1], ["2026-11-01", "1.000"]);
});

test("header diambil dari baris pertama", () => {
  assert.deepEqual(headerCsv("Tanggal;Nominal;Ref\nx;1;y"), ["Tanggal", "Nominal", "Ref"]);
});

test("tanggal menerima ISO dan format Indonesia", () => {
  assert.equal(parseTanggal("2026-11-28"), "2026-11-28");
  assert.equal(parseTanggal("28/11/2026"), "2026-11-28");
  assert.equal(parseTanggal("31/02/2026"), null);
  assert.equal(parseTanggal("bukan tanggal"), null);
});

test("nominal Indonesia dan plain terbaca sebagai rupiah bulat", () => {
  assert.deepEqual(parseNominalRupiah("1.234"), { nominal: 1234, negatif: false });
  assert.deepEqual(parseNominalRupiah("1.234,00"), { nominal: 1234, negatif: false });
  assert.deepEqual(parseNominalRupiah("-2.500"), { nominal: 2500, negatif: true });
  assert.deepEqual(parseNominalRupiah("(750)"), { nominal: 750, negatif: true });
  assert.equal(parseNominalRupiah("1.234,50"), null);
  assert.equal(parseNominalRupiah("0"), null);
  assert.equal(parseNominalRupiah("abc"), null);
});

test("pemetaan kolom menghasilkan baris mutasi", () => {
  const rows = [
    ["Tanggal", "Nominal", "Referensi", "Arah"],
    ["2026-11-01", "1.000", "INV-1", "Kredit"],
    ["02/11/2026", "500", "INV-2", "Debit"],
  ];
  const hasil = petakanBaris(rows, { tanggal: 0, nominal: 1, referensi: 2, arah: 3 });
  assert.equal(hasil.error, null);
  assert.deepEqual(hasil.baris[0], {
    tanggal: "2026-11-01",
    arah: "MASUK",
    nominal: "1000",
    referensi: "INV-1",
  });
  assert.equal(hasil.baris[1]?.arah, "KELUAR");
});

test("tanpa kolom arah, tanda nominal menentukan arah", () => {
  const rows = [
    ["tanggal", "nominal"],
    ["2026-11-01", "-750"],
    ["2026-11-02", "250"],
  ];
  const hasil = petakanBaris(rows, { tanggal: 0, nominal: 1, referensi: null, arah: null });
  assert.equal(hasil.baris[0]?.arah, "KELUAR");
  assert.equal(hasil.baris[1]?.arah, "MASUK");
});

test("baris rusak menolak seluruh berkas dengan nomor baris", () => {
  const rows = [
    ["tanggal", "nominal"],
    ["2026-11-01", "100"],
    ["2026-11-02", ""],
  ];
  const hasil = petakanBaris(rows, { tanggal: 0, nominal: 1, referensi: null, arah: null });
  assert.equal(hasil.baris.length, 0);
  assert.equal(hasil.error, "Baris 3 nominal tidak terbaca");
});
