# PG-007 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Rujukan `R-xx` menunjuk aturan di `01-requirement.md`.

Langkah dasar: `pnpm db:reset` lalu `pnpm db:seed`, login sebagai pengguna dengan peran sesuai, dan siapkan penerimaan seed berstatus `DITERIMA` (dari PG-006) dengan minimal dua baris dan dua harga PO berbeda. Data seed juga memuat satu PO dengan baris bahan dan satu penerimaan yang sudah punya qty gagal untuk uji retur.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | QC lulus untuk seluruh qty satu baris menambah saldo stok bahan sebesar qty lulus, dan status baris berubah ke `QC_LULUS`. Menguji R-01, R-03. | Catat saldo stok bahan seed. Login sebagai QC, catat qty lulus penuh untuk satu baris. Cek saldo: bertambah tepat sebesar qty. Cek status baris dan riwayat. |
| `AC-02` | Setiap QC lulus menghasilkan tepat satu jurnal dengan Dr 120 dan Cr 202 senilai qty lulus × harga PO, dan total debit sama dengan total kredit. Menguji R-03 (d). | Catat jumlah jurnal sebelum. Lakukan QC lulus. Bandingkan: bertambah tepat satu. Cek baris Dr 120 dan Cr 202 sama nilainya dengan qty lulus × harga PO. |
| `AC-03` | Mutasi stok dan jurnal dibuat dalam satu transaksi: bila jurnal gagal, saldo tidak berubah. Menguji R-03 dan B-03. | Uji dengan akun 202 yang sengaja tidak aktif di konfigurasi. Catat pesan. Cek saldo stok tidak berubah dan tidak ada jurnal. |
| `AC-04` | QC gagal untuk qty penuh tidak menambah saldo stok dan tidak membuat jurnal. Menguji R-04. | Catat saldo dan jumlah jurnal. Catat QC gagal untuk qty penuh. Cek saldo dan jurnal tidak berubah. |
| `AC-05` | Qty lulus + qty gagal yang tidak sama dengan qty diterima ditolak, dengan pesan yang menyebut baris. Menguji R-01. | Isi jumlah yang tidak cocok. Simpan. Catat pesan. Cek tidak ada hasil tersimpan. |
| `AC-06` | QC untuk baris yang belum berstatus `DITERIMA` ditolak. Menguji R-01. | Coba catat QC untuk baris berstatus lain. Catat pesan. |
| `AC-07` | Hasil QC yang sudah final tidak bisa dicatat ulang. Menguji R-02. | Catat QC untuk baris. Catat QC kedua untuk baris yang sama. Catat pesan penolakan. |
| `AC-08` | Retur ke pemasok tidak bisa melebihi qty gagal yang belum diretur. Menguji R-05. | Buat retur lebih besar dari qty gagal. Catat pesan penolakan. |
| `AC-09` | Retur diajukan Purchasing, disetujui Accounting (status `DISETUJUI`), dan tercatat di riwayat. Saldo stok, jurnal, dan utang tidak berubah. Menguji R-05, R-06. | Login sebagai Purchasing, ajukan retur. Login sebagai Accounting, setujui. Cek status dan riwayat. Bandingkan saldo, jumlah jurnal, dan utang sebelum dan sesudah. |
| `AC-10` | Dua pencatatan QC untuk baris sama bersamaan: tepat satu berhasil. Menguji R-02 dan INV-05. | Dua sesi QC, kirim bersamaan. Hitung hasil: tepat satu. |
| `AC-11` | Periode terkunci menolak QC lulus dengan pesan yang jelas, tanpa perubahan saldo atau jurnal. Menguji R-08. | Kunci periode uji lewat FND-006. Coba QC lulus. Catat pesan. Cek saldo dan jurnal tidak berubah. |
| `AC-12` | Seluruh alur AC-01, AC-04, dan AC-09 bisa dijalankan dari UI tanpa skrip. | Ulangi melalui layar aplikasi saja. Catat bahwa tidak ada skrip. |
| `AC-13` | Nilai masuk memakai harga PO masing-masing penerimaan. Menguji R-03 (c). | Lakukan QC lulus pada dua baris dari PO dengan harga berbeda. Bandingkan nilai saldo: sama dengan qty lulus × harga PO masing-masing, dengan rata-rata bergerak. |
| `AC-14` | Retur tanpa referensi baris penerimaan ditolak dengan pesan yang menyebut referensi wajib. Menguji R-05. | Coba buat retur tanpa memilih baris penerimaan. Catat pesan. Cek tidak ada dokumen retur. |
| `AC-15` | Retur yang ditolak Accounting berstatus `DITOLAK` dengan alasan tercatat dan tidak punya efek. Purchasing tidak bisa menyetujui retur sendiri. Menguji R-05, R-09, D-48. | Ajukan retur. Login sebagai Purchasing, coba setujui: ditolak. Login sebagai Accounting, tolak dengan alasan. Cek status dan riwayat. Cek tidak ada efek lain. |
| `AC-16` | Retur dapat dibatalkan selama `DIAJUKAN` dengan alasan wajib; setelah `DISETUJUI` pembatalan ditolak. Menguji R-05. | Ajukan retur. Coba batalkan tanpa alasan: ditolak. Batalkan dengan alasan: `DIBATALKAN`. Ajukan dan setujui retur lain, lalu coba batalkan: ditolak dengan pesan. |
| `AC-17` | Qty gagal tidak dihitung sebagai tersedia pada laporan stok. Menguji R-04 dan Success. | Catat saldo tersedia sebelum QC. Catat QC gagal untuk qty penuh. Cek saldo tersedia tidak berubah dan barang gagal tidak tampil sebagai tersedia. |
| `AC-18` | Lokasi pemisahan dicatat sebagai teks pada baris QC gagal dan tidak membuat mutasi. Menguji R-04. | Catat QC gagal dengan lokasi "karantina". Cek lokasi tampil pada baris. Cek jumlah baris `mutasi_stok` tidak berubah. |

## Edge cases (optional)

- QC lulus sebagian per baris (R-01): sisa qty gagal menjadi barang terpisah (AC-05 dan AC-18).
- Retur sebagian, lalu sisanya diretur kemudian (AC-08 dan AC-16).
- Harga satuan untuk nilai masuk diuji dengan dua harga berbeda (AC-13).

## Verifiability

- AC-01, AC-04, AC-05, AC-06, AC-07, AC-12, AC-14, AC-15, AC-16, AC-18 → langkah UI dan pemeriksaan saldo, status, dan riwayat.
- AC-02, AC-03, AC-09, AC-11, AC-13, AC-17 → pemeriksaan jurnal dan saldo sebelum dan sesudah. Oracle: total debit sama dengan kredit; tidak ada perubahan saat gagal atau saat retur.
- AC-08 → bandingkan qty retur dengan qty gagal yang belum diretur. Oracle: ditolak bila melebihi.
- AC-10 → uji bersamaan dua sesi.
