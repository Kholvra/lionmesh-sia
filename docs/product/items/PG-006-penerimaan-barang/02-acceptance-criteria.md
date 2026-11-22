# PG-006 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Rujukan `R-xx` menunjuk aturan di `01-requirement.md`.

Langkah dasar untuk semua kriteria: `pnpm db:reset` lalu `pnpm db:seed`, lalu login sebagai pengguna dengan peran sesuai. Data seed memuat satu PO berstatus `DITERBITKAN` dengan minimal dua baris, satu PO berstatus selain `DITERBITKAN`, dan satu gudang aktif.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Gudang mencatat penerimaan `penuh` untuk PO berstatus `DITERBITKAN`; dokumen tersimpan dengan nomor unik sesuai format `TRM/{TAHUN}/{BULAN}/{URUT}` (R-07), status `DITERIMA`, dan satu baris riwayat pertama. Dokumen tampil di daftar penerimaan. Menguji R-01, R-07. | Login sebagai Gudang, buka PO seed yang diterbitkan, pilih jenis `penuh`, isi qty sama dengan PO untuk semua baris, simpan. Cek nomor, status, daftar, dan riwayat. |
| `AC-02` | Setelah penerimaan AC-01 tercatat, jumlah baris `mutasi_stok`, isi `saldo_stok`, dan jumlah jurnal tidak berubah. Menguji R-06, POST-02. | Catat jumlah baris `mutasi_stok`, isi `saldo_stok`, dan jumlah jurnal sebelum penerimaan (lewat tabel atau laporan yang tersedia). Catat penerimaan. Bandingkan: ketiganya sama. Pemeriksaan ini tidak membutuhkan perhitungan nilai FND-005. |
| `AC-03` | Penerimaan untuk PO yang tidak `DITERBITKAN` atau `DITERIMA_SEBAGIAN` ditolak dengan pesan yang menyebut status PO. Menguji R-01. | Di data seed, pilih PO selain yang diterbitkan. Coba catat penerimaan. Catat pesan dan pastikan tidak ada dokumen baru. |
| `AC-04` | Qty kosong, nol, atau negatif ditolak; pesan menyebut baris yang salah; tidak ada dokumen tersimpan. Menguji input validation. | Isi qty `0`, `-1`, lalu kosong pada satu baris. Simpan tiap kali. Catat pesan. Cek daftar penerimaan: tidak bertambah. |
| `AC-05` | Pada penerimaan `penuh`, qty yang berbeda dari qty PO tersimpan sebagai selisih exception dan tampil dengan qty PO dan qty diterima. Qty PO tidak berubah. Menguji R-02, POST-03. | Isi qty satu unit lebih kecil dari PO pada jenis `penuh`. Simpan. Buka dokumen: selisih tampil dengan kedua angka. Cek qty PO tidak berubah. |
| `AC-06` | Dua pencatatan untuk PO yang sama bersamaan: tepat satu berhasil, yang lain ditolak dengan pesan "dokumen sudah diproses". Menguji INV-02 dan kegagalan bersamaan. | Buka dua sesi Gudang di dua browser. Kirim penerimaan untuk PO sama hampir bersamaan. Hitung dokumen baru: tepat satu. Catat pesan penolakan. |
| `AC-07` | Penerimaan yang sudah tersimpan tidak punya aksi edit isi. Koreksi hanya lewat pembatalan (sebelum QC) atau PG-007 (sesudah QC). Menguji R-09, INV-04. | Buka dokumen tercatat. Pastikan tidak ada tombol atau jalur edit isi. Cek bahwa pembatalan tersedia hanya bila belum ada hasil QC. |
| `AC-08` | Setiap perubahan status tampil di riwayat dengan aktor dan waktu. Menguji INV-03. | Lakukan satu perubahan status yang diizinkan (mis. penerimaan dibatalkan, AC-12). Buka riwayat: ada baris baru dengan nama aktor dan waktu. |
| `AC-09` | Seluruh alur AC-01 sampai AC-05 bisa dijalankan dari UI, bukan dari API atau skrip. | Ulangi AC-01 dan AC-05 hanya melalui layar aplikasi. Catat bahwa tidak ada skrip yang dipakai. |
| `AC-10` | Penerimaan bertahap: penerimaan `sebagian` pertama mengubah status PO menjadi `DITERIMA_SEBAGIAN` tanpa exception; penerimaan kedua untuk sisa membuat PO `DITERIMA` setelah sisa habis. Menguji R-02, R-03, R-04, POST-04. | Pada PO seed dengan qty 10 untuk satu baris, catat penerimaan `sebagian` dengan qty 4. Cek status PO `DITERIMA_SEBAGIAN` dan tidak ada exception. Catat penerimaan `penuh` dengan qty 6. Cek status PO `DITERIMA` dan tidak ada exception. |
| `AC-11` | Penerimaan yang membuat total per baris melebihi qty PO ditolak; pesan menyebut baris, qty PO, dan sisa; exception kelebihan tercatat; tidak ada dokumen penerimaan baru. Menguji R-03, PRE-04, INV-05. | Pada PO seed dengan sisa 6, coba catat penerimaan dengan qty 7. Catat pesan. Cek daftar penerimaan tidak bertambah dan daftar exception menampilkan kejadian ini. |
| `AC-12` | Pembatalan penerimaan sebelum QC: alasan kosong ditolak; alasan terisi mengubah status menjadi `DIBATALKAN`, sisa qty PO kembali, dan tidak ada mutasi atau jurnal. Setelah QC dicatat pada satu baris, pembatalan ditolak dengan pesan. Menguji R-08, PRE-05, POST-05. | Catat penerimaan. Coba batalkan tanpa alasan, lalu dengan alasan. Cek status dan sisa PO. Cek jumlah baris `mutasi_stok` dan jurnal tidak berubah. Bagian kedua (setelah QC dicatat) dijalankan saat PG-007 sudah ada: catat hasil QC untuk satu penerimaan lain dan coba batalkan, lalu ditolak dengan pesan. |
| `AC-13` | Pilihan gudang tampil hanya bila gudang aktif lebih dari satu. Menguji R-05. | Dengan seed satu gudang, buka layar penerimaan: pilihan gudang tidak tampil. Tambah satu gudang aktif lewat master (C-011) lalu buka lagi: pilihan tampil. |
| `AC-14` | Exception selisih ditutup oleh Purchasing dengan alasan tercatat; qty PO, sisa, dan saldo tidak berubah; riwayat mencatat penutupan. Menguji R-10, POST-03. | Login sebagai Purchasing, buka exception dari AC-05, tutup dengan alasan. Cek qty PO, sisa, dan saldo tidak berubah. Cek riwayat penutupan dengan aktor dan waktu. |

## Edge cases (optional)

- Penerimaan dengan satu baris saja dan PO berbanyak baris (perilaku sama per baris).
- Penerimaan `sebagian` yang sudah menghabiskan sisa (diperlakukan sebagai `penuh`, lihat AC-10).

## Verifiability

- AC-01, AC-03, AC-04, AC-06, AC-08, AC-09, AC-10, AC-11, AC-13, AC-14 → langkah manual UI dan pemeriksaan daftar, status, dan riwayat.
- AC-02 dan AC-12 → bandingkan jumlah baris `mutasi_stok`, isi `saldo_stok`, dan jurnal sebelum dan sesudah. Oracle: tidak ada selisih.
- AC-05, AC-07, AC-11 → bandingkan dokumen, qty PO, dan daftar exception sebelum dan sesudah. Oracle: qty PO tidak berubah dan tidak ada dokumen baru ketika ditolak.
