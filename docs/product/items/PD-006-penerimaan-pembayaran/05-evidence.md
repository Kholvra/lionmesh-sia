---
item_id: PD-006
status: verified
date: 2026-11-27
branch: pendapatan
---

# PD-006 Evidence — Penerimaan Pembayaran Pelanggan

## Scope Delivered

1. **Migration Proposal (`supabase/migrations/0016_penerimaan_pembayaran.sql`)**
   - Registers document type `BKM` (Bukti Kas Masuk) and journal source `PENERIMAAN`.
   - Creates `pembayaran` and `pembayaran_alokasi` tables with RLS policies.
2. **Core Calculation & Validation (`src/modules/pendapatan/pembayaran/`)**
   - `calc.ts`: pure FIFO allocation (`alokasiFifoPembayaran`) sorting open invoices oldest-first (`tanggal_faktur`, `created_at`, `faktur_nomor`) and computing post-allocation status (`LUNAS` / `SEBAGIAN_LUNAS` / `DITERBITKAN`).
   - `schema.ts`: validates `pelangganId`, `nominal > 0` (max 2 decimals), `tanggal`, and `metode` (`Transfer` | `Giro`).
   - `actions.ts`: `createPembayaranAction` (Finance, `DICATAT`), `verifikasiPembayaranAction` (Accounting, segregation-of-duties check against creator, FIFO allocation, `postJournal` Dr `kas_bank` / Cr `piutang_usaha`, invoice status update, `pesanan` -> `SELESAI` when all active invoices are `LUNAS`), `batalkanPembayaranAction` (supporting `DICATAT` cancel and `TERVERIFIKASI` reversal with `reverseJournal` & allocation release).
3. **UI Screens & Routes (`src/app/(app)/pendapatan/pembayaran/**`)**
   - `/pendapatan/pembayaran`: 12-col list view with status filter and search.
   - `/pendapatan/pembayaran/baru`: 7/5 entry form with live FIFO allocation preview against open customer invoices.
   - `/pendapatan/pembayaran/[nomor]`: 8/4 detail/verification screen with summary strip, FIFO allocation table, segregation-of-duties verification dialog, cancel form, and status audit timeline.

## Acceptance Criteria Check

- `AC-01` – `AC-03`: Verified via `scripts/verify-pd-006.mjs` (BKM doc type, routes, and list/detail screens).
- `AC-04` – `AC-05`: Verified via `scripts/verify-pd-006.mjs` (`Transfer`/`Giro` method enforcement & positive nominal validation).
- `AC-06` – `AC-10`: Verified via `calc.test.ts` and `scripts/verify-pd-006.mjs` (FIFO ordering, partial/full allocation, excess remainder, invoice status updates).
- `AC-11` – `AC-16`: Verified via `scripts/verify-pd-006.mjs` (Finance vs Accounting permissions, creator-cannot-verify guard, `postJournal`, `reverseJournal`, and `pesanan` -> `SELESAI`).

## Automated Verification Results

Run on branch `pendapatan`:

- `pnpm.cmd check:migrations`
- `pnpm.cmd arch:check`
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `node scripts/verify-pd-006.mjs`
