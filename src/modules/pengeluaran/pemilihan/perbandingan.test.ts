import assert from "node:assert/strict";
import test from "node:test";

import type { PenawaranHarga, PermintaanPembelianItem } from "@/core/pengadaan";
import { hitungPerbandingan, perluAlasan } from "./perbandingan.ts";
import { parsePenawaran, parsePenetapan } from "./schema.ts";

const ITEM_A = "11111111-1111-4111-8111-111111111111";
const ITEM_B = "22222222-2222-4222-8222-222222222222";
const PEMASOK_A = "33333333-3333-4333-8333-333333333333";
const PEMASOK_B = "44444444-4444-4444-8444-444444444444";
const PERMINTAAN = "55555555-5555-4555-8555-555555555555";
const PRODUK = "66666666-6666-4666-8666-666666666666";
const SATUAN = "77777777-7777-4777-8777-777777777777";

function item(id: string, urutan: number): PermintaanPembelianItem {
  return {
    id,
    permintaan_id: PERMINTAAN,
    produk_id: PRODUK,
    satuan_id: SATUAN,
    qty: "2",
    urutan,
  };
}

function harga(
  id: string,
  itemId: string,
  pemasokId: string,
  nilai: string,
  tanggal: string,
): PenawaranHarga {
  return {
    id,
    permintaanId: PERMINTAAN,
    itemId,
    pemasokId,
    harga: nilai,
    tanggal,
    createdAt: `${tanggal}T00:00:00Z`,
  };
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("total memakai harga terbaru per barang", () => {
  const penawaran = [
    harga("1", ITEM_A, PEMASOK_A, "120", "2026-11-20"),
    harga("2", ITEM_A, PEMASOK_A, "100", "2026-11-10"),
    harga("3", ITEM_B, PEMASOK_A, "50", "2026-11-10"),
    harga("4", ITEM_A, PEMASOK_B, "90", "2026-11-10"),
    harga("5", ITEM_B, PEMASOK_B, "70", "2026-11-10"),
  ];

  const hasil = hitungPerbandingan([item(ITEM_A, 1), item(ITEM_B, 2)], penawaran);
  const totalA = hasil.total.find((row) => row.pemasokId === PEMASOK_A);
  const totalB = hasil.total.find((row) => row.pemasokId === PEMASOK_B);

  // 120 + 50 = 170 (the 100 quote from an older date is history, not current).
  assert.equal(totalA?.total, "170.00");
  assert.equal(totalB?.total, "160.00");
  assert.equal(totalA?.termurah, false);
  assert.equal(totalB?.termurah, true);
});

test("pemasok tanpa harga lengkap tidak punya total dan tidak ditandai termurah", () => {
  const penawaran = [
    harga("1", ITEM_A, PEMASOK_A, "100", "2026-11-10"),
    harga("2", ITEM_A, PEMASOK_B, "90", "2026-11-10"),
    harga("3", ITEM_B, PEMASOK_B, "10", "2026-11-10"),
  ];

  const hasil = hitungPerbandingan([item(ITEM_A, 1), item(ITEM_B, 2)], penawaran);
  const totalA = hasil.total.find((row) => row.pemasokId === PEMASOK_A);

  assert.equal(totalA?.lengkap, false);
  assert.equal(totalA?.total, null);
  assert.equal(totalA?.termurah, false);
  assert.equal(perluAlasan(hasil, PEMASOK_A), false);
});

test("harga terendah per barang menandai semua nilai yang sama", () => {
  const penawaran = [
    harga("1", ITEM_A, PEMASOK_A, "100", "2026-11-10"),
    harga("2", ITEM_A, PEMASOK_B, "100", "2026-11-10"),
  ];

  const hasil = hitungPerbandingan([item(ITEM_A, 1)], penawaran);
  const baris = hasil.baris[0];

  assert.ok(baris);
  assert.deepEqual([...baris.termurah].sort(), [PEMASOK_A, PEMASOK_B].sort());
});

test("alasan wajib hanya untuk pemasok lengkap yang bukan termurah", () => {
  const penawaran = [
    harga("1", ITEM_A, PEMASOK_A, "150", "2026-11-10"),
    harga("2", ITEM_A, PEMASOK_B, "100", "2026-11-10"),
  ];

  const hasil = hitungPerbandingan([item(ITEM_A, 1)], penawaran);
  assert.equal(perluAlasan(hasil, PEMASOK_A), true);
  assert.equal(perluAlasan(hasil, PEMASOK_B), false);
});

test("harga pembanding menolak nol dan bukan angka", () => {
  for (const nilai of ["0", "0,00", "-5", "abc", "1.234"]) {
    const parsed = parsePenawaran(
      form({
        permintaan_id: PERMINTAAN,
        item_id: ITEM_A,
        pemasok_id: PEMASOK_A,
        harga: nilai,
        tanggal: "2026-11-27",
      }),
    );
    assert.equal(parsed.input, null, `harga ${nilai} should be rejected`);
    assert.ok(parsed.message);
  }
});

test("harga pembanding menerima koma desimal", () => {
  const parsed = parsePenawaran(
    form({
      permintaan_id: PERMINTAAN,
      item_id: ITEM_A,
      pemasok_id: PEMASOK_A,
      harga: "1500,5",
      tanggal: "2026-11-27",
    }),
  );
  assert.equal(parsed.input?.harga, "1500.5");
});

test("penetapan tanpa pemasok ditolak", () => {
  const parsed = parsePenetapan(form({ permintaan_id: PERMINTAAN, versi: "2", alasan: "" }));
  assert.equal(parsed.input, null);
  assert.ok(parsed.message);
});

test("penetapan mengosongkan alasan kosong menjadi null", () => {
  const parsed = parsePenetapan(
    form({ permintaan_id: PERMINTAAN, versi: "2", pemasok_id: PEMASOK_A, alasan: "   " }),
  );
  assert.deepEqual(parsed.input, {
    permintaanId: PERMINTAAN,
    versi: 2,
    pemasokId: PEMASOK_A,
    alasan: null,
  });
});
