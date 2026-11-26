import assert from "node:assert/strict";
import test from "node:test";
import { readAllPages } from "./pagination.ts";

test("membaca seluruh baris melampaui batas respons", async () => {
  const rows = Array.from({ length: 2001 }, (_, index) => index);
  const result = await readAllPages(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }));
  assert.deepEqual(result, { data: rows, error: null });
});

test("kesalahan halaman berikutnya tidak mengembalikan data parsial", async () => {
  const result = await readAllPages(async (from) => from === 0
    ? { data: Array.from({ length: 1000 }, (_, index) => index), error: null }
    : { data: null, error: { message: "gagal" } });
  assert.deepEqual(result, { data: [], error: "gagal" });
});
