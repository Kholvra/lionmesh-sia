import assert from "node:assert/strict";
import test from "node:test";

import {
  parseHasilProduksiForm,
  parseQcVerdictForm,
  PESAN_JUMLAH_QC,
  PESAN_KEPUTUSAN_QC,
  PESAN_PEMISAHAN_QC,
} from "./hasil-qc.ts";

const WO = "11111111-1111-4111-8111-111111111111";
const HASIL = "22222222-2222-4222-8222-222222222222";
const PRODUKSI = "33333333-3333-4333-8333-333333333333";
const QC = "44444444-4444-4444-8444-444444444444";

function formHasil(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    wo_id: WO,
    percobaan: "1",
    qty_diproses: "10.0000",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

function formQc(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    hasil_produksi_id: HASIL,
    wo_id: WO,
    qty_lulus: "8.0000",
    qty_rework: "0",
    qty_reject: "2.0000",
    keputusan: "QC_PASSED",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

test("hasil produksi valid dengan percobaan dan qty presisi", () => {
  const hasil = parseHasilProduksiForm(formHasil());
  assert.ok(hasil.input);
  assert.equal(hasil.input.percobaan, 1);
  assert.equal(hasil.input.qtyDiproses, "10.0000");
  assert.equal(hasil.input.tanggal, undefined);
});

test("percobaan dan jumlah diproses ditolak bila kosong atau tidak sah", () => {
  assert.equal(
    parseHasilProduksiForm(formHasil({ percobaan: "0" })).fieldErrors.percobaan,
    "Percobaan harus lebih dari nol",
  );
  assert.equal(
    parseHasilProduksiForm(formHasil({ percobaan: "1.5" })).fieldErrors.percobaan,
    "Percobaan harus berupa angka bulat",
  );
  assert.equal(
    parseHasilProduksiForm(formHasil({ qty_diproses: "" })).fieldErrors
      .qtyDiproses,
    "Jumlah diproses wajib diisi",
  );
  assert.equal(
    parseHasilProduksiForm(formHasil({ qty_diproses: "-1" })).fieldErrors
      .qtyDiproses,
    "Jumlah diproses harus lebih dari nol",
  );
});

test("keputusan QC diterima bila pembagian dan aktor sah", () => {
  const hasil = parseQcVerdictForm(formQc(), {
    qtyDiproses: "10.0000",
    hasilCreatedBy: PRODUKSI,
    actorId: QC,
  });
  assert.ok(hasil.input);
  assert.equal(hasil.input.keputusan, "QC_PASSED");
  assert.equal(hasil.input.actorId, QC);
});

test("jumlah L + R + J harus sama dengan jumlah diproses", () => {
  const hasil = parseQcVerdictForm(formQc({ qty_lulus: "7.0000" }), {
    qtyDiproses: "10.0000",
    hasilCreatedBy: PRODUKSI,
    actorId: QC,
  });
  assert.equal(hasil.input, null);
  assert.equal(hasil.fieldErrors.qtyLulus, PESAN_JUMLAH_QC);
});

test("jumlah negatif, kosong, dan bukan angka dibedakan per field", () => {
  const trusted = {
    qtyDiproses: "10.0000",
    hasilCreatedBy: PRODUKSI,
    actorId: QC,
  };
  assert.equal(
    parseQcVerdictForm(formQc({ qty_reject: "-1" }), trusted).fieldErrors
      .qtyReject,
    "Jumlah reject tidak boleh negatif.",
  );
  assert.equal(
    parseQcVerdictForm(formQc({ qty_lulus: "" }), trusted).fieldErrors.qtyLulus,
    "Jumlah lulus wajib diisi",
  );
  assert.equal(
    parseQcVerdictForm(formQc({ qty_rework: "abc" }), trusted).fieldErrors
      .qtyRework,
    "Jumlah rework harus berupa angka",
  );
});

test("pencatat hasil tidak boleh menjadi penentu QC", () => {
  const hasil = parseQcVerdictForm(formQc(), {
    qtyDiproses: "10.0000",
    hasilCreatedBy: PRODUKSI,
    actorId: PRODUKSI,
  });
  assert.equal(hasil.input, null);
  assert.equal(hasil.fieldErrors.actorId, PESAN_PEMISAHAN_QC);
});

test("keputusan harus sesuai pembagian hasil", () => {
  const hasil = parseQcVerdictForm(
    formQc({ qty_lulus: "0", qty_rework: "10", qty_reject: "0", keputusan: "QC_PASSED" }),
    {
      qtyDiproses: "10.0000",
      hasilCreatedBy: PRODUKSI,
      actorId: QC,
    },
  );
  assert.equal(hasil.input, null);
  assert.equal(hasil.fieldErrors.keputusan, PESAN_KEPUTUSAN_QC);
});
