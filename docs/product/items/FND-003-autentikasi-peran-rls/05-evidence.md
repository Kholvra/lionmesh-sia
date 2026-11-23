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
| `AC-13` | Lolos lokal | Sesi sembilan jam ditolak RLS dan refresh dalam uji hook terisolasi; konfigurasi deployment masih harus diverifikasi. |
| `AC-14` | Lolos | `enable_signup = false` di `supabase/config.toml`, UI `/login` tidak menyediakan pendaftaran mandiri, dan API `signUp` menolak pendaftaran langsung. |

Verifikasi mutu:
- `pnpm check:migrations`: ok (3 berkas migrasi)
- `node scripts/verify-fnd-003.mjs` pada proyek Supabase terisolasi: 12 pemeriksaan selesai. Saat skrip itu dijalankan, AC-01 dan AC-04 tertunda; uji HTTP manual setelahnya membuktikan AC-01, AC-04 tetap tertunda.
- `pnpm verify` (2026-11-23): lint, typecheck, arch:check (48 modul, 81 dependensi), dan build lolos tanpa kesalahan.

## Pemeriksaan UI dan sesi tambahan

- Viewport CSS 1280 × 900 (2026-11-23): panel kiri 560 CSS px (43,75%), konten kanan 420 px, field 36 px, tombol 40 px sesuai `LAYOUTS.md`; lebar dokumen 1280 px tanpa overflow. Screenshot [`login-1280.png`](login-1280.png). Label terhubung ke input dan tombol kata sandi mengubah input menjadi teks.
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

## Pengujian keamanan tambahan — 2026-11-23

Lingkungan: Node v24.22.2, pnpm 10.18.3, Supabase CLI 3.2.0; Supabase dan PostgreSQL berjalan pada proyek lokal terisolasi `fnd003-security-verify`, dengan migrasi 0001–0004. Server Next.js di port 3195 menggunakan kredensial proyek sementara melalui environment proses. Database proyek lain tidak di-reset atau ditulis.

Fixture route sementara memanggil `requireSesi()` pada GET dan `assertIzin("buat_pesanan")` pada POST. Akun uji dibuat pada proyek terisolasi dan menggunakan cookie SSR nyata. Hasil pengujian:

- Tanpa sesi, GET `/pengaturan` menghasilkan HTTP 307 ke `/login`.
- Akun Gudang mengirim POST langsung untuk aksi Penjualan: HTTP 403 dengan pesan `Peran Anda tidak berwenang melakukan tindakan ini.` Akun Penjualan dengan sesi baru: HTTP 200.
- Setelah peran diubah, cookie lama menghasilkan HTTP 403 pada fixture dan HTTP 307 ke `/login` pada `/pengaturan`; login ulang menerima peran baru.
- Setelah penonaktifan, cookie lama menghasilkan HTTP 403 pada fixture dan HTTP 307 ke `/login` pada `/pengaturan`; login ulang ditolak.
- Uji UI dengan browser headless: login aktif menuju `/pengaturan` dan menampilkan peran; akun tidak ada, sandi salah, dan akun nonaktif masing-masing menampilkan `Username atau password salah.`
- Endpoint Supabase Auth langsung mengembalikan HTTP 400 untuk ketiganya, tetapi kode JSON berbeda: `invalid_credentials` untuk akun tidak ada/sandi salah dan `user_banned` untuk akun nonaktif. Karena browser memanggil Auth langsung, respons jaringan dapat membedakan kedua keadaan. Perlu keputusan/perbaikan agar tidak mengungkap status akun; jangan menganggap kesamaan pesan UI saja sebagai bukti AC-12 sepenuhnya.

AC-04 masih memerlukan uji pada aksi fitur sebenarnya; fixture membuktikan guard tetapi bukan endpoint bisnis. Audit seluruh pasangan aksi/peran berdasarkan sumber matriks yang independen juga masih diperlukan untuk AC-03. Fixture, akun uji, dan proyek terisolasi dihapus setelah pengujian.

