# FND-003 — Bukti Verifikasi

Dijalankan pada 2026-11-22 di lingkungan lokal via `scripts/verify-fnd-003.mjs` dan `pnpm verify`.
- Versi Supabase CLI: 3.2.0
- Versi PostgreSQL: PostgreSQL 17 (Docker)
- Sesi JWT Expiry: 28800 detik (8 jam)

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | Tertunda | Belum ada halaman terlindungi untuk diuji lewat HTTP; skrip lama hanya mensimulasikan redirect. |
| `AC-02` | Lolos | Pengguna dengan sesi sah tanpa peran membaca `satuan` (0 baris), `produk` (0 baris), `gudang` (0 baris); seluruhnya kosong oleh RLS. |
| `AC-03` | Parsial | Fungsi izin diuji terhadap daftar yang sama; pencocokan independen seluruh matriks dan endpoint aksi belum dibuktikan. |
| `AC-04` | Tertunda | Belum ada endpoint aksi terlindungi untuk uji permintaan langsung; simulasi lama tidak membuktikan AC. |
| `AC-05` | Parsial | Perubahan peran dan penonaktifan menghapus sesi. Uji REST token lama setelah perubahan peran menghasilkan HTTP 200 dengan profil sendiri tidak terlihat; uji redirect halaman dan skenario penonaktifan lengkap masih diperlukan. |
| `AC-06` | Lolos | Permintaan REST update profil membawa updated_by palsu; nilai tersimpan adalah ID sesi (uji Supabase lokal terisolasi). |
| `AC-07` | Lolos | Constraint `ck_profiles_peran` pada tabel `profiles` memuat tepat 13 nilai peran sah (12 staf + Karyawan). |
| `AC-08` | Lolos | Insert peran di luar daftar (misal `'ADMIN'`) ditolak oleh database dengan error constraint `ck_profiles_peran`. |
| `AC-09` | Parsial | Endpoint Auth menolak login akun nonaktif dan UI mengonversi kegagalan menjadi pesan generik; uji aksi dengan sesi lama masih perlu diperluas. |
| `AC-10` | Lolos | Satu akun hanya punya satu peran; percobaan insert baris kedua dengan `id` sama ditolak primary key `profiles_pkey`. |
| `AC-11` | Lolos | Karyawan hanya membaca profil sendiri (1 baris), profil orang lain (0 baris), dan tabel domain `satuan` (0 baris). |
| `AC-12` | Parsial | Tiga hasil login API dikonversi menjadi pesan generik di skrip; penyamaan kode respons endpoint aplikasi belum diuji. |
| `AC-13` | Lolos | Konfigurasi `jwt_expiry = 28800` di `supabase/config.toml` (tepat 8 jam, D-42). |
| `AC-14` | Lolos | `enable_signup = false` di `supabase/config.toml`, UI `/login` tidak menyediakan pendaftaran mandiri, dan API `signUp` menolak pendaftaran langsung. |

Verifikasi mutu:
- `pnpm check:migrations`: ok (3 berkas migrasi)
- `node scripts/verify-fnd-003.mjs` pada proyek Supabase terisolasi: 12 pemeriksaan selesai, AC-01 dan AC-04 tertunda; hasil lulus skrip bukan bukti penuh untuk AC parsial di atas.
- `pnpm verify`: lint, typecheck, arch:check, build lolos tanpa kesalahan

## Pemeriksaan UI dan sesi tambahan

- Viewport CSS 1280 × 900: panel kiri 560 CSS px, lebar dokumen 1280 CSS px; screenshot [`login-1280.png`](login-1280.png). Label terhubung ke input dan tombol Tampilkan mengubah input sandi menjadi teks.
- Proyek Supabase terisolasi: login nonaktif ditolak Auth; payload `updated_by` palsu diganti ID sesi. Token lama setelah pergantian peran tidak dapat membaca profil sendiri melalui REST. Database bersama tidak di-reset.

## Uji HTTP tambahan pada fixture terisolasi

Tanggal 2026-11-22. Proyek Supabase dan server Next.js berjalan terpisah secara lokal; fixture route sementara dihapus setelah uji.

- GET tanpa cookie ke fixture yang memanggil `requireSesi()` menghasilkan HTTP 307 dengan `Location: /login`. Ini membuktikan guard pada route handler; halaman aplikasi terlindungi yang sebenarnya belum tersedia untuk AC-01.
- Login sebagai akun uji Gudang, kemudian POST langsung ke fixture yang memanggil `assertPeran("Penjualan")`, menghasilkan HTTP 403 dengan `{"ok":false,"message":"Peran Anda tidak berwenang melakukan tindakan ini."}`. Ini membuktikan guard pada fixture; AC-04 perlu diulang pada aksi fitur sebenarnya.
