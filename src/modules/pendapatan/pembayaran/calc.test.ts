import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  alokasiFifoPembayaran,
  hitungStatusFakturSetelahAlokasi,
  round2,
} from "./calc.ts";

describe("PD-006 calc — FIFO allocation & faktur status", () => {
  it("rounds monetary values to 2 decimals", () => {
    assert.equal(round2(1000.125), 1000.13);
    assert.equal(round2(1000.124), 1000.12);
  });

  it("allocates payment FIFO to oldest invoice first (partial & full)", () => {
    const hasil = alokasiFifoPembayaran(1500000, [
      {
        id: "inv-2",
        tanggalFaktur: "2026-12-05",
        sisaPiutang: 800000,
      },
      {
        id: "inv-1",
        tanggalFaktur: "2026-12-01",
        sisaPiutang: 1000000,
      },
    ]);

    assert.equal(hasil.totalAllocated, 1500000);
    assert.equal(hasil.allocations.length, 2);

    assert.equal(hasil.allocations[0].fakturId, "inv-1");
    assert.equal(hasil.allocations[0].nominal, 1000000);

    assert.equal(hasil.allocations[1].fakturId, "inv-2");
    assert.equal(hasil.allocations[1].nominal, 500000);
  });

  it("handles overpayment remainder when nominal exceeds open invoices", () => {
    const hasil = alokasiFifoPembayaran(2000000, [
      {
        id: "inv-1",
        tanggalFaktur: "2026-12-01",
        sisaPiutang: 1200000,
      },
    ]);

    assert.equal(hasil.totalAllocated, 1200000);
    assert.equal(hasil.allocations.length, 1);
    assert.equal(hasil.allocations[0].fakturId, "inv-1");
    assert.equal(hasil.allocations[0].nominal, 1200000);
  });

  it("calculates faktur status after allocation or cancellation reversal", () => {
    assert.equal(hitungStatusFakturSetelahAlokasi(1000000, 0), "LUNAS");
    assert.equal(
      hitungStatusFakturSetelahAlokasi(1000000, 400000),
      "SEBAGIAN_LUNAS",
    );
    assert.equal(
      hitungStatusFakturSetelahAlokasi(1000000, 1000000),
      "DITERBITKAN",
    );
  });
});
