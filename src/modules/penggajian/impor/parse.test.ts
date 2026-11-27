import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv } from "./parse.ts";
import type { ProfilPemetaan } from "./types.ts";

const PROFIL: ProfilPemetaan = {
  pemisah: ";",
  formatTanggal: "DD/MM/YYYY",
  kolomIdMesin: "ID",
  kolomTanggal: "Tanggal",
  kolomJamMasuk: "Masuk",
  kolomJamPulang: "Pulang",
  diubahOleh: "HR",
  diubahPada: "2026-11-01T00:00:00.000Z",
};

test("AC-01: berkas sesuai profil menjadi baris ISO", () => {
  const hasil = parseCsv("ID;Tanggal;Masuk;Pulang\nM-001;02/11/2026;08:00;17:00\n", PROFIL);
  assert.deepEqual(hasil, { ok: true, baris: [{ baris: 2, idMesin: "M-001", tanggal: "2026-11-02", jamMasuk: "08:00", jamPulang: "17:00" }] });
});

test("AC-02: format tidak sesuai profil ditolak sebelum simpan", () => {
  const hasil = parseCsv("UserID,Date,In,Out\nM-001,2026-11-02,08:00,17:00\n", PROFIL);
  assert.equal(hasil.ok, false);
  assert.match(hasil.ok ? "" : hasil.pesan, /Format berkas tidak sesuai profil/);
});

test("AC-04: satu baris rusak menggagalkan seluruh berkas", () => {
  const hasil = parseCsv("ID;Tanggal;Masuk;Pulang\nM-001;02/11/2026;08:00;17:00\nM-002;31/13/2026;08:00;17:00\n", PROFIL);
  assert.equal(hasil.ok, false);
  assert.match(hasil.ok ? "" : hasil.pesan, /Baris 3 rusak.*Seluruh berkas ditolak/);
});

test("AC-12: berkas tanpa baris data ditolak", () => {
  const hasil = parseCsv("ID;Tanggal;Masuk;Pulang\n", PROFIL);
  assert.deepEqual(hasil, { ok: false, pesan: "Berkas kosong: tidak ada baris data presensi." });
});
