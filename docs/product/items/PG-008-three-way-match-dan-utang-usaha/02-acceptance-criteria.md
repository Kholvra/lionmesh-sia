# PG-008 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Rujukan `R-xx` menunjuk aturan di `01-requirement.md`.

Langkah dasar: `pnpm db:reset` lalu `pnpm db:seed`, login sebagai pengguna dengan peran sesuai. Data seed harus memuat satu PO, satu penerimaan yang sudah lulus QC, satu invoice yang cocok, contoh yang tidak cocok, satu pemasok dengan toleransi default 0, dan satu konfigurasi tarif PPN berversi (nilai tarif dari konfigurasi, bukan dari dokumen ini).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Invoice yang cocok dengan PO dan penerimaan lulus QC, lalu disahkan Accounting, mengakui utang sebesar total invoice (DPP + PPN). Menguji R-05. | Login sebagai Accounting. Catat invoice seed yang cocok. Login sebagai pengesah lain, buka invoice `COCOK`, sahkan. Cek utang pemasok bertambah sebesar total invoice. |
| `AC-02` | Pengakuan utang menghasilkan tepat satu jurnal dengan Dr 202, Dr `ppn_masukan`, Cr 201, dan total debit sama dengan total kredit. Menguji R-05 dan INV-01. | Catat jumlah jurnal sebelum. Lakukan AC-01. Bandingkan: bertambah satu. Cek debit sama dengan kredit dan baris 202, PPN, dan 201 sesuai nilainya. |
| `AC-03` | Invoice yang qty-nya melebihi qty lulus QC ditolak dengan pesan yang menyebut baris. Menguji R-02 dan PRE-03. | Catat invoice dengan qty lebih besar dari qty lulus. Catat pesan. Cek tidak ada invoice tersimpan. |
| `AC-04` | Termin kosong ditolak dengan pesan wajib diisi. Menguji R-01 dan PRE-01. | Kosongkan termin. Simpan. Catat pesan. |
| `AC-05` | Qty invoice kurang dari qty lulus menjadi `SELISIH` (kurang tagih) dan utang tidak diakui. Menguji R-02 dan INV-04. | Catat invoice dengan qty kurang dari qty lulus. Cek status `SELISIH` dan bahwa utang tidak berubah. |
| `AC-06` | Selisih harga di luar toleransi pemasok menjadi `SELISIH`; selisih di dalam toleransi menjadi `COCOK`. Menguji R-03. | Atur toleransi pemasok seed (persen dan nominal). Catat invoice dengan selisih harga di atas dan di bawah toleransi. Cek status masing-masing. |
| `AC-07` | Invoice `SELISIH` tidak mengakui utang dan tidak membuat jurnal. Menguji R-06 dan POST-02. | Buat exception. Bandingkan utang dan jumlah jurnal sebelum dan sesudah. Keduanya tidak berubah. |
| `AC-08` | Invoice ganda untuk nomor dan pemasok yang sama ditolak. Menguji R-07 dan INV-03. | Catat invoice dua kali dengan nomor sama. Catat pesan. Cek hanya satu invoice. |
| `AC-09` | Invoice tidak mengubah `saldo_stok`. Menguji R-10 dan POST-03. | Catat saldo stok. Catat invoice cocok lalu sahkan. Cek saldo tidak berubah. |
| `AC-10` | PPN dihitung dengan tarif dari konfigurasi berversi pada tanggal invoice, bukan angka tetap di kode. Menguji R-01 dan D-51 (a). | Ubah tarif di konfigurasi untuk tanggal berbeda. Catat invoice pada dua tanggal. Cek PPN sesuai tarif masing-masing tanggal. |
| `AC-11` | Pengakuan utang ditolak bila periode akuntansi terkunci, dengan pesan jelas, tanpa perubahan utang atau jurnal. Menguji PRE-05. | Kunci periode uji (FND-006). Coba sahkan invoice `COCOK`. Catat pesan. Cek utang dan jurnal tidak berubah. |
| `AC-12` | Setiap perubahan status invoice dan exception tampil di riwayat dengan aktor dan waktu. Menguji POST-04. | Lakukan satu transisi (mis. `SELISIH` lalu dikoreksi). Buka riwayat: ada baris dengan aktor dan waktu. |
| `AC-13` | Seluruh alur AC-01 dapat dijalankan dari UI tanpa skrip. | Ulangi AC-01 hanya melalui layar aplikasi. |
| `AC-14` | Selisih harga dalam toleransi menghasilkan jurnal dengan baris `selisih_harga_pembelian` dan tetap balance. Menguji R-05 dan INV-01. | Pada invoice `COCOK` dengan selisih harga kecil dalam toleransi, sahkan. Cek baris selisih ada di jurnal, debit sama dengan kredit, dan persediaan tidak berubah. |
| `AC-15` | PPN invoice yang tidak sama dengan PPN hitung menjadi `SELISIH`, tidak mengakui utang. Menguji R-03. | Catat invoice dengan PPN yang tidak sesuai tarif. Cek status `SELISIH` dan pesan menyebut PPN hitung. |
| `AC-16` | Pencatat invoice tidak bisa mengesahkan invoice yang sama. Menguji R-11 dan D-48. | Login sebagai pencatat invoice, buka invoice `COCOK` yang dicatatnya, coba sahkan: ditolak dengan pesan pemisahan tugas. |
| `AC-17` | Invoice `SELISIH` yang dikoreksi dicocokkan ulang; bila sekarang cocok, statusnya `COCOK` dan riwayat mencatat revisi. Menguji R-04 dan R-06. | Catat invoice `SELISIH`. Koreksi harga ke nilai PO. Simpan. Cek status `COCOK` dan riwayat revisi. |
| `AC-18` | Pembatalan invoice `COCOK` atau `SELISIH` sebelum `TERCATAT` dengan alasan menjadi `DIBATALKAN`, tanpa jurnal. Pembatalan tanpa alasan ditolak. Menguji R-09. | Batalkan tanpa alasan: ditolak. Batalkan dengan alasan: `DIBATALKAN`. Cek jurnal dan utang tidak berubah. |
| `AC-19` | Jatuh tempo dihitung dari tanggal invoice ditambah termin. Menguji R-08. | Catat invoice dengan tanggal dan termin tertentu. Cek jatuh tempo = tanggal invoice + termin. Ulangi dengan termin lain. |
| `AC-20` | Invoice untuk penerimaan yang belum semua barisnya QC final ditolak. Menguji R-02. | Pada penerimaan dengan satu baris belum QC, coba catat invoice. Catat pesan. Cek tidak ada invoice tersimpan. |
| `AC-21` | Satu penerimaan hanya boleh punya satu invoice aktif. Menguji D-49 dan R-01. | Catat invoice untuk penerimaan. Coba catat invoice kedua untuk penerimaan sama: ditolak dengan pesan menyebut invoice yang ada. |

## Edge cases (optional)

- Invoice dengan beberapa baris, sebagian cocok dan sebagian `SELISIH`: invoice berstatus `SELISIH` secara keseluruhan (R-04).
- Invoice kurang tagih terhadap qty lulus (AC-05).
- Invoice dicatat setelah sebagian penerimaan (PG-006 `sebagian`) (AC-20 dan AC-21).
- Invoice dibatalkan setelah utang diakui: menunggu PG-009 (pembayaran teralokasi) untuk uji penuh.

## Verifiability

- AC-01, AC-03, AC-04, AC-05, AC-07, AC-12, AC-13, AC-16, AC-17, AC-18, AC-19, AC-20, AC-21 → langkah UI dan pemeriksaan utang, jurnal, dan status.
- AC-02, AC-09, AC-11, AC-14 → bandingkan jurnal dan saldo sebelum dan sesudah. Oracle: debit sama dengan kredit; saldo stok tidak berubah.
- AC-06, AC-08, AC-10, AC-15 → bergantung pada konfigurasi toleransi, nomor invoice, dan tarif PPN dari seed. Oracle: status dan nilai sesuai aturan R-03.
