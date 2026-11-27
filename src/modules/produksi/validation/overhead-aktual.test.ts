import assert from "node:assert/strict";
import test from "node:test";

import {
  overheadAktualSchema,
  parseOverheadAktualForm,
  PESAN_PERIODE,
} from "./overhead-aktual.ts";

const AKUN = "11111111-1111-4111-8111-111111111111";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    periode: "2026-11-01",
    akun_id: AKUN,
    nilai: "1500000",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

test("overhead aktual valid menerima rupiah bulat dengan padding sen nol", () => {
  const hasil = parseOverheadAktualForm(form({ nilai: "1500000.00" }));
  assert.ok(hasil.input);
  assert.equal(hasil.input.nilai, "1500000.00");
  assert.equal(hasil.input.periode, "2026-11-01");
  assert.equal(hasil.input.keterangan, null);
  const koma = parseOverheadAktualForm(form({ nilai: "1500000,00" }));
  assert.ok(koma.input);
  assert.equal(koma.input.nilai, "1500000.00");
});

test("nilai dengan sen ditolak memakai validator uang inti", () => {
  for (const nilai of ["1500000.50", "1500000,50", "0.01", "1.001"]) {
    const hasil = parseOverheadAktualForm(form({ nilai }));
    assert.equal(hasil.input, null, nilai);
    assert.equal(hasil.fieldErrors.nilai, "Nilai harus bulat tanpa sen.", nilai);
  }
});

test("nilai kosong, bukan angka, negatif, dan terlalu besar dibedakan", () => {
  assert.equal(
    parseOverheadAktualForm(form({ nilai: "" })).fieldErrors.nilai,
    "Nilai wajib diisi",
  );
  assert.equal(
    parseOverheadAktualForm(form({ nilai: "1e6" })).fieldErrors.nilai,
    "Nilai harus berupa angka",
  );
  assert.equal(
    parseOverheadAktualForm(form({ nilai: "-5" })).fieldErrors.nilai,
    "Nilai tidak boleh negatif",
  );
  assert.equal(
    parseOverheadAktualForm(form({ nilai: "1".repeat(17) })).fieldErrors.nilai,
    "Nilai terlalu besar",
  );
});

test("periode harus tanggal 1 bulan dan akun wajib dipilih", () => {
  assert.equal(
    parseOverheadAktualForm(form({ periode: "2026-11-15" })).fieldErrors
      .periode,
    PESAN_PERIODE,
  );
  assert.equal(
    parseOverheadAktualForm(form({ akun_id: "" })).fieldErrors.akunId,
    "Akun wajib dipilih",
  );
  const hasil = overheadAktualSchema.safeParse({
    periode: "2026-11-01",
    akunId: "bukan-uuid",
    nilai: "1000",
    keterangan: null,
  });
  assert.equal(hasil.success, false);
  if (!hasil.success) {
    assert.equal(hasil.error.issues[0]?.message, "Akun tidak valid");
  }
});
