# C-012 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Ketika kejadian pemicu terjadi (daftar PT-01, `[USULAN-AGEN]`), penerima yang berhak melihat notifikasi in-app di daftarnya setelah memuat ulang halaman. | Jalankan `pnpm db:reset` lalu `pnpm db:seed`. Picu satu kejadian uji. Login sebagai penerima, buka daftar notifikasi, catat isi. |
| `AC-02` | Pengguna yang tidak berhak tidak melihat notifikasi itu di daftarnya (penerima per PT-02, `[USULAN-AGEN]`). | Dari data `AC-01`, login sebagai pengguna lain. Buka daftar. Pastikan notifikasi tidak ada. |
| `AC-03` | Notifikasi email untuk kejadian yang ditandai kanal email terkirim ke alamat penerima lewat adaptor tunggal di core (PT-03, `[USULAN-AGEN]`), dan antrean menampilkan status `terkirim`. | Picu kejadian uji dengan penyedia email uji. Buka antrean kirim. Catat status dan alamat tujuan. |
| `AC-04` | Email yang gagal setelah tiga percobaan otomatis ditandai `gagal` dengan alasan yang bisa dibaca (PT-07, `[USULAN-AGEN]`). | Picu kirim dengan alamat tidak valid. Tunggu tiga percobaan. Buka antrean. Catat status, jumlah percobaan, dan alasan. |
| `AC-05` | Email untuk penerima tanpa alamat email ditandai `gagal`, tetapi notifikasi in-app tetap muncul. | Buat penerima tanpa alamat email. Picu kejadian. Periksa antrean dan daftar in-app. |
| `AC-06` | Kegagalan penyedia email tidak membatalkan transaksi pemicu. `[USULAN]` | Matikan penyedia email uji. Picu kejadian dari dokumen. Pastikan dokumen tersimpan dengan status yang benar dan notifikasi `menunggu`. |
| `AC-07` | Notifikasi yang sudah dibaca ditandai `sudah dibaca`. `[USULAN]` | Buka satu notifikasi. Refresh daftar. Pastikan statusnya berubah. |
| `AC-08` | Tidak ada kirim ulang manual dan tidak ada transisi dari `gagal` ke `menunggu` di versi awal (PT-07). | Cari transisi `gagal` → `menunggu` di kode dan layar. Hasilnya nol. |
| `AC-09` | Isi email tidak memuat angka keuangan. Isinya judul kejadian, nomor dokumen, dan tautan (PT-05, `[USULAN-AGEN]`). | Picu kejadian dari dokumen yang punya nominal. Buka isi email uji. Pastikan tidak ada angka nominal. |
| `AC-10` | Pengguna tidak bisa membuka data lewat tautan notifikasi bila tidak berhak atas dokumen itu. | Dari notifikasi milik penerima A, login sebagai pengguna B dan buka tautan. Ditolak. |

## Edge cases (optional)

- Penerima dengan notifikasi lebih dari satu kejadian: daftar tampil urut waktu `[USULAN]`.
- Kirim ulang email gagal: tidak ada di versi awal (AC-08).

## Verifiability

- AC-01, AC-02, AC-05, AC-07, AC-10 → langkah uji dari layar dengan dua sesi login.
- AC-03, AC-04 → status di antrean kirim, dibandingkan dengan catatan penyedia uji.
- AC-06 → matikan penyedia uji, bandingkan status dokumen sebelum dan sesudah.
- AC-08 → pencarian kode yang bisa diulang.
- AC-09 → pemeriksaan isi payload email.
