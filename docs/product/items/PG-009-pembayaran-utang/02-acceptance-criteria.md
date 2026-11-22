# PG-009 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Rujukan `R-xx` menunjuk aturan di `01-requirement.md`.

Langkah dasar: `pnpm db:reset` lalu `pnpm db:seed`, login sebagai Finance dan Accounting sesuai peran. Data seed memuat minimal tiga invoice `TERCATAT` untuk satu pemasok dengan tanggal invoice berbeda, satu invoice `COCOK` yang belum disahkan, dan satu rekening bank aktif.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pembayaran penuh untuk satu invoice, setelah verifikasi Accounting dan hasil transfer berhasil, menutup utang invoice itu dan mengubah statusnya ke `LUNAS`. Menguji R-01, R-04, R-10. | Login sebagai Finance, catat pembayaran sebesar sisa satu invoice seed. Login sebagai Accounting, verifikasi. Login sebagai Finance, catat hasil berhasil dengan bukti transfer. Cek sisa invoice nol dan status `LUNAS`. |
| `AC-02` | Pembayaran sebagian menyisakan saldo utang sebesar selisihnya dan status `DIBAYAR_SEBAGIAN`. Menguji R-04, R-10. | Catat pembayaran lebih kecil dari invoice, verifikasi, catat hasil berhasil. Cek sisa sama dengan selisih dan status `DIBAYAR_SEBAGIAN`. |
| `AC-03` | Satu pembayaran dialokasikan otomatis ke tiga invoice, urut tanggal invoice tertua dulu; jumlah alokasi sama dengan nominal pembayaran. Menguji R-01. | Catat satu pembayaran sebesar total dua invoice tertua ditambah sebagian invoice ketiga. Cek alokasi: dua invoice tertua lunas, invoice ketiga sebagian. Total alokasi sama dengan nominal. |
| `AC-04` | Nominal yang melebihi sisa invoice yang dapat dialokasikan ditolak dengan pesan yang menyebut sisa. Menguji R-02 dan kelebihan bayar. | Catat nominal di atas total sisa pemasok. Catat pesan. Cek tidak ada pembayaran tersimpan. |
| `AC-05` | Nominal bukan bilangan bulat rupiah, nol, atau negatif ditolak. Menguji R-07. | Coba nominal `0`, `-1`, dan nilai pecahan. Catat pesan tiap kali. Cek tidak ada pembayaran tersimpan. |
| `AC-06` | Setiap transfer berhasil menghasilkan tepat satu jurnal Dr 201 / Cr 102 senilai nominal, dengan total debit sama dengan total kredit. Menguji R-06. | Catat jumlah jurnal sebelum. Lakukan AC-01 sampai hasil berhasil. Bandingkan: bertambah tepat satu. Cek baris 201 dan 102 sama nilainya. |
| `AC-07` | Saldo utang di laporan utang sama dengan jumlah utang diakui dikurangi pembayaran teralokasi, dan sama dengan saldo akun 201 di jurnal per pemasok. Menguji INV-04 dan R-12. | Bandingkan tiga angka setelah beberapa transaksi seed: read model core, perhitungan manual dari dokumen, dan saldo jurnal 201. Ketiganya sama. Layar laporan penuh milik C-009. |
| `AC-08` | Transfer gagal ditandai `GAGAL_TRANSFER`, tanpa jurnal, dan utang tidak berubah. Transfer diulang dengan alasan dan berhasil menutup utang. Menguji R-04. | Catat hasil gagal dengan alasan. Cek status pembayaran, utang, dan jumlah jurnal. Catat ulang sebagai pembayaran baru yang menunjuk alokasi sama, dengan alasan, lalu hasil berhasil. Cek utang berkurang sekali saja. |
| `AC-09` | Pembayaran parsial tampil sebagai `DIBAYAR_SEBAGIAN` dengan sisa terlihat di daftar; pembayaran kedua yang melunasi menjadi `LUNAS`. Menguji R-10. | Catat dua pembayaran berhasil untuk satu invoice. Cek status dan sisa di daftar setelah masing-masing. |
| `AC-10` | Bukti transfer wajib saat hasil berhasil dicatat, tersimpan terhubung ke pembayaran, dan tetap bisa dibuka setelah pembayaran tercatat. Menguji R-05. | Coba catat hasil berhasil tanpa lampiran: ditolak dengan pesan. Lampirkan berkas uji PDF, catat berhasil. Buka ulang pembayaran: lampiran masih ada. |
| `AC-11` | Pembayaran ke periode terkunci ditolak dengan pesan jelas, tanpa perubahan saldo atau jurnal. Menguji R-08 dan PRE-04. | Kunci periode uji lewat FND-006. Coba bayar. Catat pesan. Cek tidak ada perubahan utang atau jurnal. |
| `AC-12` | Pembayaran untuk invoice yang belum `TERCATAT` (mis. `COCOK` atau `SELISIH`) ditolak dengan pesan. Menguji R-01 dan PRE-03. | Coba alokasikan ke invoice `COCOK`. Catat pesan. Cek tidak ada pembayaran tersimpan. |
| `AC-13` | Setiap perubahan status pembayaran dan utang tampil di riwayat dengan aktor dan waktu. Menguji POST-04. | Lakukan satu transisi (mis. `GAGAL_TRANSFER` lalu berhasil). Buka riwayat. Cek baris dengan aktor dan waktu. |
| `AC-14` | Seluruh alur AC-01 dapat dijalankan dari UI tanpa skrip. | Ulangi AC-01 hanya melalui layar aplikasi. |
| `AC-15` | Hasil transfer tidak bisa dicatat sebelum Accounting memverifikasi pembayaran. Menguji R-03 dan PRE-05. | Catat pembayaran sebagai Finance. Coba catat hasil berhasil sebelum verifikasi: ditolak dengan pesan. |
| `AC-16` | Verifikasi hanya bisa dilakukan oleh akun berperan Accounting, dan akun Finance yang mencatat pembayaran tidak bisa memverifikasi (satu akun satu peran, D-48). Menguji R-03, R-11, INV-08. | Login sebagai Finance yang mencatat pembayaran, coba verifikasi: ditolak dengan pesan pemisahan tugas. Login sebagai Accounting lain, verifikasi: diterima. |
| `AC-17` | Pembalikan pembayaran berhasil lewat jurnal pembalik dengan alasan; alokasi dibalik; status invoice dihitung ulang dari sisa; pembayaran tidak dihapus. Menguji R-09 dan POST-05. | Catat pembayaran berhasil. Batalkan tanpa alasan: ditolak. Batalkan dengan alasan. Cek jurnal pembalik ada, pembayaran berstatus `DIBATALKAN`, sisa invoice kembali, dan riwayat tercatat. |
| `AC-18` | Tanggal mundur ke periode yang terbuka diterima dan jurnal memakai tanggal itu; tanggal di periode terkunci ditolak. Menguji R-08. | Catat pembayaran dengan tanggal di periode terbuka sebelumnya: diterima, tanggal jurnal sama. Catat dengan tanggal di periode terkunci: ditolak. |
| `AC-19` | Pembayaran oleh pemohon PR yang invoice-nya berasal dari PR miliknya ditolak. Menguji R-11 dan D-42. | Pada data seed dengan PR, pemohon PR mencoba mencatat pembayaran untuk invoice dari PR-nya: ditolak dengan pesan telusuran. |

## Edge cases (optional)

- Kelebihan bayar: nominal di atas total utang pemasok (AC-04).
- Pembulatan: tidak ada pembulatan pada pembayaran (AC-05).
- Pembayaran di tanggal terakhir periode akuntansi sebelum ditutup (AC-18).

## Verifiability

- AC-01, AC-03, AC-04, AC-05, AC-08, AC-09, AC-10, AC-12, AC-13, AC-14, AC-15, AC-16, AC-19 → langkah UI dan pemeriksaan sisa utang, status, dan riwayat.
- AC-06, AC-07, AC-11, AC-17, AC-18 → pemeriksaan jurnal dan saldo sebelum dan sesudah. Oracle: debit sama dengan kredit; tiga angka saldo sama.
- AC-02 → sisa invoice sama dengan selisih. Oracle: angka tepat.
