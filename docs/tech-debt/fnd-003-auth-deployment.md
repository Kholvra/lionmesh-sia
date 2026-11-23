# FND-003: keamanan Auth dan deployment

## Kondisi saat ini

Auth hook menolak token akun nonaktif dan membatasi sesi delapan jam. Untuk akun nonaktif dengan sandi salah, respons Auth sama seperti akun yang tidak ada. Jika sandi benar, pesan dan status HTTP tetap generik, tetapi kode JSON Auth `unknown` berbeda dari `invalid_credentials`; AC-12 yang mensyaratkan kode identik belum terpenuhi. Pengujian izin aksi menggunakan route uji, bukan semua aksi bisnis sebenarnya. Matriks izin juga masih perlu diuji secara independen.

## Pekerjaan yang dibutuhkan

Tentukan hosting Supabase dan mekanisme untuk menyamakan kode respons Auth langsung, kemudian ulangi uji akun tidak ada, sandi salah, dan akun nonaktif. Uji setiap aksi bisnis dan matriks peran ketika implementasinya tersedia. Verifikasi batas sesi delapan jam dan konfigurasi Auth pada lingkungan deployment.

Sebelum mengaktifkan pengguna, terapkan migrasi `0005` lalu `0006`. Migrasi `0006` menghapus ban sentinel dan bergantung pada Auth hook: saat rollout, tutup login dan refresh, terapkan migrasi, aktifkan `public.active_profile_access_token_hook` di konfigurasi Auth deployment, lalu uji penolakan token akun nonaktif, pencabutan sesi, refresh dan RLS sebelum membuka akses. `supabase/config.toml` tidak otomatis mengubah konfigurasi Supabase Cloud. Jika akses tidak dapat ditutup, siapkan dan verifikasi rollout bertahap sebelum menerapkan migrasi.

## Dampak

Jangan terapkan migrasi tanpa mengaktifkan dan menguji hook: akun nonaktif dapat memperoleh token selama hook tidak aktif, meskipun kebijakan RLS tetap memeriksa status profil. Kode Auth yang berbeda saat sandi benar dan cakupan aksi yang belum diuji tetap menjadi risiko terbuka.
