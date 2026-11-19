# EPIC-FND — Fondasi Bersama

**Status:** `active`
**Pemilik:** tech lead
**Milestone:** M0
**Topologi:** serial

## Outcome

Empat kelompok bisa mulai bekerja di branch masing-masing tanpa mengarang skema, tanpa menulis jurnal dengan format sendiri, dan tanpa menghasilkan saldo stok yang berbeda untuk barang yang sama.

## Kenapa epic ini ada

Baseline repo saat ini `partial`:

| Ada | Belum ada |
|---|---|
| Next.js 16 + Supabase client | skema domain |
| Login + session SSR | peran & RLS |
| Migrasi `0001_initial.sql` (`profiles`) | dokumen, inventory, ledger |
| — | test, CI, seed |

Tanpa epic ini, empat siklus yang berjalan paralel akan menghasilkan empat definisi "jurnal" dan empat definisi "stok".

## Cakupan

| Area | Yang disediakan |
|---|---|
| Lingkungan | migrasi dapat diulang, seed, reset, gerbang mutu |
| Skema | tabel inti, relasi, constraint, index |
| Otorisasi | 12 peran staf + RLS |
| Dokumen | penomoran, state machine, `riwayat_status`, approval berjenjang |
| Inventory | `mutasi_stok`, `saldo_stok`, rata-rata bergerak, transfer, opname |
| Ledger | COA, `postJournal()`, periode akuntansi, validasi balance |
| UI | komponen bersama: tabel, form, status badge, dialog konfirmasi |
| Data | seed deterministik untuk semua skenario uji |

## Di luar cakupan

- Layar fitur per siklus — milik track masing-masing.
- Laporan keuangan dan tutup buku — `C-009`/`C-010`.
- Notifikasi — `C-012`.
- Deployment produksi.
- Integrasi e-Faktur.

## Ukuran keberhasilan

1. Satu kelompok bisa membuat dokumen baru dengan nomor benar tanpa menulis logika penomoran.
2. Satu kelompok bisa memposting jurnal tanpa menyentuh tabel jurnal langsung.
3. Satu kelompok bisa mengubah stok tanpa menghitung ulang saldo sendiri.
4. `FND-001`–`FND-006` selesai sebelum item modul pertama masuk `ready`; `FND-007`/`FND-008` boleh menyusul paralel.

## Anak requirement

| ID | Outcome | Sequence | Depends on | Status |
|---|---|---|---|---|
| `FND-001` | Lingkungan dapat diulang + gerbang mutu | 1 | — | `in progress` |
| `FND-002` | Skema domain inti + migrasi bernomor | 2 | `FND-001` | `idea` |
| `FND-003` | Autentikasi & 12 peran dengan RLS | 3 | `FND-002` | `idea` |
| `FND-004` | Dokumen: nomor, status, riwayat, approval | 4 | `FND-002`, `FND-003` | `idea` |
| `FND-005` | Inventory: mutasi, saldo, valuasi | 5 | `FND-002` | `idea` |
| `FND-006` | Ledger: COA, `postJournal()`, periode | 6 | `FND-002`, `FND-003` | `idea` |
| `FND-007` | UI kit bersama | 7 | `FND-002` | `idea` |
| `FND-008` | Seed deterministik + reset | 8 | `FND-001`, `FND-002` | `idea` |

Urutan 4–6 boleh ditukar bila ada alasan teknis. Yang tidak boleh: modul mulai sebelum `FND-004`, `FND-005`, dan `FND-006` selesai.

## Gate

Epic ini ditutup hanya kalau:

- Seluruh anak requirement `done` menurut `policies/definition-of-done.md`.
- Empat track modul sudah bisa membuat satu dokumen uji masing-masing tanpa menyentuh database manual.
- Migrasi berjalan dari database kosong tanpa langkah manual di dashboard.

Epic ditutup setelah **seluruh** `FND-*` `done`. Gate untuk memulai item modul lebih sempit: `FND-001`–`FND-006`, karena `FND-007`/`FND-008` boleh berjalan bersamaan dengan gelombang pertama.

## Risiko

| Risiko | Mitigasi |
|---|---|
| Fondasi molor, empat kelompok menganggur | `FND-001`–`FND-006` dibatasi pada yang benar-benar memblokir; `FND-007`/`FND-008` boleh berjalan sambil track dimulai |
| Skema berubah setelah track mulai | migrasi bersifat aditif; perubahan destruktif butuh keputusan tech lead |
| Tiap kelompok mengarang helper sendiri | helper hanya boleh lahir di `core/`, usulan lewat PR ke `main` |

## Catatan topologi

Epic ini **serial** karena satu pemilik. Ini bukan pilihan gaya, tapi konsekuensi: empat orang menulis satu fondasi bersama lebih lambat daripada satu orang menulis fondasi minimal yang benar.
