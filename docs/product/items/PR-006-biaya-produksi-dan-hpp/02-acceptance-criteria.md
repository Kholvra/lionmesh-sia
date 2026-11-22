# PR-006 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Semua pertanyaan sudah terjawab; tidak ada kriteria yang menunggu keputusan. Tarif dan persen memakai placeholder (`t`, `r`, `p%`, `h`); nilai nyata diverifikasi saat implementasi (`D-51`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | HPP WO dihitung dengan rumus mengikat: bahan × harga rata + TKL + DLH × tarif + rework − reject abnormal, dibagi jumlah lulus untuk per unit | Siapkan data uji: satu WO dengan nilai bahan, jam, DLH, tarif, rework, dan reject yang sudah diketahui. Hitung manual. Bandingkan dengan HPP di UI. Selisih nol |
| `AC-02` | Setiap komponen HPP menunjuk ke dokumen sumbernya (mutasi, WO, kartu jam kerja, tarif) | Dari UI, buka HPP WO. Setiap baris punya tautan ke dokumen sumber |
| `AC-03` | Overhead memakai tarif predeterminasi, bukan biaya aktual | Ubah biaya aktual overhead pada data uji. HPP tidak berubah. Tarif tidak berubah |
| `AC-04` | Jurnal pembebanan dan penyesuaian HPP diposting lewat `postJournal()` dengan debit = kredit, dan membawa jenis transaksi asal dan nomor transaksi | Buka jurnal: debit sama dengan kredit. Review kode: tidak ada insert jurnal dari modul Produksi |
| `AC-05` | HPP final tidak bisa dihitung untuk WO yang belum `SELESAI`; pembebanan tetap berjalan saat `HASIL_DICATAT` | Dari UI, buka WO `HASIL_DICATAT`. Tombol HPP final ditolak dengan pesan yang menyebut status. Pembebanan tercatat |
| `AC-06` | Perubahan BOM tidak mengubah HPP WO yang sudah final | Hitung HPP WO. Buat versi BOM baru dengan bahan berbeda. Buka HPP WO lama: angka sama |
| `AC-07` | Periode terkunci menolak posting dengan pesan yang jelas; tidak ada jurnal baru | Kunci periode uji. Coba posting. Ditolak dengan pesan dari `01-requirement.md`. Jumlah jurnal tidak bertambah |
| `AC-08` | Tarif overhead yang belum ada untuk periode ditolak dengan pesan | Hapus tarif periode uji. Hitung pembebanan. Ditolak dengan pesan yang menyebut periode |
| `AC-09` | Hanya Accounting yang bisa memposting HPP; peran lain ditolak | Login sebagai peran selain Accounting. Coba posting. Ditolak dengan pesan |
| `AC-10` | TKL dibaca dari kartu jam kerja Produksi lewat service modul, tidak dari tabel penggajian | Review kode dan pencarian query: tidak ada akses ke tabel `GJ-*` |
| `AC-11` | Pembebanan TKL dan overhead sama dengan jam × tarif dan DLH × tarif; pembebanan ulang hanya untuk jam dan DLH tambahan | Catat jam awal, lalu tambahan setelah rework. Jurnal kedua hanya untuk selisih jam dan DLH |
| `AC-12` | Penyesuaian HPP final setelah barang jadi diterima menambah atau mengurangi saldo `persediaan_barang_jadi` hanya sebesar sisa WIP WO | Setelah semua L diterima, saldo `barang_dalam_proses` WO nol kecuali sisa beban lambat. Sisa dibukukan. Saldo WIP WO nol |
| `AC-13` | Biaya rework memakai bahan tambahan dari `PR-004`, jam rework, dan DLH rework, sesuai `01-requirement.md` | Uji dengan satu siklus rework. Komponen biaya rework cocok dengan hitung manual |
| `AC-14` | Setiap pembebanan dan penyesuaian menyimpan tautan ke dokumen sumber (`INV-05`) | Uji database: setiap baris jurnal punya nomor transaksi dan jenis transaksi asal |

## Verifiability

- `AC-01`, `AC-03`, `AC-06`, `AC-11`, `AC-13` → uji dengan data uji yang dikunci; salinan hasil hitung dan angka manual dicatat.
- `AC-02`, `AC-05`, `AC-07`–`AC-09` → uji manual dari UI.
- `AC-04`, `AC-12`, `AC-14` → uji database dan uji `postJournal()`.
- `AC-10` → review kode dan pencarian query.
