# INT-001 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Setelah rantai siklus dijalankan dari data uji, total debit seluruh jurnal sama dengan total kredit. Pemetaan per kejadian sesuai PT-02 (`00`). | Jalankan `pnpm db:reset` lalu `pnpm db:seed`. Jalankan rantai siklus berurutan. Jumlahkan seluruh `detail_jurnal` untuk debit dan kredit. Bandingkan. |
| `AC-02` | Setiap jurnal header punya total debit sama dengan total kredit. Tidak ada jurnal yang tidak balance tersimpan. | Dari data `AC-01`, kelompokkan `detail_jurnal` per jurnal. Hitung selisih. Harus nol untuk setiap jurnal. |
| `AC-03` | Setiap baris jurnal menunjuk akun yang ada di COA dan aktif. Tidak ada akun menggantung (definisi PT-03, `[USULAN-AGEN]`: akun tidak ada atau nonaktif). | Cocokkan setiap `akun_id` di `detail_jurnal` dengan COA. Hitung baris yang tidak cocok. Harus nol. |
| `AC-04` | Setiap jurnal punya `sumber_tipe` dan `sumber_id` yang menunjuk dokumen yang ada. Setiap jurnal juga menyimpan jenis transaksi asal, nomor transaksi asal, dan pemicunya (`D-43`). | Hitung jurnal dengan sumber kosong atau sumber yang tidak ditemukan. Harus nol. |
| `AC-05` | Neraca saldo dari `C-009` untuk periode uji balance. | Buka neraca saldo lewat `C-009`. Bandingkan total debit dan total kredit. |
| `AC-06` | Setiap angka pendapatan dan beban di laba rugi dapat ditelusuri ke jurnal per siklus. | Ambil total per siklus dari jurnal sumber (`PD-008`, `PG-009`, `PR-007`, `GJ-007`). Bandingkan dengan laba rugi per kelompok. |
| `AC-07` | Tidak ada tulisan langsung ke tabel jurnal dari luar core ledger. | Cari `insert`, `update`, dan `delete` ke `jurnal` dan `detail_jurnal` di `src/modules/`. Hasilnya nol. |
| `AC-08` | Posting ke periode terkunci ditolak dan tidak menyisakan baris. | Tutup satu periode (`C-010`). Coba posting dari modul. Hitung baris sebelum dan sesudah. |
| `AC-09` | Dua kali pengujian dari `db:reset` + `db:seed` menghasilkan jumlah jurnal dan total yang sama. | Jalankan dua kali. Bandingkan jumlah jurnal, total debit, dan total kredit. |
| `AC-10` | Jurnal yang sudah tersimpan tidak bisa diubah atau dihapus. Koreksi dibuat sebagai jurnal pembalik (`D-43`, `D-35`). | Coba ubah atau hapus satu baris jurnal dari luar core. Ditolak. Buat jurnal pembalik untuk satu jurnal uji. Hitung baris dan saldo. |
| `AC-11` | Pembayaran pemasok menghasilkan jurnal Dr `utang_usaha` / Cr `kas_bank`. Alokasi pembayaran ke beberapa invoice dimulai dari invoice tertua (`D-49`, `D-41`). | Bayar satu pemasok dengan dua invoice uji, nilai sebagian. Periksa jurnal dan alokasi tertua. |
| `AC-12` | Payroll yang disetujui Direksi menghasilkan jurnal akrual Dr beban gaji / Cr `utang_gaji`. Pembayaran gaji menghasilkan Dr `utang_gaji` / Cr `kas_bank` (`D-49`). | Dari data payroll uji yang disetujui, periksa jurnal akrual. Bayar, periksa jurnal pembayaran. Saldo `utang_gaji` nol setelah pembayaran penuh. |
| `AC-13` | Setiap baris jurnal memakai peran akun dari konfigurasi. Tidak ada nomor akun literal di kode modul (`D-35`, `D-41`). | Cari nomor akun literal (pola angka akun) di `src/modules/`. Hasilnya nol. |
| `AC-14` | Setiap kejadian (1) sampai (7) di `00` PT-02 menghasilkan jurnal dengan jenis transaksi asal yang benar (`D-43`, `D-44`). | Jalankan rantai uji. Periksa jenis transaksi asal dan peran akun per kejadian. |

## Edge cases (optional)

- Selisih pembulatan: toleransi nol (`D-43`). Tidak ada toleransi per jurnal.
- Jurnal penutup dari `C-010`: dihitung sebagai jurnal, dan tetap harus balance.
- Jurnal aset tetap dan penyusutan: tidak ada (`D-45`).

## Verifiability

- AC-01, AC-02, AC-04, AC-07, AC-09, AC-11 sampai AC-14 → perintah SQL atau skrip pembanding yang bisa diulang.
- AC-03 → pencocokan COA yang bisa diulang.
- AC-05 dan AC-06 → pembanding angka dari `C-009`.
- AC-08 → langkah uji dari modul pemanggil.
- AC-10 → uji perilaku dari pemanggil dan perintah SQL.
