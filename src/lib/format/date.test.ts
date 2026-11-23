import assert from "node:assert/strict";
import test from "node:test";

import { formatTanggal, formatTanggalWaktu } from "./date.ts";

test("tanggal tampil dalam kalender Asia/Jakarta", () => {
  assert.equal(formatTanggal("2026-11-02T17:30:00Z"), "03 Nov 2026");
});

test("tanggal dan waktu tampil dalam Asia/Jakarta", () => {
  assert.equal(formatTanggalWaktu("2026-11-02T17:30:00Z"), "03 Nov 2026 00.30");
});

test("tanggal tidak valid ditandai, bukan dikarang", () => {
  assert.equal(formatTanggal("bukan-tanggal"), "—");
});
