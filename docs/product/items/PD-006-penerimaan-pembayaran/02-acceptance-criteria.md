# PD-006 — Acceptance Criteria

Setiap kriteria dapat dibuktikan lewat UI dan pemeriksaan saldo piutang. Angka contoh bersifat ilustrasi; semua faktur dinyatakan sebagai total termasuk PPN dengan tarif T (`D-51(a)`), sehingga tidak ada tarif tersirat.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pembayaran parsial mengurangi sisa faktur dan menetapkan status `SEBAGIAN_LUNAS`. | Faktur total 1.000.000. Catat penerimaan 500.000 dan verifikasi. Sisa 500.000; status `SEBAGIAN_LUNAS`. |
| `AC-02` | Pelunasan membuat sisa faktur nol dan status `LUNAS`. | Lanjutkan `AC-01` dengan penerimaan 500.000 terverifikasi. Sisa 0; status `LUNAS`. |
| `AC-03` | Satu penerimaan menutup beberapa faktur pelanggan yang sama, tertua dulu. | Faktur A 300.000 (tanggal lebih lama) dan B 400.000. Penerimaan 700.000 terverifikasi: A `LUNAS`, B `LUNAS`. |
| `AC-04` | Nominal yang melebihi total tagihan terbuka ditolak. | Total tagihan terbuka 100.000. Catat penerimaan 150.000: ditolak "Nominal pembayaran melebihi total tagihan terbuka..."; tidak ada penerimaan tersimpan. |
| `AC-05` | Alokasi tidak pernah mencakup faktur pelanggan lain. | Pelanggan X dan Y punya faktur masing-masing; faktur Y lebih tua. Penerimaan X: alokasi hanya ke faktur X. |
| `AC-06` | Verifikasi membentuk satu jurnal: Dr `kas_bank` nominal, Cr `piutang_usaha` nominal, debit = kredit. | Penerimaan 500.000 terverifikasi: satu jurnal dengan dua baris sesuai peran; `sumber_tipe` = penerimaan. |
| `AC-07` | Piutang pelanggan berkurang sesuai alokasi. | Piutang 1.000.000. Setelah `AC-01`: piutang 500.000. |
| `AC-08` | Setiap transisi status penerimaan menulis riwayat dengan aktor dan waktu. | `DICATAT` → `TERVERIFIKASI`: dua baris riwayat dengan aktor Finance dan Accounting. |
| `AC-09` | Penerimaan di periode terkunci ditolak dengan pesan. | Kunci periode. Catat penerimaan: ditolak "Periode ... sudah ditutup..."; tidak ada jurnal. |
| `AC-10` | Penerimaan `DICATAT` belum mengubah piutang dan belum berjurnal. | Catat penerimaan 500.000 tanpa verifikasi: piutang tidak berubah; tidak ada jurnal; status faktur tetap. |
| `AC-11` | Pencatat tidak dapat memverifikasi penerimaannya sendiri. | Login sebagai Finance, verifikasi penerimaan yang dicatatnya: ditolak "Pencatat penerimaan tidak dapat memverifikasi..."; tidak ada jurnal. |
| `AC-12` | Pembatalan `TERVERIFIKASI` (cek mundur) membentuk jurnal pembalik, melepas alokasi, dan menghitung ulang status faktur. | Penerimaan 500.000 terverifikasi lalu dibatalkan dengan alasan "cek mundur": jurnal pembalik dengan nilai sama dan arah berlawanan; jurnal asal tetap; faktur kembali `SEBAGIAN_LUNAS`/`DITERBITKAN`; riwayat tercatat. Tanpa alasan: ditolak. |
| `AC-13` | Pembatalan `DICATAT` tidak membentuk jurnal. | Batalkan penerimaan `DICATAT` dengan alasan: status `DIBATALKAN`; jurnal tidak bertambah; piutang tidak berubah. |
| `AC-14` | Pelunasan seluruh faktur pesanan mengubah pesanan menjadi `SELESAI`. | Pesanan dengan satu faktur `DIFAKTURKAN`. Penerimaan melunasi faktur itu: pesanan `SELESAI`. |
| `AC-15` | Metode Tunai tidak tersedia pada versi ini. | Buka form penerimaan: pilihan metode hanya Transfer dan Giro; kirim metode "Tunai" langsung ditolak. |
| `AC-16` | Nominal dan alokasi memakai tepat dua desimal atau kurang. | Isi nominal 100.005,555 (tiga desimal): ditolak "Nominal pembayaran harus memakai paling banyak dua desimal."; tidak ada penerimaan tersimpan. Nominal 100.005,5 diterima dan tersimpan sebagai 100.005,50. |

## Edge cases (optional)

- Kelebihan bayar: ditolak (`AC-04`).
- Pembayaran ditolak bank: dibatalkan dengan alasan (`AC-12`).

## Verifiability

- `AC-01`..`AC-05`, `AC-08`, `AC-10`, `AC-11`, `AC-13`..`AC-16` → uji manual UI.
- `AC-06`, `AC-07`, `AC-09`, `AC-12`, `AC-14` → pemeriksaan jurnal dan saldo piutang setelah `FND-006`.
