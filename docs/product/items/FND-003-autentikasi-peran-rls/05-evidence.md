# FND-003 — Bukti Verifikasi

Dijalankan pada 2026-11-22 di lingkungan lokal via `scripts/verify-fnd-003.mjs` dan `pnpm verify`.
- Versi Supabase CLI: 3.2.0
- Versi PostgreSQL: PostgreSQL 17 (Docker)
- Sesi JWT Expiry: 28800 detik (8 jam)

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | Lolos | Permintaan tanpa sesi diarahkan ke `/login` dan tidak menampilkan data domain (`requireSesi`). |
| `AC-02` | Lolos | Pengguna dengan sesi sah tanpa peran membaca `satuan` (0 baris), `produk` (0 baris), `gudang` (0 baris); seluruhnya kosong oleh RLS. |
| `AC-03` | Lolos | Matriks izin v0 valid untuk seluruh 63 aksi domain dan 13 peran sesuai `policies/matriks-izin.md` (D-33, D-53). |
| `AC-04` | Lolos | Aksi langsung tanpa izin ditolak dengan pesan standar: `"Peran Anda tidak berwenang melakukan tindakan ini."` |
| `AC-05` | Lolos | Sesi aktif di `auth.sessions` otomatis dicabut seketika saat `peran` berubah atau saat akun dinonaktifkan (`aktif = false`) via trigger database (D-48). |
| `AC-06` | Belum terbukti | Skrip sebelumnya memakai simulasi objek, bukan permintaan tulis terhadap database. Perlu uji payload palsu pada aksi nyata. |
| `AC-07` | Lolos | Constraint `ck_profiles_peran` pada tabel `profiles` memuat tepat 13 nilai peran sah (12 staf + Karyawan). |
| `AC-08` | Lolos | Insert peran di luar daftar (misal `'ADMIN'`) ditolak oleh database dengan error constraint `ck_profiles_peran`. |
| `AC-09` | Perlu uji endpoint | Trigger database mengatur `auth.users.banned_until` saat akun dinonaktifkan; uji SQL terisolasi lulus. Penolakan melalui endpoint Auth belum diverifikasi setelah perubahan. |
| `AC-10` | Lolos | Satu akun hanya punya satu peran; percobaan insert baris kedua dengan `id` sama ditolak primary key `profiles_pkey`. |
| `AC-11` | Lolos | Karyawan hanya membaca profil sendiri (1 baris), profil orang lain (0 baris), dan tabel domain `satuan` (0 baris). |
| `AC-12` | Lolos | Tiga kasus login gagal (akun tidak ada, sandi salah, akun nonaktif) menghasilkan pesan dan perlakuan identik: `"Username atau password salah."` (D-42). |
| `AC-13` | Lolos | Konfigurasi `jwt_expiry = 28800` di `supabase/config.toml` (tepat 8 jam, D-42). |
| `AC-14` | Lolos | `enable_signup = false` di `supabase/config.toml`, UI `/login` tidak menyediakan pendaftaran mandiri, dan API `signUp` menolak pendaftaran langsung. |

Verifikasi mutu:
- `pnpm check:migrations`: ok (3 berkas migrasi)
- `node scripts/verify-fnd-003.mjs`: hasil sebelumnya perlu diulang; AC-06 memakai simulasi dan bukan bukti perilaku
- `pnpm verify`: lint, typecheck, arch:check, build lolos tanpa kesalahan
