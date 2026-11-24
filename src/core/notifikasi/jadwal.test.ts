import assert from "node:assert/strict";
import test from "node:test";

import {
  JEDA_PERCOBAAN_MENIT,
  MAKS_PERCOBAAN,
  bolehDicoba,
  hitungPercobaan,
} from "./jadwal.ts";

// PT-07: tiga percobaan otomatis dengan jeda 5, 15, dan 60 menit.
const SEKARANG = new Date("2026-11-24T09:00:00.000Z");

function waktu(iso: string): string {
  return new Date(iso).toISOString();
}

test("jeda percobaan mengikuti PT-07 dan menjadi satu sumber", () => {
  assert.deepEqual([...JEDA_PERCOBAAN_MENIT], [5, 15, 60]);
  assert.equal(MAKS_PERCOBAAN, 4);
});

test("percobaan pertama yang berhasil menandai terkirim tanpa jadwal berikutnya", () => {
  const hasil = hitungPercobaan({ berhasil: true, percobaan: 0, sekarang: SEKARANG });

  assert.equal(hasil.status, "terkirim");
  assert.equal(hasil.percobaan, 1);
  assert.equal(hasil.alasan, null);
  assert.equal(hasil.jadwalBerikutnya, null);
});

test("kegagalan pertama menunggu lima menit", () => {
  const hasil = hitungPercobaan({
    alasan: "Koneksi penyedia email gagal.",
    berhasil: false,
    percobaan: 0,
    sekarang: SEKARANG,
  });

  assert.equal(hasil.status, "menunggu");
  assert.equal(hasil.percobaan, 1);
  assert.equal(hasil.alasan, "Koneksi penyedia email gagal.");
  assert.equal(hasil.jadwalBerikutnya, waktu("2026-11-24T09:05:00.000Z"));
});

test("kegagalan kedua menunggu lima belas menit", () => {
  const hasil = hitungPercobaan({
    berhasil: false,
    percobaan: 1,
    sekarang: SEKARANG,
  });

  assert.equal(hasil.status, "menunggu");
  assert.equal(hasil.percobaan, 2);
  assert.equal(hasil.jadwalBerikutnya, waktu("2026-11-24T09:15:00.000Z"));
});

test("kegagalan ketiga menunggu enam puluh menit", () => {
  const hasil = hitungPercobaan({
    berhasil: false,
    percobaan: 2,
    sekarang: SEKARANG,
  });

  assert.equal(hasil.status, "menunggu");
  assert.equal(hasil.percobaan, 3);
  assert.equal(hasil.jadwalBerikutnya, waktu("2026-11-24T10:00:00.000Z"));
});

test("kegagalan keempat menandai gagal dengan alasan yang bisa dibaca", () => {
  const hasil = hitungPercobaan({
    berhasil: false,
    percobaan: 3,
    sekarang: SEKARANG,
  });

  assert.equal(hasil.status, "gagal");
  assert.equal(hasil.percobaan, 4);
  assert.equal(hasil.jadwalBerikutnya, null);
  assert.match(hasil.alasan ?? "", /tiga percobaan otomatis/);
});

test("kegagalan tanpa pesan penyedia tetap punya alasan terbaca", () => {
  const hasil = hitungPercobaan({
    alasan: null,
    berhasil: false,
    percobaan: 0,
    sekarang: SEKARANG,
  });

  assert.equal(hasil.status, "menunggu");
  assert.ok((hasil.alasan ?? "").trim().length > 0);
});

test("status gagal dan terkirim tidak pernah dicoba lagi (INV-03, AC-08)", () => {
  assert.equal(bolehDicoba("menunggu"), true);
  assert.equal(bolehDicoba("terkirim"), false);
  assert.equal(bolehDicoba("gagal"), false);
  assert.equal(bolehDicoba("perlu_pemeriksaan"), false);
});
