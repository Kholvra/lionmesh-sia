import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getRentangBulan,
  hitungUmurDanBucket,
  validasiPeriodeBulan,
  validasiTanggalLaporan,
} from "./calc.ts";

describe("PD-009 calc — aging buckets & report date validation", () => {
  it("classifies invoices into the 5 aging buckets (AC-02)", () => {
    const lap = "2026-12-31";
    assert.equal(
      hitungUmurDanBucket("2026-12-31", lap).bucket.key,
      "BELUM_JATUH_TEMPO",
    );
    assert.equal(hitungUmurDanBucket("2026-12-21", lap).bucket.key, "1_30");
    assert.equal(hitungUmurDanBucket("2026-11-16", lap).bucket.key, "31_60");
    assert.equal(hitungUmurDanBucket("2026-10-02", lap).bucket.key, "61_90");
    assert.equal(hitungUmurDanBucket("2026-09-02", lap).bucket.key, "OVER_90");
  });

  it("rejects future period months and future report dates (AC-09, AC-11)", () => {
    assert.equal(
      validasiPeriodeBulan("", "2026-11-27"),
      "Pilih periode laporan.",
    );
    assert.equal(
      validasiPeriodeBulan("2026-12", "2026-11-27"),
      "Periode tidak boleh melebihi hari ini.",
    );
    assert.equal(validasiPeriodeBulan("2026-11", "2026-11-27"), null);

    assert.equal(
      validasiTanggalLaporan("2026-11-28", "2026-11-27"),
      "Tanggal laporan tidak boleh melebihi hari ini.",
    );
    assert.equal(validasiTanggalLaporan("2026-11-27", "2026-11-27"), null);
  });

  it("computes exact month start and end dates", () => {
    assert.deepEqual(getRentangBulan("2026-02"), {
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    assert.deepEqual(getRentangBulan("2026-10"), {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
  });
});
