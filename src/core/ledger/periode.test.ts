import assert from "node:assert/strict";
import test from "node:test";
import { isoWaktuJakarta } from "../../lib/format/date.ts";

import { parsePeriode, periodeSekarang } from "./periode.ts";

test("satu bulan kalender diterima dengan batas waktu Asia/Jakarta", () => {
  const hasil = parsePeriode("2026-11");
  assert.equal(hasil.ok, true);
  if (!hasil.ok) return;

  assert.equal(hasil.data.tahun, 2026);
  assert.equal(hasil.data.bulan, 11);
  assert.equal(hasil.data.label, "November 2026");
  assert.equal(hasil.data.mulai, isoWaktuJakarta("2026-11-01T00:00:00"));
  assert.equal(hasil.data.selesai, isoWaktuJakarta("2026-12-01T00:00:00"));
});

test("rentang lebih dari satu bulan ditolak dengan pesan satu bulan", () => {
  for (const nilai of ["2026-11,2026-12", "2026-11..2026-12", "2026-11/2026-12"]) {
    const hasil = parsePeriode(nilai);
    assert.equal(hasil.ok, false, nilai);
    if (hasil.ok) return;
    assert.match(hasil.message, /satu bulan/i);
  }
});

test("periode belum dipilih meminta pengguna memilih periode", () => {
  const hasil = parsePeriode(undefined);
  assert.equal(hasil.ok, false);
  if (hasil.ok) return;
  assert.match(hasil.message, /pilih periode/i);
});

test("format dan rentang bulan yang tidak sah ditolak", () => {
  for (const nilai of ["2026-1", "2026-00", "2026-13", "abc", "1999-12"]) {
    const hasil = parsePeriode(nilai);
    assert.equal(hasil.ok, false, nilai);
    if (hasil.ok) return;
    assert.match(hasil.message, /bulan kalender/i);
  }
});

test("periode sekarang memakai bulan kalender Asia/Jakarta", () => {
  const akhirOktoberUtc = new Date("2026-10-31T17:30:00Z");
  const hasil = periodeSekarang(akhirOktoberUtc);
  assert.equal(hasil.tahun, 2026);
  assert.equal(hasil.bulan, 11);
  assert.equal(hasil.label, "November 2026");
});

test("Desember bergulir ke Januari tahun berikutnya", () => {
  const hasil = parsePeriode("2026-12");
  assert.equal(hasil.ok, true);
  if (!hasil.ok) return;
  assert.equal(hasil.data.selesai, isoWaktuJakarta("2027-01-01T00:00:00"));
});
