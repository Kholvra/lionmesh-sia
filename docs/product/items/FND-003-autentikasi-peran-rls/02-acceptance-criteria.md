# FND-003 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang. Akun uji memakai kata sandi lokal dari seed (`FND-008`, `OQ-08-03`); kata sandi tidak ditulis di bukti.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Permintaan tanpa sesi ke halaman terlindungi diarahkan ke `/login` dan tidak menampilkan data. | Buka jendela tanpa cookie sesi, akses `/pengaturan`, catat URL akhir dan bahwa tidak ada data. |
| `AC-02` | Pengguna dengan sesi sah tetapi tanpa peran tidak membaca tabel domain (`satuan`, `produk`, `gudang`, dan tabel domain lain yang ada). | Di database lokal, buat akun uji dengan `peran` kosong. Masuk, jalankan query baca ke setiap tabel domain lewat klien Supabase dengan sesi itu. Hasil kosong atau ditolak. |
| `AC-03` | Setiap peran hanya melakukan aksi yang diizinkan matriksnya, termasuk peran Karyawan. | Untuk setiap pasangan peran dan aksi di `policies/matriks-izin.md` (`D-33`, `D-53`): jalankan aksi dengan akun peran itu, catat diterima atau ditolak. Untuk aksi yang layarnya belum ada, uji lewat fungsi izin dan catat hasilnya. |
| `AC-04` | Aksi yang tidak diizinkan ditolak meski tombol disembunyikan di klien. | Dengan akun peran tidak berwenang, kirim permintaan langsung (mis. `curl` ke endpoint aksi dengan token sesi itu). Harus ditolak dengan pesan "Peran Anda tidak berwenang melakukan tindakan ini." |
| `AC-05` | Perubahan peran atau penonaktifan mencabut sesi lama (`D-48`); masuk ulang memberi peran baru. | Masuk sebagai peran A. Ubah peran akun ke B di `profiles`. Kirim permintaan dengan sesi lama: ditolak, diarahkan ke `/login`. Masuk ulang: respons mengikuti peran B. Ulangi untuk penonaktifan: sesi lama ditolak dan masuk ditolak. |
| `AC-06` | Nilai `actor_id` atau `user_id` dari klien diabaikan. | Kirim permintaan tulis dengan `actor_id` palsu di badan. Baris yang tersimpan mencatat identitas sesi. *Dijalankan dengan aksi tulis pertama `FND-004`; pada item ini cukup dengan `updated_by` `profiles` lewat permintaan uji.* |
| `AC-07` | Tepat 13 nilai peran yang sah (12 staf dan Karyawan). | Jalankan `select count(*)` dari sumber daftar peran (enum atau constraint). Hasil 13; daftar sama dengan `policies/matriks-izin.md` (`D-33`, `D-53`). |
| `AC-08` | Peran di luar daftar ditolak. | Coba simpan `peran` = `ADMIN` ke `profiles`. Harus ditolak oleh database dengan nama constraint. |
| `AC-09` | Akun nonaktif tidak bisa masuk atau melakukan aksi; login gagal memakai pesan generik. | Nonaktifkan akun uji. Coba masuk: ditolak dengan "Username atau password salah." Dengan sesi lama: aksi ditolak (lihat AC-05). |
| `AC-10` | Satu akun hanya punya satu peran (`D-48`). | Tidak ada tabel penghubung banyak-ke-banyak; `profiles` memakai satu baris per `user_id` dengan satu kolom `peran`. Coba insert baris kedua untuk `user_id` yang sama: ditolak oleh primary key atau unique constraint; nama constraint muncul di pesan. |
| `AC-11` | Karyawan hanya membaca dan menulis baris miliknya; menu dan data lain tidak tersedia (`D-53`). | Masuk sebagai Karyawan dengan `karyawan_id` A. Baca `profiles` milik akun lain: kosong. Coba menulis baris milik akun lain: ditolak. Pada item ini diuji dengan `profiles` sendiri; diulang pada tabel presensi saat `GJ-002` selesai. Akses URL menu lain ditolak. |
| `AC-12` | Login gagal tidak menyebut akun atau sandi yang salah (`D-42`). | Tiga kasus: akun tidak ada, sandi salah, akun nonaktif. Pesan dan kode respons identik. |
| `AC-13` | Sesi berakhir 8 jam (`D-42`). | Atur masa berlaku sesi uji ke batas yang sama dengan konfigurasi produksi (8 jam). Catat nilai konfigurasi; permintaan setelah batas ditolak. |
| `AC-14` | Pendaftaran mandiri tidak tersedia (`OQ-03-05`). | Buka `/login`: tidak ada tautan daftar. Kirim permintaan daftar langsung: ditolak. |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | daftar perintah dan akun uji yang dipakai (tanpa kata sandi); versi Supabase CLI dan PostgreSQL; nilai masa berlaku sesi |
| Keluaran | status HTTP dan pesan untuk tiap skenario AC-01 sampai AC-14 |
| Selisih | bila ada aksi yang menyimpang dari matriks, tulis alasannya |

## Yang tidak diuji di sini

- Approval nominal dan berjenjang (`FND-004`).
- Isi aturan posting jurnal (`FND-006`).
- Pembatasan Karyawan pada tabel presensi (`GJ-002`).
- Pemisahan tugas spesifik di pemilik aksi (`PD-004`, `GJ-006`, `PG-005`).
- Kinerja RLS pada volume besar.
