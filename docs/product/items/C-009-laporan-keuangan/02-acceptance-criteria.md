# C-009 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Buku besar untuk satu akun pada periode terpilih menampilkan setiap baris jurnal yang memengaruhi akun itu, dengan tanggal, nomor sumber, debit, kredit, dan saldo berjalan. Saldo akhir sama dengan saldo awal ditambah total debit dikurangi total kredit. | Jalankan `pnpm db:reset` lalu `pnpm db:seed` (atau fixture `postJournal()` sebelum `FND-008` selesai, PT-07). Posting lima jurnal uji dengan nilai yang sudah dihitung tangan (tabel nilai dicatat di `05-evidence.md`). Buka buku besar untuk satu akun, bandingkan setiap baris dan saldo akhir dengan tabel. |
| `AC-02` | Neraca saldo untuk periode yang sama menampilkan total debit sama dengan total kredit. Bila tidak sama, laporan menampilkan selisih dan tidak menyembunyikannya. | Pada data uji AC-01, buka neraca saldo; bandingkan total. Sisipkan selisih lewat jalur yang diizinkan untuk uji negatif (bila ada) dan pastikan selisih tampil. |
| `AC-03` | Laba rugi menampilkan semua akun peran pendapatan (401) dan beban (501, 601, 602, 701) pada periode itu, termasuk 601 atau 602 bila masih ada saldo sisa. Laba bersih sama dengan pendapatan dikurangi beban. Akun di luar kelompok ini tidak muncul. | Pada data uji AC-01, hitung pendapatan dan beban manual; bandingkan dengan laba rugi. Pastikan 702 (dicadangkan) tidak muncul sebagai baris. |
| `AC-04` | Neraca menampilkan aktiva sama dengan kewajiban ditambah ekuitas. Laba tahun berjalan tampil sebagai baris ekuitas tersendiri (`[USULAN-AGEN]`, PT-03). | Pada data uji AC-01, bandingkan total aktiva dan total kewajiban plus ekuitas. |
| `AC-05` | Membuka laporan tidak menambah, mengubah, atau menghapus baris jurnal, saldo, maupun status periode. | Catat jumlah baris `jurnal` dan `detail_jurnal` sebelum dan sesudah membuka ketujuh laporan. Jumlahnya harus sama. |
| `AC-06` | Dua kali membuka laporan yang sama untuk data yang sama menghasilkan angka identik. | Buka laporan, catat angka. Buka lagi tanpa mengubah data. Bandingkan. |
| `AC-07` | Angka tampil dibulatkan ke dua desimal. Nilai di database tetap presisi `numeric(18,2)`. `[USULAN]` | Jalankan query nilai tersimpan dan bandingkan dengan nilai tampil. |
| `AC-08` | Pengguna tanpa hak melihat laporan ditolak dengan pesan yang bisa dibaca, dan angka tidak muncul di respons. Hak per PT-02 (`[USULAN-AGEN]`): Accounting, Manajemen, Direksi. | Login sebagai peran tanpa hak (mis. Penjualan), buka laporan, pastikan pesan muncul dan tidak ada angka. |
| `AC-09` | Daftar jurnal, arus kas, dan kartu persediaan untuk periode uji memuat baris yang sama dengan `detail_jurnal` dan tidak menghitung ulang dari tabel transaksi. `[USULAN]` | Pada data uji AC-01, buka tiga laporan itu. Bandingkan jumlah baris dan total dengan hitung langsung dari `detail_jurnal` pada akun yang sama. |
| `AC-10` | Laporan menerima tepat satu bulan kalender (D-50). Rentang lebih dari satu bulan ditolak dengan pesan yang meminta satu bulan. | Pilih rentang dua bulan. Catat pesan. Pastikan tidak ada angka tampil. |
| `AC-11` | Dokumen batal tanpa jurnal tidak muncul di laporan. Dokumen berjurnal yang dibatalkan: jurnal asli dan jurnal pembalik tampil di buku besar, dan saldo netto akun nol (`[USULAN-AGEN]`, PT-08). | Buat satu dokumen, batalkan sebelum posting, buka buku besar: tidak ada baris. Batalkan satu dokumen berjurnal, buka buku besar: dua baris, saldo netto nol. |

## Edge cases (optional)

- Periode tanpa jurnal: laporan menampilkan nol, bukan error (`[USULAN]`).
- Periode terkunci: laporan tetap dapat dibuka dan angkanya sama dengan sebelum penguncian (`[USULAN]`).

## Verifiability

- AC-01 sampai AC-04, AC-07, AC-09, AC-10, dan AC-11 → uji fixture dengan data uji yang dihitung tangan, dijalankan dari `db:reset` + `db:seed` (atau fixture `postJournal()` sebelum `FND-008`). Pembanding nilai dicatat di `05-evidence.md`.
- AC-05 dan AC-06 → perintah hitung baris dan pembanding angka, bukan pengamatan manusia saja.
- AC-08 → uji peran dari sesi login, bukan dari klien.
