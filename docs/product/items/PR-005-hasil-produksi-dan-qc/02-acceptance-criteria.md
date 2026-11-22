# PR-005 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Semua pertanyaan sudah terjawab; tidak ada kriteria yang menunggu keputusan. Persentase toleransi dan nilai biaya memakai placeholder (`p%`, `h`, `x`); nilai nyata diverifikasi saat implementasi (`D-51`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Produksi dapat mencatat jumlah hasil diproses per WO; WO berpindah ke `HASIL_DICATAT` dan riwayat bertambah | Dari UI, login Produksi; catat jumlah pada WO `BERJALAN`. Status `HASIL_DICATAT`. Riwayat satu baris |
| `AC-02` | QC hanya bisa memutuskan dengan tiga kategori lulus, rework, dan reject; jumlahnya harus sama dengan jumlah diproses | Dari UI sebagai QC, buka hasil. Tiga isian tampil. Isi jumlah tidak cocok: ditolak dengan pesan "Lulus, rework, dan reject ... harus sama dengan jumlah diproses" |
| `AC-03` | Peran selain QC tidak bisa membuat keputusan QC; pencatat hasil tidak bisa memeriksa hasilnya sendiri | Login sebagai Produksi, coba isi keputusan QC: ditolak dengan pesan. Data tidak berubah |
| `AC-04` | Jumlah negatif ditolak dengan pesan yang menyebut jumlah | Dari UI, isi `-1`. Pesan "Jumlah ... tidak boleh negatif." Tidak ada baris baru |
| `AC-05` | Reject yang sama dengan atau di bawah toleransi diserap; tidak ada baris kerugian | Atur toleransi `p%` pada BOM uji. Catat diproses `D` dan reject `⌊p% × D⌋`. Keputusan QC. Tidak ada jurnal kerugian. Nilai WIP habis ke barang jadi |
| `AC-06` | Reject di atas toleransi dibukukan sebagai kerugian produksi abnormal dengan nilai `(J − p% × D) × h` | Uji dengan reject `J` di atas batas. Jurnal `kerugian_produksi_abnormal` sama dengan hitung manual. Total hasil konsisten |
| `AC-07` | Penerimaan barang jadi lulus menambah saldo barang jadi, menurunkan WIP sebesar nilainya, dan mengubah WO menjadi `SELESAI` setelah seluruh lulus diterima | Catat saldo barang jadi dan WIP. Terima sebagian lulus, lalu sisanya. Saldo naik sesuai qty; WIP turun sama nilainya; WO `SELESAI` setelah sisa habis |
| `AC-08` | Barang yang belum lulus QC, atau dengan status `REWORK`, tidak bisa diterima gudang | Dari UI sebagai Gudang, coba terima hasil `REWORK` atau belum diputuskan. Ditolak dengan pesan "Barang belum lulus QC ..." |
| `AC-09` | Setiap perubahan status hasil dan WO tercatat di riwayat dengan aktor dan waktu | Ubah keputusan QC (dengan dokumen baru). Riwayat bertambah |
| `AC-10` | Penerimaan melebihi jumlah lulus yang belum diterima ditolak dengan pesan dari `01-requirement.md` | Dari UI, terima `L + 1`. Ditolak: "Jumlah diterima melebihi jumlah lulus QC ..." |
| `AC-11` | Keputusan QC dengan `R > 0` membawa WO ke `REWORK`; penerimaan lulus ditunda sampai WO kembali ke `QC_PASSED` | Catat hasil dengan rework dan lulus. Status `REWORK`. Coba terima lulus: ditolak. Catat ulang dan putuskan lagi dengan `R = 0`: `QC_PASSED` |
| `AC-12` | Seluruh reject (`L = 0`, `R = 0`) membawa WO ke `REJECTED`; seluruh saldo WIP dibukukan sebagai kerugian | Catat hasil semua reject. Status `REJECTED`. Saldo WIP WO nol. Jurnal kerugian sama dengan saldo WIP sebelum keputusan |
| `AC-13` | Jurnal kerugian dan barang jadi diposting lewat `postJournal()` dengan debit = kredit, dan membawa jenis transaksi asal dan nomor transaksi | Buka jurnal: debit sama dengan kredit. Review kode: tidak ada insert jurnal dari modul |
| `AC-14` | Mutasi barang jadi tidak boleh backdate | Uji service: tanggal penerimaan sebelum mutasi terakhir ditolak |

## Verifiability

- `AC-01`–`AC-04`, `AC-08`–`AC-12` → uji manual dari UI per peran; salinan hasil dicatat.
- `AC-05`, `AC-06` → uji dengan nilai toleransi yang sudah ditetapkan di data uji; hitung manual.
- `AC-07`, `AC-13`, `AC-14` → uji database dan uji `postJournal()`.
- `AC-09` → uji perilaku; salinan riwayat dicatat.