`pnpm verify` pada worktree yang sama selesai dengan exit code 0 setelah file tipe Next.js yang dihasilkan untuk fixture sementara dibersihkan; lint, typecheck, pemeriksaan arsitektur, dan build lulus.

### Verifikasi kebocoran status dengan sandi salah

Pada 2026-11-23, pengujian di proyek Supabase terisolasi membandingkan empat permintaan `signInWithPassword` langsung. Email tidak terdaftar dan akun aktif dengan sandi salah menghasilkan HTTP 400 / `invalid_credentials`; akun nonaktif menghasilkan HTTP 400 / `user_banned`, baik saat sandinya salah maupun benar. Karena kode berbeda bahkan tanpa mengetahui sandi, respons jaringan dapat digunakan untuk membedakan akun nonaktif. AC-12 tetap parsial dan PR belum layak ditandai siap sampai batas akses endpoint atau mekanisme Auth diperbaiki dan diuji ulang.

### Eksperimen Auth hook lokal

Pada 2026-11-23, eksperimen terpisah menggunakan salinan migrasi dan konfigurasi Supabase lokal: penonaktifan tidak lagi mengatur `banned_until`, sedangkan custom access-token hook menolak penerbitan token bagi profil nonaktif. Endpoint langsung mengembalikan HTTP 400 / `invalid_credentials` untuk email tidak ada dan profil nonaktif dengan sandi salah; profil nonaktif dengan sandi benar ditolak HTTP 400 dengan kode `unknown`. Tidak ada sesi diterbitkan untuk akun nonaktif. Ini menunjukkan mitigasi terhadap enumerasi tanpa sandi, tetapi belum membuktikan AC-12 jika kode respons harus identik untuk semua kondisi. Hook memerlukan konfigurasi pada lingkungan deployment, yang jenisnya belum ditentukan. Eksperimen tidak diterapkan pada migrasi proyek atau konfigurasi produksi.


### Implementasi Auth hook dan batas sesi — 2026-11-23

Migrasi fix-forward `0006` menyediakan custom access-token hook dan membatasi `is_session_current()` berdasarkan `auth.sessions.created_at`. Konfigurasi lokal mengaktifkan hook dan timebox delapan jam. `node scripts/verify-fnd-003-hook.mjs` terhadap proyek Supabase lokal terisolasi menghasilkan 10 pemeriksaan lulus: login aktif, pencabutan sesi, penolakan token lama, respons identik untuk akun tidak ada dan nonaktif dengan sandi salah, penolakan token saat nonaktif dengan sandi benar, pesan/status generik, reaktivasi, penolakan akses dan refresh untuk sesi berumur sembilan jam, dan pemeliharaan ban administratif bertanggal lain. Pengujian memanipulasi tanggal sesi di database khusus uji; tidak menunggu sembilan jam.

Batas bukti: kode JSON Auth langsung untuk akun nonaktif dengan sandi benar adalah `unknown`, sedangkan sandi salah atau akun tidak ada menghasilkan `invalid_credentials`; HTTP dan pesannya identik. AC-12 yang mensyaratkan kode identik tetap parsial. Eksperimen ini menghilangkan kebocoran status akun tanpa mengetahui sandi, bukan menyamakan seluruh kode Auth.

**Gate deployment:** migrasi menghapus sentinel ban yang ditetapkan migrasi 0003 dan bergantung pada hook aktif untuk mencegah penerbitan token akun nonaktif. Lakukan rollout dalam jendela pemeliharaan dengan akses login dan refresh ditutup: terapkan migrasi, aktifkan hook di Auth deployment yang bersangkutan, uji hook serta timebox, login nonaktif, refresh, dan RLS, lalu baru buka akses. `supabase/config.toml` saja tidak mengonfigurasi Supabase Cloud secara otomatis. Jika penyedia tidak dapat menutup akses selama konfigurasi, gunakan deployment bertahap yang diverifikasi lebih dulu; jangan terapkan migrasi ini secara langsung. Migrasi 0005 FND-005 harus diterapkan lebih dahulu agar riwayat migrasi tetap berurutan.
