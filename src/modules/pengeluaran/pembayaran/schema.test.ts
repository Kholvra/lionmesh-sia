import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBatalPembayaran,
  parseCatatPembayaran,
  parseHasilTransfer,
  parseVerifikasi,
} from "./schema.ts";

const PEMASOK = "11111111-1111-4111-8111-111111111111";
const REKENING = "22222222-2222-4222-8222-222222222222";
const BAYAR = "33333333-3333-4333-8333-333333333333";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("pembayaran menerima nominal bilangan bulat", () => {
  const parsed = parseCatatPembayaran(
    form({
      pemasok_id: PEMASOK,
      rekening_bank_id: REKENING,
      nominal: "250000",
      tanggal: "2026-11-28",
    }),
  );
  assert.equal(parsed.input?.nominal, "250000");
});

test("nominal nol, negatif, dan pecahan ditolak", () => {
  for (const nominal of ["0", "-5", "1000.50", "abc", ""]) {
    const parsed = parseCatatPembayaran(
      form({
        pemasok_id: PEMASOK,
        rekening_bank_id: REKENING,
        nominal,
        tanggal: "2026-11-28",
      }),
    );
    assert.equal(parsed.input, null, `nominal ${nominal} should be rejected`);
    assert.ok(parsed.message);
  }
});

test("tanggal pembayaran wajib format ISO", () => {
  const parsed = parseCatatPembayaran(
    form({
      pemasok_id: PEMASOK,
      rekening_bank_id: REKENING,
      nominal: "1000",
      tanggal: "28-11-2026",
    }),
  );
  assert.equal(parsed.message, "Tanggal pembayaran wajib diisi");
});

test("verifikasi membutuhkan id dokumen", () => {
  assert.equal(parseVerifikasi(form({ id: BAYAR })).input?.dokumenId, BAYAR);
  assert.equal(parseVerifikasi(form({ id: "" })).input, null);
});

test("transfer gagal wajib alasan, berhasil tidak", () => {
  const gagal = parseHasilTransfer(
    form({ id: BAYAR, versi: "1", berhasil: "false", alasan: "  " }),
  );
  assert.equal(gagal.input, null);
  assert.equal(gagal.message, "Alasan kegagalan transfer wajib diisi");

  const berhasil = parseHasilTransfer(
    form({ id: BAYAR, versi: "1", berhasil: "true", alasan: "" }),
  );
  assert.equal(berhasil.input?.berhasil, true);
  assert.equal(berhasil.input?.alasan, null);
});

test("pembatalan pembayaran tanpa alasan ditolak", () => {
  const parsed = parseBatalPembayaran(form({ id: BAYAR, versi: "2", alasan: "" }));
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan pembatalan wajib diisi");
});
