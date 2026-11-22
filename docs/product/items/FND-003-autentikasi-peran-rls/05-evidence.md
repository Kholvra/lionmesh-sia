# FND-003 — Bukti Verifikasi

Pengujian Supabase dan skrip dilakukan pada 2026-11-22 di lingkungan lokal via `scripts/verify-fnd-003.mjs`. `pnpm verify` terakhir dijalankan ulang pada 2026-11-23 dengan URL dan publishable key placeholder setelah pembaruan UI.
- Versi Supabase CLI: 3.2.0
- Versi PostgreSQL: PostgreSQL 17 (Docker)
- Sesi JWT Expiry: 28800 detik (8 jam)

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | Lolos | GET tanpa cookie ke `/pengaturan` menghasilkan HTTP 307 ke `/login`; saat diikuti, hasil akhir HTTP 200 di `/login`. Halaman terlindungi tidak mengirim profil. |
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
- `node scripts/verify-fnd-003.mjs` pada proyek Supabase terisolasi: 12 pemeriksaan selesai. Saat skrip itu dijalankan, AC-01 dan AC-04 tertunda; uji HTTP manual setelahnya membuktikan AC-01, AC-04 tetap tertunda.
- `pnpm verify` (2026-11-23): lint, typecheck, arch:check (48 modul, 81 dependensi), dan build lolos tanpa kesalahan.

## Pemeriksaan UI dan sesi tambahan

- Viewport CSS 1280 × 900 (2026-11-23): panel kiri 352 CSS px (27,5%), lebar dokumen 1280 CSS px tanpa overflow; screenshot [`login-1280.png`](login-1280.png). Label terhubung ke input dan tombol kata sandi mengubah input menjadi teks.
- Proyek Supabase terisolasi: login nonaktif ditolak Auth; payload `updated_by` palsu diganti ID sesi. Token lama setelah pergantian peran tidak dapat membaca profil sendiri melalui REST. Database bersama tidak di-reset.
- Screenshot halaman `/pengaturan` belum tersedia: worktree ini tidak memiliki `.env.local`, Supabase lokal tidak berjalan, dan tidak ada sesi uji untuk membuka halaman setelah login.

## Uji HTTP halaman terlindungi

Tanggal 2026-11-22. Next.js 16.4.6 berjalan lokal pada port 3101 dengan Supabase URL dan publishable key placeholder; permintaan tidak membawa cookie sesi.

```text
curl --silent --show-error --dump-header - --output /dev/null http://127.0.0.1:3101/pengaturan
HTTP/1.1 307 Temporary Redirect
location: /login

curl --silent --show-error --location --output /dev/null --write-out 'HTTP %{http_code}\nURL %{url_effective}\n' http://127.0.0.1:3101/pengaturan
HTTP 200
URL http://127.0.0.1:3101/login
```

Halaman profil tidak dirender sebelum redirect. `instant = false` dipasang pada halaman karena pemeriksaan sesi membaca cookie pada waktu permintaan.

## Uji HTTP tambahan pada fixture terisolasi

Tanggal 2026-11-22. Proyek Supabase dan server Next.js berjalan terpisah secara lokal; fixture route sementara dihapus setelah uji.

- GET tanpa cookie ke fixture yang memanggil `requireSesi()` menghasilkan HTTP 307 dengan `Location: /login`. Saat pengujian historis itu dijalankan, halaman aplikasi terlindungi belum tersedia; route `/pengaturan` kini diuji terpisah di bagian sebelumnya.
- Pengujian fixture historis memakai `assertPeran("Penjualan")` dan menghasilkan HTTP 403 untuk akun Gudang. API guard sejak itu diubah agar memakai matriks izin; AC-04 belum diuji ulang pada aksi fitur sebenarnya.

Fixture route sementara dibuat di `src/app/fnd003-verify/route.ts` dengan isi berikut dan dihapus setelah pengujian:

```ts
import { assertPeran, requireSesi } from "@/lib/auth/server";

export async function GET() {
  await requireSesi();
  return Response.json({ secret: "protected" });
}

export async function POST() {
  const result = await assertPeran("Penjualan");
  return Response.json(result, { status: result.ok ? 200 : 403 });
}
```

Untuk mengulang, siapkan Supabase lokal terisolasi dengan migrasi FND-003 dan akun uji Gudang, lalu jalankan server Next.js yang terhubung ke proyek itu. `curl -i http://localhost:<port>/fnd003-verify` tanpa cookie menghasilkan 307 ke `/login`. Masuk sebagai Gudang di browser, lalu kirim `fetch('/fnd003-verify', { method: 'POST' })` dari halaman yang sama; hasil 403. Jangan gunakan akun produksi untuk pengujian.

- Audit terhadap `matriks-izin.md` menemukan aksi menerima bahan dan barang jadi belum memiliki entri izin tersendiri; keduanya ditambahkan untuk peran Gudang. Uji endpoint modul tetap dilakukan saat fitur terkait tersedia.
