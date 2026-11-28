---
item_id: PD-009
status: verified
date: 2026-11-27
branch: pendapatan
---

# PD-009 Evidence — Laporan Penjualan, Piutang, dan Kas

## Scope Delivered

1. **Report Calculations & Queries (`src/modules/pendapatan/laporan/`)**
   - `calc.ts`: 5 aging buckets (`BELUM_JATUH_TEMPO`, `1_30`, `31_60`, `61_90`, `OVER_90`), `validasiPeriodeBulan`, `validasiTanggalLaporan`, `getRentangBulan`.
   - `queries.ts`: live queries (`AC-08`, `AC-12` — no materialized report tables):
     - `getLaporanPenjualan`: reconciles `jurnal_baris` on `penjualan` account role (`AC-04`), computes net sales per customer and per product (`AC-01`, `AC-10`), and displays cancelled invoices with 0 value (`AC-05`).
     - `getLaporanPiutang`: classifies open invoices into aging buckets at report date (`AC-02`).
     - `getLaporanKas`: reads debit `jurnal_baris` on `kas_bank` account role (`AC-03`).
2. **UI Screens & Routes (`src/app/(app)/pendapatan/laporan/**`)**
   - `/pendapatan/laporan` -> redirects to `/pendapatan/laporan/penjualan`.
   - `/pendapatan/laporan/penjualan` (`lihat_laporan_penjualan`).
   - `/pendapatan/laporan/piutang` (`lihat_piutang`).
   - `/pendapatan/laporan/kas` (`lihat_laporan_kas`).

## Acceptance Criteria Check

- `AC-01`, `AC-03` – `AC-05`, `AC-08`, `AC-10`, `AC-12`: Verified via `scripts/verify-pd-009.mjs`.
- `AC-02`, `AC-09`, `AC-11`: Verified via `calc.test.ts` and `scripts/verify-pd-009.mjs`.
- `AC-06` – `AC-07`: Verified via `scripts/verify-pd-009.mjs` (empty state & role guards).

## Automated Verification Results

Run on branch `pendapatan`:

- `pnpm.cmd check:migrations`
- `pnpm.cmd arch:check`
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `node scripts/verify-pd-009.mjs`
