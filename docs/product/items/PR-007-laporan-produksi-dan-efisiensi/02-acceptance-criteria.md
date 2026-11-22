# PR-007 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Semua pertanyaan sudah terjawab; tidak ada kriteria yang menunggu keputusan. Angka contoh memakai placeholder (`x`, `y`, `p%`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Laporan produksi untuk satu periode menampilkan WO, diproses, lulus, rework, dan reject yang cocok dengan catatan hasil dan keputusan QC | Siapkan data uji dengan jumlah yang diketahui. Buka laporan periode itu. Bandingkan setiap angka dengan dokumen WO dan keputusan QC. Selisih nol |
| `AC-02` | Laporan WIP menampilkan nilai WIP per WO yang sama dengan nilai di detail WO dan saldo akun WIP di buku besar | Buka laporan WIP. Bandingkan dengan detail WO dan jurnal. Angka sama |
| `AC-03` | Kuantitas persediaan per gudang sama dengan `saldo_stok`; nilainya sama dengan saldo akun persediaan di buku besar | Buka laporan persediaan. Bandingkan kuantitas dengan `saldo_stok` dan nilai dengan buku besar (uji database). Angka sama |
| `AC-04` | Kerugian produksi di atas toleransi tampil sebagai kerugian dengan jumlah yang benar | Gunakan data uji dengan reject di atas batas (`PR-005` AC-06). Buka laporan. Kerugian tampil dengan jumlah benar |
| `AC-05` | Laporan tidak menulis data: tabel mutasi, saldo, dan jurnal tidak berubah sebelum dan sesudah membuka semua laporan | Catat jumlah baris dan checksum tabel; buka semua laporan; bandingkan |
| `AC-06` | Periode awal yang lebih besar dari periode akhir ditolak dengan pesan "Periode awal tidak boleh setelah periode akhir." | Dari UI, isi periode terbalik. Ditolak |
| `AC-07` | Peran tanpa hak lihat tidak bisa membuka laporan | Login sebagai peran di luar daftar `D-33` (Produksi, Gudang, Manajemen, Accounting). Coba buka: ditolak dengan pesan |
| `AC-08` | Laporan tidak membaca tabel milik modul lain secara langsung | Review kode dan pencarian query: akses lewat service core atau read model |
| `AC-09` | Yield = lolos ÷ diproses dan efisiensi bahan = bahan standar untuk output lolos ÷ bahan aktual sesuai `01-requirement.md` | Uji data dengan angka yang diketahui (`p%` placeholder). Bandingkan dengan hitung manual |
| `AC-10` | Pembagi nol pada indikator menampilkan "Belum ada data untuk menghitung indikator ini.", bukan nol | Uji WO tanpa diproses. Indikator menampilkan pesan |
| `AC-11` | Data sumber belum lengkap: laporan tidak menampilkan angka final | Uji periode dengan keputusan QC belum lengkap. Pesan "Angka belum lengkap ..." muncul; tidak ada angka final |
| `AC-12` | Filter periode akuntansi memakai tanggal jurnal; WO lintas periode tampil di periode transaksinya | Uji WO dengan transaksi di dua periode. Setiap periode menampilkan bagiannya |
| `AC-13` | Laporan dengan satu gudang tidak menampilkan pilihan gudang; dengan dua gudang tampil dan total gabungan sama dengan jumlah gudang | Uji dengan seed satu gudang dan dengan dua gudang |

## Verifiability

- `AC-01`–`AC-04`, `AC-06`, `AC-07`, `AC-09`–`AC-13` → uji manual dari UI dengan data uji; salinan angka dicatat.
- `AC-03` → uji database: perbandingan `saldo_stok` dan buku besar.
- `AC-05` → perbandingan jumlah baris dan checksum tabel sebelum dan sesudah.
- `AC-08` → review kode dan pencarian query.
