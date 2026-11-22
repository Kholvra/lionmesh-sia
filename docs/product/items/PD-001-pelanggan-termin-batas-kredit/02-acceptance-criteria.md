# PD-001 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan langkah yang bisa diulang di UI atau dengan perintah. Nilai contoh di bawah bersifat ilustrasi, bukan keputusan bisnis.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Penjualan membuat pelanggan baru dengan nama, termin, dan batas kredit; data tampil di daftar dan dapat dicari berdasarkan nama. | Buka daftar pelanggan sebagai Penjualan, klik tambah, isi nama "PT Contoh A", termin kosong, batas kredit 50.000.000. Simpan. Cari "Contoh A", data muncul. |
| `AC-02` | Pelanggan baru tanpa termin mendapat termin 30 hari. | Ulangi `AC-01` dengan termin kosong. Lihat detail pelanggan: termin = 30. |
| `AC-03` | Batas kredit negatif ditolak dengan pesan yang diatur di `01-requirement.md`. | Isi batas kredit -1 sebagai Manajemen. Simpan. Pesan "Batas kredit tidak boleh negatif." muncul; data tidak tersimpan. |
| `AC-04` | Termin non-bilangan atau negatif ditolak. | Isi termin 2,5, "abc", atau -1. Simpan. Pesan "Termin pembayaran harus berupa jumlah hari, minimal 0." muncul. |
| `AC-05` | Pengguna tanpa izin tidak dapat mengubah batas kredit, meskipun memanggil aksi secara langsung. | Login sebagai Penjualan, kirim perubahan batas kredit lewat aksi server. Respons menolak dengan pesan izin; nilai di basis data tidak berubah. Ulangi sebagai Manajemen: perubahan diterima. |
| `AC-06` | Menonaktifkan pelanggan menghentikan pemilihannya di dokumen baru, tetapi data tetap ada. | Nonaktifkan pelanggan. Buka form pesanan baru: pelanggan tidak muncul. Cek basis data: baris pelanggan masih ada. |
| `AC-07` | Pelanggan nonaktif dapat diaktifkan kembali dan muncul lagi di pilihan dokumen baru. | Aktifkan kembali. Buka form pesanan baru: pelanggan muncul. |
| `AC-08` | Perubahan termin atau batas kredit tidak mengubah dokumen yang sudah ada. | Setelah `PD-002` tersedia: buat pesanan, ubah termin pelanggan, buka pesanan lama: termin tetap nilai saat dibuat. |
| `AC-09` | Nonaktifkan pelanggan tidak mengubah dokumen terbuka. | Buat pesanan `VERIFIED` untuk pelanggan, lalu nonaktifkan pelanggan. Pesanan tetap berstatus `VERIFIED` dan bisa diproses; hanya pilihan pelanggan di dokumen baru yang hilang. |
| `AC-10` | Batas kredit 0 tersimpan sebagai tunai, dan pesanan dari pelanggan itu ditahan. | Ubah batas kredit ke 0. Buat pesanan dengan total > 0 lalu verifikasi: status `MENUNGGU_PERSETUJUAN_KREDIT` (`PD-002` `AC-05`). |
| `AC-11` | Data kontak hanya terbaca oleh peran yang berhak melalui dokumen. | Login sebagai Gudang (bukan peran pesanan/faktur): layar pelanggan tidak menampilkan telepon, email, dan alamat; pemanggilan langsung aksi baca ditolak. |

## Edge cases (optional)

- Batas kredit 0 diperlakukan sebagai tunai (`AC-10`).
- Nonaktifkan pelanggan dengan pesanan terbuka: dokumen tetap berjalan (`AC-09`).

## Verifiability

- `AC-01`..`AC-04`, `AC-06`, `AC-07`, `AC-10` → uji manual di UI dengan langkah di atas, plus pemeriksaan basis data untuk `AC-06`.
- `AC-05`, `AC-11` → uji otomatis aksi server dengan sesi dua peran (setelah `FND-003` menyediakan peran).
- `AC-08`, `AC-09`, `AC-10` → uji manual setelah `PD-002` tersedia.
