import assert from "node:assert/strict";
import test from "node:test";

import {
  kartuJamKerjaSchema,
  parseKartuJamKerjaForm,
  PESAN_JAM_KERJA,
} from "./kartu-jam-kerja.ts";

const WO = "11111111-1111-4111-8111-111111111111";
const KARYAWAN = "22222222-2222-4222-8222-222222222222";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const nilai = {
    wo_id: WO,
    karyawan_id: KARYAWAN,
    tanggal: "2026-11-20",
    jam_kerja: "7.5000",
    tarif_per_jam: "85000",
    ...overrides,
  };
  for (const [kunci, isi] of Object.entries(nilai)) data.set(kunci, isi);
  return data;
}

test("kartu jam kerja valid mempertahankan jam empat desimal dan tarif bulat", () => {
  const hasil = parseKartuJamKerjaForm(form());
  assert.ok(hasil.input);
  assert.equal(hasil.input.jamKerja, "7.5000");
  assert.equal(hasil.input.tarifPerJam, "85000");
  assert.equal(hasil.input.tanggal, "2026-11-20");
});

test("jam kerja kosong, bukan angka, nol, dan terlalu presisi dibedakan", () => {
  assert.equal(
    parseKartuJamKerjaForm(form({ jam_kerja: "" })).fieldErrors.jamKerja,
    "Jam kerja wajib diisi",
  );
  assert.equal(
    parseKartuJamKerjaForm(form({ jam_kerja: "7 jam" })).fieldErrors.jamKerja,
    "Jam kerja harus berupa angka",
  );
  assert.equal(
    parseKartuJamKerjaForm(form({ jam_kerja: "0" })).fieldErrors.jamKerja,
    PESAN_JAM_KERJA,
  );
  assert.equal(
    parseKartuJamKerjaForm(form({ jam_kerja: "7.50001" })).fieldErrors.jamKerja,
    "Jam kerja maksimal 4 angka desimal",
  );
});

test("tarif per jam negatif dan karyawan wajib dipilih", () => {
  assert.equal(
    parseKartuJamKerjaForm(form({ tarif_per_jam: "-1" })).fieldErrors
      .tarifPerJam,
    "Tarif per jam tidak boleh negatif",
  );
  assert.equal(
    parseKartuJamKerjaForm(form({ karyawan_id: "" })).fieldErrors.karyawanId,
    "Karyawan wajib dipilih",
  );
  assert.equal(
    parseKartuJamKerjaForm(form({ tanggal: "2026-02-30" })).fieldErrors.tanggal,
    "Tanggal jam kerja tidak valid",
  );
});

test("tarif per jam rupiah bulat menolak sen", () => {
  for (const tarif of ["85000.50", "85000,50", "85000.001"]) {
    const hasil = parseKartuJamKerjaForm(form({ tarif_per_jam: tarif }));
    assert.equal(hasil.input, null, tarif);
    assert.equal(
      hasil.fieldErrors.tarifPerJam,
      "Tarif per jam harus bulat tanpa sen.",
      tarif,
    );
  }
  assert.equal(
    parseKartuJamKerjaForm(form({ tarif_per_jam: "" })).fieldErrors.tarifPerJam,
    "Tarif per jam wajib diisi",
  );
  assert.equal(
    parseKartuJamKerjaForm(form({ tarif_per_jam: "85 ribu" })).fieldErrors
      .tarifPerJam,
    "Tarif per jam harus berupa angka",
  );
});

test("skema menolak angka JavaScript yang kehilangan presisi", () => {
  const hasil = kartuJamKerjaSchema.safeParse({
    woId: WO,
    karyawanId: KARYAWAN,
    tanggal: "2026-11-20",
    jamKerja: 7.5,
    tarifPerJam: "85000",
    keterangan: null,
  });
  assert.equal(hasil.success, false);
  if (!hasil.success) {
    assert.equal(
      hasil.error.issues[0]?.message,
      "Jam kerja harus berupa angka",
    );
  }
});
