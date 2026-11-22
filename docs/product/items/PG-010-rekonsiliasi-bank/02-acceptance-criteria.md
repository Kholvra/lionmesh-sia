# PG-010 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Rujukan `R-xx` menunjuk aturan di `01-requirement.md`.

Langkah dasar: `pnpm db:reset` lalu `pnpm db:seed`, login sebagai Accounting (peran D-33). Siapkan berkas CSV uji dengan kolom sesuai profil pemetaan. Profil pemetaan riil mengikuti hasil `DISC-002`; seed memakai satu rekening dan beberapa baris jurnal kas dari transaksi seed.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Berkas mutasi yang valid diimpor dan setiap baris tersimpan sebagai mutasi. Menguji R-01 dan POST-01. | Impor berkas uji. Hitung baris tersimpan. Bandingkan dengan baris berkas. |
| `AC-02` | Mengimpor ulang berkas yang sama ditolak; jumlah mutasi tidak berubah. Menguji R-03 dan INV-04. | Impor berkas yang sama dua kali. Hitung mutasi: sama dengan AC-01. Catat pesan kedua impor. |
| `AC-03` | Berkas dengan format tidak dikenali ditolak dengan pesan yang menyebut format yang diharapkan. Menguji R-02 dan B-01. | Impor berkas salah format. Catat pesan. Cek tidak ada mutasi tersimpan. |
| `AC-04` | Baris dengan nominal atau tanggal tidak terbaca menolak seluruh impor dan pesan menyebut nomor baris. Menguji R-02 dan PRE-01. | Sisipkan satu baris rusak di berkas uji. Impor. Catat pesan. Cek tidak ada mutasi tersimpan dari berkas itu. |
| `AC-05` | Mutasi dengan nominal, tanggal dalam jendela, dan referensi yang sama dengan baris jurnal kas ditandai `COCOK`. Menguji R-04 dan POST-02. | Impor mutasi yang dibuat dari transaksi seed. Cek status `COCOK` dan baris jurnal terkait. |
| `AC-06` | Mutasi tanpa pasangan tampil sebagai `BELUM_COCOK` dengan nominalnya dalam daftar. Menguji R-05 dan POST-03. | Impor mutasi tanpa transaksi seed. Cek daftar belum cocok. |
| `AC-07` | Baris jurnal kas tanpa mutasi pasangan tampil sebagai `BELUM_COCOK` di daftar sisi buku. Menguji R-05 dan POST-03. | Pastikan satu baris jurnal kas tanpa mutasi. Cek daftar sisi buku. |
| `AC-08` | Pencocokan otomatis hanya satu lawan satu. Mutasi yang cocok dengan dua baris jurnal ditandai dan tidak dipasangkan otomatis. Menguji R-04 dan INV-02. | Siapkan dua baris jurnal dengan nominal dan tanggal yang sama untuk satu mutasi. Jalankan pencocokan. Cek tidak ada pasangan otomatis, dan kasus ditandai. |
| `AC-09` | Rekonsiliasi tidak mengubah saldo utang, saldo kas, atau jurnal yang sudah ada. Menguji R-07 dan POST-04. | Catat saldo utang, saldo kas, dan jumlah jurnal. Jalankan impor dan pencocokan. Bandingkan: tidak berubah. |
| `AC-10` | Rekonsiliasi tidak membuat jurnal apa pun, termasuk untuk selisih. Menguji R-06 dan POST-05. | Buat mutasi yang tidak cocok dan tandai `SELISIH`. Cek jumlah jurnal sebelum dan sesudah: tidak berubah. |
| `AC-11` | Perubahan status pencocokan tampil di riwayat dengan aktor dan waktu. Menguji R-11. | Lakukan satu pasangan manual dan satu penandaan `SELISIH`. Buka riwayat. Cek baris dengan aktor dan waktu. |
| `AC-12` | Seluruh alur AC-01 dan AC-05 dapat dijalankan dari UI tanpa skrip. | Ulangi melalui layar aplikasi saja. Catat bahwa tidak ada skrip. |
| `AC-13` | Mutasi di luar periode yang dipilih ditolak dengan pesan yang menyebut periode. Menguji R-08. | Pilih periode bulan tertentu, lalu impor berkas dengan satu mutasi di bulan lain. Cek pesan dan tidak ada mutasi tersimpan. |
| `AC-14` | Penandaan `SELISIH` tanpa alasan ditolak. Setelah pasangan dikoreksi, status menjadi `COCOK`. Menguji R-05. | Tandai `SELISIH` tanpa alasan: ditolak. Tandai dengan alasan, lalu koreksi pasangan: status `COCOK`. |
| `AC-15` | Pasangan manual yang melanggar satu lawan satu (mutasi atau baris jurnal sudah berpasangan) ditolak dengan pesan. Menguji R-09. | Pasangkan satu mutasi ke baris jurnal. Coba pasangkan mutasi yang sama ke baris jurnal lain: ditolak dengan pesan. |
| `AC-16` | Hanya Accounting yang dapat mengimpor dan mencocokkan. Nomor rekening dan nama pemilik rekening tidak terlihat peran lain. Menguji R-10 dan D-33. | Login sebagai Finance, coba impor: ditolak. Login sebagai Accounting: impor berhasil dan field rekening tampil. Cek peran lain tidak menerima data rekening lewat layar ini. |
| `AC-17` | Berkas dengan kolom yang belum dipetakan ditolak; profil pemetaan yang sudah disimpan dapat dipakai ulang. Menguji R-01. | Impor dengan kolom tanggal tidak dipetakan: ditolak. Simpan profil pemetaan, lalu impor berkas kedua dengan profil yang sama: berhasil. |

## Edge cases (optional)

- Berkas dengan dua baris identik di dalam satu file: keduanya tersimpan sebagai mutasi berbeda (AC-02 dan R-03).
- Mutasi di luar periode rekonsiliasi (AC-13).
- Baris jurnal kas dari sumber lain (pembayaran pemasok dan penerimaan pelanggan) dicocokkan dengan aturan yang sama (AC-05).

## Verifiability

- AC-01, AC-03, AC-04, AC-05, AC-06, AC-07, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17 → langkah UI dan pemeriksaan daftar serta status.
- AC-02, AC-08 → hitung mutasi dan pasangan sebelum dan sesudah. Oracle: jumlah tetap; tidak ada pasangan ganda.
- AC-09, AC-10 → bandingkan saldo dan jurnal sebelum dan sesudah. Oracle: tidak ada perubahan saldo dan jurnal.
