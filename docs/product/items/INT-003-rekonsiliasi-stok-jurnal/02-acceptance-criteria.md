# INT-003 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Untuk setiap produk dan gudang, qty di `saldo_stok` sama dengan jumlah `mutasi_stok.qty`. | Jalankan `pnpm db:reset`, `pnpm db:seed`, lalu rantai mutasi uji (dari `FND-005`). Bandingkan per produk dan gudang. |
| `AC-02` | Untuk setiap produk dan gudang, nilai di `saldo_stok` sama persis dengan `qty × harga_rata` dibulatkan dengan aturan tetap ke dua desimal (toleransi nol, PT-03 `[USULAN-AGEN]`). | Ambil setiap baris `saldo_stok`. Hitung `qty × harga_rata`, bulatkan dengan aturan tertulis di kontrak. Bandingkan dengan `nilai`. Selisih satu sen tampil sebagai selisih. |
| `AC-03` | Total nilai persediaan di neraca dari `C-009` sama dengan total `saldo_stok.nilai`. | Jumlahkan `saldo_stok.nilai`. Buka neraca dari `C-009`. Bandingkan dengan jumlah saldo akun peran `persediaan_bahan`, `persediaan_wip`, dan `persediaan_barang_jadi` (`D-41`). |
| `AC-04` | Setiap selisih yang ditemukan tampil dengan produk, gudang, dan nilai selisih. Tidak ada selisih yang tidak tampil. | Sisipkan selisih uji lewat jalur yang diizinkan. Jalankan rekonsiliasi. Periksa daftar selisih. |
| `AC-05` | Rekonsiliasi tidak mengubah baris `mutasi_stok`, `saldo_stok`, atau jurnal. | Catat jumlah baris dan nilai kunci sebelum dan sesudah rekonsiliasi. Harus sama. |
| `AC-06` | Dua kali rekonsiliasi pada data yang sama menghasilkan hasil identik. | Jalankan dua kali. Bandingkan daftar selisih. |
| `AC-07` | Stok fisik dari stock opname (`D-52`) sama dengan saldo. Bila tidak sama, selisih tampil per produk dan gudang. Rekonsiliasi tidak membuat mutasi penyesuaian sendiri (PT-02, `[USULAN-AGEN]`). | Catat stock opname uji dengan selisih. Jalankan rekonsiliasi. Periksa daftar selisih dan hitung baris `mutasi_stok` sebelum dan sesudah. |
| `AC-08` | Akun persediaan 120, 121, dan 122 (`D-41`) ada dan dipakai rekonsiliasi. Jika belum, rekonsiliasi menolak jalan dan menyebut akun yang kurang. | Jalankan rekonsiliasi dengan satu akun persediaan uji tidak ada. Catat pesan. |
| `AC-09` | Saldo qty negatif tampil sebagai selisih. Rekonsiliasi tidak memperbaikinya (PT-07, `[USULAN-AGEN]`). | Sisipkan saldo negatif uji lewat jalur yang diizinkan. Jalankan rekonsiliasi. Periksa daftar selisih dan saldo: tidak berubah. |
| `AC-10` | Gudang nonaktif dengan saldo tetap dihitung dan tampil sebagai baris pada rekonsiliasi (`D-50`, `D-52`). | Nonaktifkan satu gudang yang punya saldo. Jalankan rekonsiliasi. Periksa baris gudang itu. |
| `AC-11` | Toleransi nol: selisih satu satuan terkecil numerik (0,0001 qty atau 0,01 nilai) tampil sebagai selisih (PT-03, `[USULAN-AGEN]`). | Sisipkan selisih satu satuan terkecil uji. Jalankan rekonsiliasi. Periksa daftar selisih. |

## Edge cases (optional)

- Produk tanpa mutasi tetapi punya saldo: dianggap selisih (`[USULAN]`).
- Gudang nonaktif dengan saldo: AC-10.

## Verifiability

- AC-01, AC-02, AC-03, AC-05, AC-06, AC-09, AC-10, AC-11 → perintah SQL dan pembanding yang bisa diulang.
- AC-04 dan AC-07 → catatan selisih uji yang dibuat sendiri, lalu dibandingkan dengan keluaran.
- AC-08 → langkah uji sebelum dan sesudah akun ditetapkan.
