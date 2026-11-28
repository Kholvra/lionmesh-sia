---
item_id: PD-007
status: verified
date: 2026-11-27
branch: pendapatan
---

# PD-007 Evidence — Retur Penjualan dan Kredit Memo

## Scope Delivered

1. **Migration Proposal (`supabase/migrations/0017_retur_penjualan.sql`)**
   - Registers document type `RJ` (Retur Penjualan), status transitions (`DIAJUKAN`, `DISETUJUI`, `SELESAI`, `DITOLAK`, `DIBATALKAN`), and journal source `RETUR`.
   - Creates `retur_penjualan` and `retur_penjualan_item` with RLS policies.
2. **Core Calculation & Server Actions (`src/modules/pendapatan/retur/`)**
   - `calc.ts`: computes credit memo DPP, PPN, and total (`hitungKreditMemoBaris`), stock-in valuation at `harga_rata` (`hitungNilaiMasukStok`), and cumulative returnable qty (`hitungSisaBolehRetur`).
   - `actions.ts`: `createReturAction` (Penjualan/Gudang, `DIAJUKAN`), `setujuiReturAction` & `tolakReturAction` (Accounting, segregation-of-duties guard against creator), `batalkanReturAction` (creator before QC), and `catatQcReturAction` (QC: `DITOLAK` when `qtyLulus = 0`, or `SELESAI` when `qtyLulus > 0` with `catatMutasi` MASUK, `postJournal` Kredit Memo & Pembalik HPP, and `faktur.sisa_piutang` update).
3. **UI Screens & Routes (`src/app/(app)/pendapatan/retur/**`)**
   - `/pendapatan/retur`: 12-col list view with status filter and search.
   - `/pendapatan/retur/baru`: 7/5 entry form with invoice selection, return qty validation, and live credit memo estimate.
   - `/pendapatan/retur/[nomor]`: 8/4 detail/verification screen with summary strip, item table, Accounting approval/reject, QC inspection form, creator cancel, and status audit timeline.

## Acceptance Criteria Check

- `AC-01` – `AC-02`: Verified via `scripts/verify-pd-007.mjs` (RJ document type, invoice-line validation, no stock/journal before approval).
- `AC-03` – `AC-07`, `AC-10` – `AC-11`: Verified via `calc.test.ts` and `scripts/verify-pd-007.mjs` (QC pass/fail paths, credit memo calculation, `harga_rata` stock-in, cumulative return limit).
- `AC-08` – `AC-09`, `AC-12` – `AC-14`: Verified via `scripts/verify-pd-007.mjs` (segregation of duties, audit history, cancellation before QC, QC status guard, locked period check).

## Automated Verification Results

Run on branch `pendapatan`:

- `pnpm.cmd check:migrations`
- `pnpm.cmd arch:check`
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `node scripts/verify-pd-007.mjs`
