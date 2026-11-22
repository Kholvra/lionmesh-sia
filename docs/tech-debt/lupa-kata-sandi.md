# Lupa kata sandi

## Kondisi saat ini

FND-003 menyediakan login tetapi belum menyediakan alur pemulihan kata sandi. Branch `auth` memiliki rancangan halaman `/lupa-kata-sandi`, tetapi pengiriman tautannya masih berupa simulasi; halaman itu belum masuk `main`.

## Pekerjaan yang dibutuhkan

Buat item backlog dan paket requirement sebelum implementasi. Tentukan pengelolaan akun, perilaku untuk email terdaftar maupun tidak terdaftar, masa berlaku dan penggunaan ulang tautan, tujuan pengalihan, serta batas percobaan. Implementasikan pengiriman tautan dan penggantian kata sandi melalui Supabase Auth, lalu uji alur berhasil, tautan kedaluwarsa, kesalahan, dan pencegahan pengungkapan keberadaan akun.

## Dampak

Pengguna yang lupa kata sandi belum bisa memulihkan akses secara mandiri dan perlu menghubungi pengelola akun. Jangan tampilkan pesan bahwa tautan telah dikirim jika pengirimannya hanya disimulasikan.
