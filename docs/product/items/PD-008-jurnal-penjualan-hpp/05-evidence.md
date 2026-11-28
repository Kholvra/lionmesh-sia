---
item_id: PD-008
status: verified
date: 2026-11-27
branch: pendapatan
---

# PD-008 Evidence — Jurnal Penjualan dan HPP

## Scope Delivered

1. **Migration (`supabase/migrations/0018_jurnal_penjualan_hpp.sql`)**
   - Registers `PENGIRIMAN` in `jenis_sumber_jurnal` and adds `jurnal_hpp_id` to `pengiriman`.
2. **HPP Journal Posting on Delivery (`src/modules/pendapatan/pengiriman/actions.ts`)**
   - Enforces `harga_rata > 0` before stock mutation (`AC-10`).
   - Calls `postJournal()` on `DIKIRIM` (`Dr hpp`, `Cr persediaan_barang_jadi`) with outbound inventory cost and stores `jurnal_hpp_id` (`AC-01`).
3. **Read-only Journal Viewer (`src/modules/pendapatan/jurnal/**`, `src/app/(app)/pendapatan/jurnal/**`)**
   - `/pendapatan/jurnal`: lists sales-cycle journals (`PENGIRIMAN`, `FAKTUR`, `PENERIMAAN`, `RETUR`, `PEMBALIKAN`) with source filter and search.
   - `/pendapatan/jurnal/[id]`: shows debit/credit lines, account roles, trigger, reversal link, and source document link.
   - No manual journal creation path (`AC-11`).

## Acceptance Criteria Check

- `AC-01`, `AC-10`: Verified via `scripts/verify-pd-008.mjs` (`kirimPengirimanAction` validates `harga_rata > 0` and posts balanced HPP journal).
- `AC-02` – `AC-04`, `AC-08`: Verified via `scripts/verify-pd-008.mjs` (`postJournal()` and `reverseJournal()` across `faktur`, `pembayaran`, and `retur`).
- `AC-05` – `AC-07`, `AC-11`: Enforced by `core/ledger` `postJournal()` and verified zero direct writes to `jurnal` / `jurnal_baris` in `src/modules/pendapatan/`.

## Automated Verification Results

Run on branch `pendapatan`:

- `pnpm.cmd check:migrations`
- `pnpm.cmd arch:check`
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `node scripts/verify-pd-008.mjs`
