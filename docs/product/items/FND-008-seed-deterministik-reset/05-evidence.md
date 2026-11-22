# FND-008 — Bukti Verifikasi

Tanggal: 2026-11-22. Lingkungan: Node v24.22.2, pnpm 10.18.3, Supabase CLI lokal di Docker, database `127.0.0.1:54322`, branch `fnd-008-seed-deterministik-reset`.

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | Lulus | Dua reset dan seed di Supabase terisolasi menghasilkan snapshot satuan, gudang, 13 UUID profil dan peran, serta versi `0003` yang identik. Hash sandi memiliki salt acak. |
| `AC-02` | Lulus | `pnpm db:seed` kedua keluar 1; pesan `Database sudah berisi seed. Jalankan pnpm db:reset terlebih dahulu.` |
| `AC-03` | Lulus dengan pengecualian tercatat | `gen_salt('bf')` menggunakan salt acak untuk hash sandi; kunci dan data profil tetap deterministik. |
| `AC-04` | Lulus | UUID literal sama pada kedua snapshot AC-01. |
| `AC-05` | Lulus | Pada Supabase lokal terisolasi, seed menghasilkan 13 akun dengan 13 peran berbeda; seluruh 13 akun berhasil login melalui endpoint Auth menggunakan sandi dari variabel lingkungan. |
| `AC-06` | Lulus untuk skema saat ini | `to_regclass` mengembalikan null untuk `mutasi_stok`, `riwayat_status`, dan `jurnal`; berkas seed FND-008 hanya memasukkan `satuan` dan `gudang`. Item pemilik tabel memverifikasi tabelnya saat tersedia. |
| `AC-07` | Lulus | `SUPABASE_DB_URL=postgresql://postgres@198.51.100.1:54322/postgres pnpm db:seed` keluar 1 dengan `Seed hanya boleh dijalankan di lingkungan lokal.`; guard berhenti sebelum koneksi. |
| `AC-08` | Lulus | Dengan marker terpasang `0002`, versi repo sementara diubah ke `0003`; `pnpm db:seed` keluar 1 dan menyebut versi berbeda, marker tetap `0002`. Setelah `pnpm db:reset`, `pnpm db:seed` berhasil dan mencatat `0002`. |
| `AC-09` | Lulus | `anon` melihat 0 baris di `_seed_meta`; insert ditolak. `relrowsecurity=true`, policy berjumlah 0. |

## Atomicity tambahan

Berkas SQL probe sementara yang melanggar constraint nama gudang dijalankan setelah insert master. `pnpm db:seed` keluar 1 dan meminta reset; setelah rollback, `_seed_meta` belum terbentuk dan jumlah `satuan` serta `gudang` tetap 0. Berkas probe dihapus, lalu reset dan seed normal berhasil.

## Gate proyek

| Perintah | Hasil |
|---|---|
| `node --check scripts/db-seed.mjs && node --check scripts/db-seed-snapshot.mjs && node --check scripts/db-guard.mjs` | Lulus; exit 0 |
| `pnpm check:migrations` | Lulus; 2 migrasi, nomor unik |
| `pnpm verify` | Lulus; lint, typecheck, arch check (21 modul / 33 dependensi), dan build Next.js 16.4.6 |
| `git diff --check` | Lulus; tidak ada whitespace error |

Tidak ada test runner baru. Pemeriksaan perilaku memakai perintah lokal yang dapat diulang dan query snapshot.

## Perbaikan setelah review

- `SUPABASE_DB_URL=postgresql://postgres@127.0.0.1:1/postgres pnpm db:seed` berhenti dengan exit 1 dan pesan `Tidak bisa terhubung ke database lokal`, tanpa `ReferenceError`.
- `pnpm verify` dijalankan ulang setelah perbaikan dan keluar 0.

## Pemeriksaan terhadap skema FND-003

- Pada proyek Supabase terisolasi dengan migrasi 0001–0003, dua kali reset lokal diikuti `pnpm db:seed` menghasilkan snapshot `satuan`, `gudang`, dan versi yang identik. Seed kedua tanpa reset ditolak dengan exit code 1 dan pesan yang menyebut `pnpm db:reset`.
- Pada pemeriksaan sebelum berkas seed akun ditambahkan, `profiles = 0` dan peran berbeda = 0. Hasil terkini setelah penambahan tercatat di bawah.

## Akun uji lokal (2026-11-22)

- Tech lead menyetujui alamat `peran@lionmesh.test` dan sandi yang diberikan melalui `FND_TEST_PASSWORD`; sandi tidak disimpan di repo atau bukti.
- Dua siklus reset dan seed pada proyek Supabase terisolasi menghasilkan snapshot master, UUID profil, dan 13 peran yang identik (versi seed `0003`). Ketiga belas akun berhasil login melalui Auth. Seed ulang tanpa reset ditolak dengan exit code 1.
- `extensions.gen_salt('bf')` sengaja menggunakan salt acak untuk keamanan hash sandi. Hash berbeda antar-run, sedangkan identitas akun dan data bisnis tetap deterministik; ini pengecualian AC-03 yang dicatat secara eksplisit.
