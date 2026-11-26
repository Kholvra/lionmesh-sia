# PG-002 — Bukti Verifikasi

Status: **`done` dengan utang bukti**. Stack `C-011`/`C-013` sudah di `main` (PR #35 + #37) dan PR #40 di-merge 2026-11-27 sebagai cherry-pick satu commit. Seluruh AC database belum dibuktikan (author tanpa Docker); pelacakan di `docs/tech-debt/pg-002-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan untuk item ini.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Core queries | `src/core/pengadaan/queries.ts`, `src/core/pengadaan/server.ts` |
| Modul | `src/modules/pengeluaran/permintaan/{schema,actions,queries,format,constants,form-state,screen}.ts(x)` |
| Komponen | `src/modules/pengeluaran/permintaan/components/*` |
| Route | `src/app/(app)/pengeluaran/permintaan/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/permintaan/schema.test.ts` |

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 46 test, termasuk 4 test schema PG-002 |
| `pnpm arch:check` | lolos — 165 modul, 449 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/permintaan` terdaftar |
| `pnpm check:migrations` | belum dijalankan ulang untuk branch stacked |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | belum | menunggu DB + C-011/C-013 di `main` |
| `AC-02` | belum | validasi form menolak tanpa baris; perlu uji UI |
| `AC-03` | belum | schema menolak qty 0/negatif; perlu uji UI |
| `AC-04` | belum | form Produksi + antrean Purchasing perlu uji DB |
| `AC-05` | belum | aktor diambil dari sesi di server action; perlu uji |
| `AC-06` | belum | transisi/riwayat perlu uji DB |
| `AC-07` | belum | pembatalan oleh pemohon perlu uji DB |
| `AC-08` | belum | `cekIzin` menolak peran tanpa hak; perlu uji UI |
| `AC-09` | belum | penomoran dari core; perlu uji DB |
| `AC-10` | belum | dua siklus reset + seed belum dijalankan |
| `AC-11` | belum | alasan batal wajib; perlu uji UI |
| `AC-12` | belum | pembatalan bukan pemohon ditolak core; perlu uji |
| `AC-13` | belum | revisi sukarela belum diimplementasikan |
| `AC-14` | belum | status final perlu uji DB |
| `AC-15` | belum | lintas item PG-005 |

## Yang belum / risiko

- Branch ini stacked; PR-nya tidak boleh dibuka ke `main` sebelum #35 dan #37 merge.
- Belum ada edit baris untuk status `DIAJUKAN`/`REVISI`; AC-06/AC-13 baru sebagian.
- Belum ada bukti UI 1280px.
- `getPermintaanPageData` memakai service-role context untuk membaca `dokumen` dan tabel pengadaan; modul memfilter pemohon untuk Gudang/Produksi.
- Belum ada navigasi dari shell ke `/pengeluaran/permintaan`; akses lewat URL langsung.
