import assert from "node:assert/strict";
import test from "node:test";

import { isValidPemasokId, parsePemasokForm } from "./schema.ts";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function pesan(values: Record<string, string>): Record<string, string> {
  const hasil = parsePemasokForm(formData(values));
  assert.equal(hasil.input, null, "input should be rejected");
  return hasil.fieldErrors as Record<string, string>;
}

test("form kosong melaporkan nama dan termin", () => {
  const errors = pesan({});
  assert.equal(errors.nama, "Nama pemasok wajib diisi");
  assert.equal(errors.termin_hari, "Termin pembayaran wajib diisi");
});

test("toleransi kosong disimpan sebagai nol (D-15)", () => {
  const hasil = parsePemasokForm(formData({ nama: "PT A", termin_hari: "30" }));
  assert.ok(hasil.input);
  assert.equal(hasil.input.toleransiPersen, 0);
  assert.equal(hasil.input.toleransiNominal, "0");
});

test("termin wajib berupa angka", () => {
  for (const nilai of ["abc", "1e3", "0x10", ".5", "30.", "30,5"]) {
    const errors = pesan({ nama: "PT A", termin_hari: nilai });
    assert.match(errors.termin_hari, /angka/);
  }
});

test("termin negatif ditolak", () => {
  const errors = pesan({ nama: "PT A", termin_hari: "-5" });
  assert.equal(
    errors.termin_hari,
    "Termin pembayaran harus berupa angka bulat minimal 0",
  );
});

test("toleransi persen dibatasi 0 sampai 100", () => {
  assert.equal(
    pesan({ nama: "PT A", termin_hari: "30", toleransi_persen: "100,01" })
      .toleransi_persen,
    "Toleransi persen harus antara 0 dan 100",
  );
  assert.equal(
    pesan({ nama: "PT A", termin_hari: "30", toleransi_persen: "-0,5" })
      .toleransi_persen,
    "Toleransi persen harus antara 0 dan 100",
  );
});

test("lebih dari dua angka desimal ditolak, bukan dibulatkan", () => {
  assert.equal(
    pesan({ nama: "PT A", termin_hari: "30", toleransi_persen: "0,755" })
      .toleransi_persen,
    "Toleransi persen maksimal 2 angka desimal",
  );
  assert.equal(
    pesan({ nama: "PT A", termin_hari: "30", toleransi_nominal: "10,005" })
      .toleransi_nominal,
    "Toleransi nominal maksimal 2 angka desimal",
  );
});

test("toleransi nominal negatif dan notasi aneh ditolak", () => {
  assert.equal(
    pesan({ nama: "PT A", termin_hari: "30", toleransi_nominal: "-1" })
      .toleransi_nominal,
    "Toleransi nominal tidak boleh negatif",
  );
  for (const nilai of ["1.234,56", "0x10", "1e-3"]) {
    assert.equal(
      pesan({ nama: "PT A", termin_hari: "30", toleransi_nominal: nilai })
        .toleransi_nominal,
      "Toleransi nominal harus berupa angka",
    );
  }
});

test("koma desimal diterima dan dikonversi", () => {
  const hasil = parsePemasokForm(
    formData({
      nama: "  PT A  ",
      termin_hari: "30",
      toleransi_persen: "0,75",
      toleransi_nominal: "1500",
      npwp: "   ",
    }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.nama, "PT A");
  assert.equal(hasil.input.toleransiPersen, 0.75);
  assert.equal(hasil.input.toleransiNominal, "1500");
  assert.equal(hasil.input.npwp, null);
});

test("nominal besar tidak kehilangan presisi", () => {
  const besar = "9007199254740993";
  const hasil = parsePemasokForm(
    formData({ nama: "PT A", termin_hari: "30", toleransi_nominal: besar }),
  );
  assert.ok(hasil.input);
  assert.equal(hasil.input.toleransiNominal, besar);
});

test("nominal melebihi kapasitas numeric(18,2) ditolak per field", () => {
  const errors = pesan({
    nama: "PT A",
    termin_hari: "30",
    toleransi_nominal: "10000000000000000",
  });
  assert.equal(errors.toleransi_nominal, "Toleransi nominal terlalu besar");
});

test("termin melebihi kapasitas int4 ditolak per field", () => {
  const errors = pesan({ nama: "PT A", termin_hari: "2147483648" });
  assert.equal(errors.termin_hari, "Termin pembayaran terlalu besar");
});

test("id pemasok harus uuid", () => {
  assert.equal(isValidPemasokId("f0080000-0000-4000-8100-000000000004"), true);
  assert.equal(isValidPemasokId("0190f2a0-3c4d-7abc-8def-0123456789ab"), true);
  assert.equal(isValidPemasokId("f0080000000040008100000000000004"), false);
  assert.equal(isValidPemasokId("abc"), false);
  assert.equal(isValidPemasokId(undefined), false);
});
