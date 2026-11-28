import assert from "node:assert/strict";
import test from "node:test";

import type { PenawaranHarga, PermintaanPembelianItem } from "@/core/pengadaan";
import { barisDariPermintaan, hitungTotalPo } from "./baris.ts";
import { parsePembatalanPo, parseTerbitkanPo } from "./schema.ts";

const ITEM_A = "11111111-1111-4111-8111-111111111111";
const ITEM_B = "22222222-2222-4222-8222-222222222222";
const PEMASOK = "33333333-3333-4333-8333-333333333333";
const PERMINTAAN = "44444444-4444-4444-8444-444444444444";
const PO = "55555555-5555-4555-8555-555555555555";
const PRODUK = "66666666-6666-4666-8666-666666666666";
const SATUAN = "77777777-7777-4777-8777-777777777777";

function item(id: string, qty: string, urutan: number): PermintaanPembelianItem {
  return {
    id,
    permintaan_id: PERMINTAAN,
    produk_id: PRODUK,
    satuan_id: SATUAN,
    qty,
    urutan,
  };
}

function quote(itemId: string, harga: string, tanggal: string): PenawaranHarga {
  return {
    id: `${itemId}-${tanggal}`,
    permintaanId: PERMINTAAN,
    itemId,
    pemasokId: PEMASOK,
    harga,
    tanggal,
    createdAt: `${tanggal}T00:00:00Z`,
  };
}

function form(values: Record<string, string>, arrays: Record<string, string[]> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  for (const [key, list] of Object.entries(arrays)) {
    for (const value of list) data.append(key, value);
  }
  return data;
}

test("total PO menghitung net, PPN per baris, dan total", () => {
  // 2 x 1.500,00 = 3.000,00 net; PPN 11% = 330,00; total 3.330,00.
  const total = hitungTotalPo([{ qty: "2", harga: "1500" }], "11");
  assert.equal(total.net, "3000.00");
  assert.equal(total.ppn, "330.00");
  assert.equal(total.total, "3330.00");
});

test("total PO menjumlahkan beberapa baris dan membulatkan per baris", () => {
  const total = hitungTotalPo(
    [
      { qty: "1.5", harga: "1000" },
      { qty: "3", harga: "333.33" },
    ],
    "11",
  );
  // 1.500,00 + 999,99 net; PPN 165,00 + 110,00; total 1.665,00 + 1.109,99.
  assert.equal(total.net, "2499.99");
  assert.equal(total.total, "2774.99");
});

test("PPN nol tidak menambah nilai", () => {
  const total = hitungTotalPo([{ qty: "2", harga: "1000" }], "0");
  assert.equal(total.total, "2000.00");
});

test("baris PO memakai harga pembanding terbaru pemasok terpilih", () => {
  const baris = barisDariPermintaan(
    [item(ITEM_A, "2", 1), item(ITEM_B, "1", 2)],
    [
      quote(ITEM_A, "120", "2026-11-20"),
      quote(ITEM_A, "100", "2026-11-10"),
      quote(ITEM_B, "50", "2026-11-10"),
    ],
    PEMASOK,
  );

  assert.equal(baris.length, 2);
  assert.equal(baris[0]?.harga, "120");
  assert.equal(baris[1]?.harga, "50");
});

test("barang tanpa harga pembanding tidak masuk baris PO", () => {
  const baris = barisDariPermintaan(
    [item(ITEM_A, "2", 1), item(ITEM_B, "1", 2)],
    [quote(ITEM_A, "100", "2026-11-10")],
    PEMASOK,
  );
  assert.equal(baris.length, 1);
});

test("penerbitan PO menolak qty nol dan tanpa baris", () => {
  const nol = parseTerbitkanPo(
    form(
      { permintaan_id: PERMINTAAN, versi: "3", tanggal: "2026-11-27" },
      { item_id: [ITEM_A], qty: ["0"] },
    ),
  );
  assert.equal(nol.input, null);
  assert.equal(nol.message, "Qty harus lebih dari 0");

  const kosong = parseTerbitkanPo(
    form({ permintaan_id: PERMINTAAN, versi: "3", tanggal: "2026-11-27" }),
  );
  assert.equal(kosong.input, null);
  assert.equal(kosong.message, "PO harus memuat minimal satu barang");
});

test("penerbitan PO menerima baris dengan koma desimal", () => {
  const parsed = parseTerbitkanPo(
    form(
      { permintaan_id: PERMINTAAN, versi: "3", tanggal: "2026-11-27" },
      { item_id: [ITEM_A, ITEM_B], qty: ["2,5", "1"] },
    ),
  );
  assert.equal(parsed.input?.baris.length, 2);
  assert.equal(parsed.input?.baris[0]?.qty, "2.5");
});

test("pembatalan PO tanpa alasan ditolak", () => {
  const parsed = parsePembatalanPo(
    form({ id: PO, versi: "1", alasan: "   " }),
  );
  assert.equal(parsed.input, null);
  assert.equal(parsed.message, "Alasan pembatalan wajib diisi");
});
