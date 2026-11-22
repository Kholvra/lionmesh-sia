# PD-004 — Acceptance Criteria

Setiap kriteria dapat dibuktikan lewat UI dan pemeriksaan saldo. Angka contoh bersifat ilustrasi.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pengiriman hanya bisa dibuat dari pesanan `SIAP_KIRIM` atau `TERKIRIM_SEBAGIAN`. | Buat pesanan `DRAFT`, buka aksi buat pengiriman: tidak tersedia atau ditolak "Pesanan belum terverifikasi...". |
| `AC-02` | Qty kirim melebihi alokasi ditolak. | Alokasi 200, kirim 201. Pesan "Qty kirim melebihi stok..." muncul; tidak ada pengiriman tersimpan. |
| `AC-03` | Pengiriman `DIKIRIM` mengurangi saldo fisik sebesar qty kirim dan melepas alokasi sebesar qty kirim. | Saldo 200, alokasi 200, kirim 200, kirim pengiriman. Saldo fisik 0. Alokasi aktif 0. Satu baris `mutasi_stok` keluar 200 tercatat, nilai = 200 × harga rata. |
| `AC-04` | Pengiriman `DIKIRIM` menerbitkan surat jalan dengan nomor sesuai `FND-004`. | Setelah kirim, surat jalan muncul dengan nomor pola `{TIPE}/{TAHUN}/{BULAN}/{URUT}`; nomor unik. |
| `AC-05` | Setiap transisi status menulis satu baris riwayat dengan aktor dan waktu. | Buat, kirim, lalu catat bukti terima: tiga baris riwayat dengan aktor Gudang atau Pengiriman. |
| `AC-06` | Pengiriman `DRAFT` yang dibatalkan dengan alasan tidak mengubah stok. | Batalkan pengiriman `DRAFT` dengan alasan. Saldo dan alokasi tidak berubah. Tanpa alasan ditolak. |
| `AC-07` | Pengiriman `DIKIRIM` tidak bisa diubah qty-nya atau dibatalkan. | Coba ubah qty setelah kirim: ditolak "Pengiriman sudah dikirim..."; saldo tidak berubah. Coba batalkan: ditolak "...Gunakan retur penjualan." |
| `AC-08` | Bukti terima mengubah status menjadi `DITERIMA` dengan tanggal dan nama penerima. | Dari `DIKIRIM`, isi tanggal dan nama penerima, simpan: status `DITERIMA`; saldo tidak berubah. Tanpa nama: ditolak "Tanggal terima dan nama penerima wajib diisi.". |
| `AC-09` | Pembuat pesanan tidak dapat mengirim pengiriman untuk pesanannya sendiri (`D-42`). | Login sebagai pembuat pesanan, konfirmasi kirim: ditolak "Pembuat pesanan tidak dapat mengirim barang..."; tidak ada mutasi stok. |
| `AC-10` | Pengiriman parsial mengubah pesanan menjadi `TERKIRIM_SEBAGIAN`; kirim sisanya mengubahnya menjadi `TERKIRIM`. | Pesanan 500, alokasi 500. Kirim 200: status `TERKIRIM_SEBAGIAN`. Kirim 300: status `TERKIRIM`. Kirim lebih dari sisa 1 ditolak "Qty kirim melebihi sisa jumlah pesanan.". |
| `AC-11` | Saldo fisik tidak cukup menolak pengiriman tanpa mutasi. | Alokasi 100 dan saldo 100. Lewat uji inventory, turunkan saldo ke 80 (koreksi uji, di luar item ini). Kirim 100: ditolak "Saldo fisik tidak cukup..."; tidak ada mutasi; alokasi tetap 100. |
| `AC-12` | Nilai keluar memakai harga rata saat pengiriman. | Harga rata 5.000, kirim 200: nilai keluar 1.000.000; `saldo_stok` nilai berkurang 1.000.000. |

## Edge cases (optional)

- Pengiriman parsial dan jumlah pengiriman: tidak dibatasi (`PQ-02`), hanya qty kumulatif (`AC-10`).
- Pembatalan setelah `DIKIRIM`: ditolak; koreksi lewat retur (`PD-007`).

## Verifiability

- `AC-01`..`AC-02`, `AC-04`..`AC-08`, `AC-10` → uji manual UI dan pemeriksaan basis data (`mutasi_stok`, `saldo_stok`, alokasi).
- `AC-03`, `AC-11`, `AC-12` → skrip uji inventory yang membandingkan saldo sebelum dan sesudah.
- `AC-09` → uji otomatis dengan sesi dua peran.
