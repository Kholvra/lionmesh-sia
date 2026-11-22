# PD-003 — Acceptance Criteria

Setiap kriteria dapat dibuktikan lewat UI dan pemeriksaan saldo. Angka contoh bersifat ilustrasi.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Layar cek stok menampilkan diminta, tersedia, dan teralokasi untuk setiap baris pesanan `VERIFIED`. | Dengan saldo 200 lembar, buat pesanan 500 lembar, verifikasi. Buka cek stok: diminta 500, tersedia 200, teralokasi 0. |
| `AC-02` | Alokasi parsial mengurangi tersedia dan tidak mengubah saldo fisik. | Alokasikan 200. Tersedia menjadi 0, teralokasi 200. Cek `saldo_stok` dan `mutasi_stok`: saldo fisik tetap 200, tidak ada mutasi baru. |
| `AC-03` | Alokasi melebihi tersedia ditolak. | Coba alokasi 201 ketika tersedia 200. Pesan "Stok tersedia hanya 200..." muncul; tidak ada alokasi tersimpan. |
| `AC-04` | Dua pesanan tidak bisa mengalokasikan stok yang sama melebihi saldo. | Dua pesanan masing-masing 150 terhadap saldo 200. Alokasi pertama 150 berhasil. Alokasi kedua dipotong menjadi 50 (sisa tersedia) dan Gudang diberi tahu. Total alokasi ≤ 200. |
| `AC-05` | Pembatalan pesanan melepas alokasi. | Batalkan pesanan `VERIFIED` yang punya alokasi 200 dengan alasan. Tersedia kembali 200; alokasi aktif 0. |
| `AC-06` | Konfirmasi pengiriman melepas alokasi sebesar qty kirim. | Dikonfirmasi di `PD-004` (`AC-03`). Uji ulang di sini setelah pengiriman tersedia. |
| `AC-07` | Stok tidak negatif setelah alokasi. | Dengan saldo 0, alokasi qty 1 ditolak. Saldo tetap 0. |
| `AC-08` | Alokasi seluruh baris mengubah pesanan dari `VERIFIED` menjadi `SIAP_KIRIM`; alokasi sebagian menjadi `MENUNGGU_STOK`. | Saldo 200, pesanan 500 → `MENUNGGU_STOK`. Stok masuk 300, Gudang alokasikan 300 → `SIAP_KIRIM`. Riwayat berisi dua transisi dengan aktor Gudang atau sistem. |
| `AC-09` | Alokasi tidak boleh melebihi qty baris pesanan. | Pesanan 500, alokasi 600 (saldo cukup). Ditolak "Alokasi melebihi jumlah yang dipesan."; tidak ada alokasi tersimpan. |
| `AC-10` | Pesanan belum `VERIFIED` atau `MENUNGGU_PERSETUJUAN_KREDIT` tidak bisa dialokasikan. | Pesanan `DRAFT` atau `MENUNGGU_PERSETUJUAN_KREDIT`: aksi alokasi ditolak dengan "Pesanan belum terverifikasi..."; saldo tidak berubah. |
| `AC-11` | Alokasi tidak membentuk baris `mutasi_stok`. | Alokasi 200 lalu periksa jumlah baris `mutasi_stok` dan `saldo_stok` sebelum/sesudah: identik. |
| `AC-12` | Saat ada lebih dari satu gudang, Gudang harus memilih gudang untuk alokasi; saat hanya satu gudang, pilihan tidak tampil. | Seed satu gudang: layar tidak menampilkan pilihan gudang. Tambah gudang kedua (uji): pilihan tampil; alokasi tanpa pilihan ditolak "Pilih gudang untuk alokasi.". |
| `AC-13` | Stok masuk tidak mengalokasikan otomatis. | Pesanan `MENUNGGU_STOK` dengan kekurangan 300. Catat penerimaan stok 300 (uji `FND-005`). Status tetap `MENUNGGU_STOK` dan teralokasi tetap 200 sampai Gudang mengalokasikan. |

## Edge cases (optional)

- Alokasi bersamaan terhadap saldo sama: hanya yang tersimpan lebih dulu sah; yang lain dipotong (`AC-04`).
- Alokasi untuk pesanan yang dibatalkan: ditolak (`AC-10`, pesan "Pesanan dibatalkan...").

## Verifiability

- `AC-01`..`AC-03`, `AC-05`, `AC-08`..`AC-13` → uji manual UI dan pemeriksaan basis data.
- `AC-04`, `AC-07` → uji concurrency dan uji inventory dengan dua sesi.
- `AC-06` → uji lintas item setelah `PD-004`.
