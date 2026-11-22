# FND-002 — Bukti Verifikasi

Tanggal: 2026-11-22. Lingkungan: Node 24.22.2, pnpm 10.18.3, Supabase CLI 3.2.0, PostgreSQL 17.12.

Reset dijalankan pada proyek Supabase lokal terisolasi `fnd002-schema-verify` di port `55432`, bukan container milik worktree lain. Workdir sementara: `/tmp/fnd002-supabase.nqQ3CK`.

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | Lulus | Setelah reset, tabel publik tepat `gudang`, `produk`, `profiles`, `satuan`; tidak ada tabel publik lain. |
| `AC-02` | Lulus | Dua `pnpm db:reset`; dump skema kanonis identik. Dump mentah hanya berbeda pada token acak di `\restrict`/`\unrestrict`; hanya baris tersebut dikecualikan sebelum `diff`. SHA-256 isi kanonis: `5569da6fffb56349d3365aaad40a61e025c5b7d987bb7e23db6e06f8c11ab2ad`. |
| `AC-03` | Lulus | `pnpm check:migrations`: `[check:migrations] ok — 2 berkas, nomor unik`. `git log --follow` menampilkan satu commit (`dc17e0b chore: bootstrap Next.js and Supabase`). SHA-256 `0001_initial.sql` dan versi merge-base sama: `4a8b036f6c9807c947e4b6dab4e2126ac476459feb6b58fd2b15a2603a68b0ea`. |
| `AC-04` | Lulus | Probe SQL transaksional ditolak oleh `fk_produk_satuan_dasar`; jumlah produk tetap `0` sebelum/sesudah. |
| `AC-05` | Lulus | Probe memverifikasi kode duplikat ditolak oleh `uq_satuan_kode`, `uq_produk_kode`, `uq_gudang_kode`; nama kosong setelah trim ditolak oleh `ck_satuan_nama_not_blank`, `ck_produk_nama_not_blank`, `ck_gudang_nama_not_blank`. Baris dengan `kode` atau `nama` NULL juga ditolak. |
| `AC-06` | Lulus | Query `information_schema.columns` menghasilkan `produk_stok_columns = 0`. |
| `AC-07` | Lulus | Peta di `04-design-contract.md`: `profiles` → `FND-003`; `satuan`, `produk`, `gudang` → `C-011` (DDL dibuat FND-002). Masing-masing tepat satu pemilik. |
| `AC-08` | Lulus | Masing-masing tabel baru memiliki empat kolom audit. `created_by`/`updated_by` bertipe UUID, nullable, tanpa FK. |
| `AC-09` | Lulus | `created_at`/`updated_at` bertipe `timestamp with time zone`, non-null, default `now()`; jumlah kolom `numeric` di tiga tabel = `0`. |

## Bukti tambahan

- Probe SQL memakai `BEGIN`/`ROLLBACK`; tidak ada baris uji yang tersimpan.
- ID UUID default `gen_random_uuid()` terpasang di ketiga tabel; insert tanpa ID menghasilkan UUID. Indeks FK `idx_produk_satuan_dasar_id` ada.
- `pnpm verify` lulus: lint, typecheck, `arch:check` (21 modul, 33 dependensi), dan `next build` (Next.js 16.4.6).
- Review pascaperubahan menemukan dua status dokumentasi yang tertinggal; readiness dan baris EPIC-FND diselaraskan. Follow-up menyatakan tidak ada kontradiksi status tersisa. Backlog dan EPIC-FND menandai FND-002 `done` pada 2026-11-22.
