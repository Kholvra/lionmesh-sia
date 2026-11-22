# PD-002 — Acceptance Criteria

Setiap kriteria dapat dibuktikan lewat UI. Angka contoh bersifat ilustrasi; tarif PPN dinyatakan sebagai T (`D-51(a)`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pesanan baru mendapat nomor dengan pola `{TIPE}/{TAHUN}/{BULAN}/{URUT}` dari `FND-004` dan status awal `DRAFT`. | Sebagai Penjualan, buat pesanan untuk "PT Contoh A" dengan satu baris. Simpan. Nomor sesuai pola; status `DRAFT`; riwayat berisi satu baris. |
| `AC-02` | Pesanan tanpa baris tidak bisa diverifikasi. | Buat pesanan tanpa baris, lalu verifikasi oleh Penjualan lain. Pesan "Pesanan belum punya barang..." muncul; status tetap `DRAFT`. |
| `AC-03` | Total dihitung dari baris: diskon dikurangkan dari nilai kotor, PPN dihitung dari DPP dengan tarif T yang berlaku pada tanggal verifikasi. | Baris qty 10, harga 100.000, diskon 10%: nilai kotor 1.000.000; diskon 100.000; DPP 900.000; PPN = 900.000 × T; total = 900.000 + PPN. Layar sama dengan hitungan manual dari T yang sama. Uji unit rumus memakai T dari konfigurasi uji. |
| `AC-04` | Qty nol atau negatif ditolak. | Isi qty 0. Simpan. Pesan "Jumlah harus lebih dari nol." muncul; baris tidak tersimpan. |
| `AC-05` | Pesanan yang melewati batas kredit berstatus `MENUNGGU_PERSETUJUAN_KREDIT`, dengan riwayat `DRAFT→VERIFIED` lalu `VERIFIED→MENUNGGU_PERSETUJUAN_KREDIT`. | Pelanggan batas 50.000.000 dengan piutang 40.000.000. Buat pesanan total 20.000.000 (termasuk PPN). Verifikasi oleh Penjualan lain. Status `MENUNGGU_PERSETUJUAN_KREDIT`; pesan "Pelanggan melewati batas kredit..." muncul; riwayat berisi dua baris. |
| `AC-06` | Override hanya dapat dilakukan Manajemen dan wajib alasan. | Login sebagai Penjualan: aksi override ditolak. Login sebagai Manajemen: override tanpa alasan ditolak dengan pesan; dengan alasan "pelanggan strategis", status menjadi `VERIFIED`. |
| `AC-07` | Setiap transisi status menulis satu baris riwayat dengan aktor dan waktu. | Lakukan verifikasi (kredit lolos), lalu pengembalian ke `REVISI`, perbaikan, dan verifikasi ulang: setiap transisi punya baris dengan aktor yang benar. |
| `AC-08` | Pesanan `DRAFT` yang dibatalkan dengan alasan tetap ada di daftar dan tidak bisa diverifikasi. | Batalkan pesanan `DRAFT` tanpa alasan: ditolak "Alasan pembatalan wajib diisi.". Dengan alasan: status `DIBATALKAN`, tombol verifikasi tidak aktif, baris tetap ada. |
| `AC-09` | Termin pesanan terisi dari pelanggan dan bisa diganti per pesanan. | Pelanggan termin 30. Buat pesanan: termin 30. Ubah ke 45 di pesanan. Simpan. Termin pelanggan tetap 30. |
| `AC-10` | Pembuat pesanan tidak bisa memverifikasi pesanannya sendiri. | Login sebagai pembuat, buka pesanan `DRAFT` miliknya, klik verifikasi: ditolak "Pembuat pesanan tidak dapat memverifikasi pesanannya sendiri."; status tetap `DRAFT`. |
| `AC-11` | Pesanan `VERIFIED` tidak bisa diubah isinya. | Dari pesanan `VERIFIED`, coba ubah qty atau harga baris: ditolak dengan pesan "Pesanan yang sudah diverifikasi tidak dapat diubah..."; baris tidak berubah. |
| `AC-12` | Pesanan `VERIFIED` tanpa pengiriman dapat dibatalkan dengan alasan; alokasi dilepas. | Dengan pesanan `VERIFIED` dan alokasi 200, batalkan dengan alasan. Status `DIBATALKAN`; alokasi aktif 0; tersedia kembali 200 (`PD-003` `AC-05`). |
| `AC-13` | Batas kredit 0 menahan setiap pesanan dengan total > 0. | Ubah batas pelanggan ke 0 (`PD-001` `AC-10`). Buat pesanan total > 0, verifikasi: status `MENUNGGU_PERSETUJUAN_KREDIT`. |
| `AC-14` | Exposure dihitung dari piutang faktur dan nilai pesanan belum difakturkan. | Batas 50.000.000. Piutang faktur 40.000.000. Pesanan lain `VERIFIED` belum difakturkan 5.000.000. Pesanan baru total 10.000.000: exposure 55.000.000 → `MENUNGGU_PERSETUJUAN_KREDIT`. Pesanan baru 5.000.000: exposure 50.000.000 (tidak melewati) → `VERIFIED`. |
| `AC-15` | Pengembalian ke `REVISI` mewajibkan alasan dan verifikasi ulang menjalankan cek kredit lagi. | Kembalikan pesanan `DRAFT` tanpa alasan: ditolak "Alasan pengembalian wajib diisi.". Dengan alasan: status `REVISI`. Setelah diperbaiki dan diverifikasi ulang, cek kredit dijalankan lagi (baris kredit baru di riwayat bila melewati batas). |
| `AC-16` | Override oleh Manajemen yang menolak (membatalkan) menutup pesanan. | Dari `MENUNGGU_PERSETUJUAN_KREDIT`, Manajemen batalkan dengan alasan: status `DIBATALKAN`; tidak ada alokasi stok dibuat. |
| `AC-17` | Pelanggan nonaktif tidak bisa dipakai untuk pesanan baru. | Nonaktifkan pelanggan (`PD-001` `AC-06`). Form pesanan baru tidak menampilkannya; simpan dengan id-nya ditolak dengan pesan pelanggan tidak aktif. |

## Edge cases (optional)

- Batas kredit 0: `AC-13`.
- Pesanan `VERIFIED` dengan dokumen turunan: dibatalkan hanya bila belum ada pengiriman (`AC-12`); setelah pengiriman, tidak bisa dibatalkan.

## Verifiability

- `AC-01`..`AC-05`, `AC-07`..`AC-09`, `AC-11`, `AC-13`, `AC-15`..`AC-17` → uji manual UI dengan langkah di atas dan pemeriksaan `riwayat_status`.
- `AC-03`, `AC-14` → uji unit rumus dengan data tetap (T dari konfigurasi uji).
- `AC-06`, `AC-10` → uji otomatis aksi server dengan dua peran (setelah `FND-003` menyediakan peran).
