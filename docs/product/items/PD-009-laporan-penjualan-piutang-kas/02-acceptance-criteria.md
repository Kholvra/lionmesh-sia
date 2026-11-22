# PD-009 — Acceptance Criteria

Setiap kriteria dapat dibuktikan dengan membuka laporan di UI dan membandingkan dengan jurnal. Angka contoh bersifat ilustrasi.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Laporan penjualan periode Oktober menampilkan total penjualan neto Oktober. | Pada seed deterministik, jumlahkan DPP faktur Oktober dikurangi DPP retur Oktober secara manual. Bandingkan dengan total laporan: sama. |
| `AC-02` | Laporan piutang menampilkan sisa tiap faktur dan umurnya dalam bucket yang benar. | Tanggal laporan tetap. Faktur dengan umur 0, 10, 45, 90, dan 120 hari lewat jatuh tempo ditempatkan di bucket belum jatuh tempo, 1–30, 31–60, 61–90, dan lebih dari 90. Sisa sesuai `PD-006`. |
| `AC-03` | Laporan penerimaan kas menampilkan total penerimaan periode sama dengan total debit `kas_bank` di buku besar. | Bandingkan total laporan dengan buku besar akun `kas_bank` untuk bulan yang sama: selisih nol. |
| `AC-04` | Angka penjualan di laporan sama dengan jumlah kredit akun `penjualan` dikurangi debit untuk periode yang sama. | Uji `AC-09` `PD-008`: selisih nol. |
| `AC-05` | Dokumen batal tampil dengan nilai nol. | Batalkan faktur (`PD-005` `AC-12`). Laporan penjualan tetap memuat baris faktur dengan nilai 0 untuk periode itu. |
| `AC-06` | Periode tanpa transaksi menampilkan pesan, bukan tabel kosong tanpa penjelasan. | Pilih periode tanpa transaksi. Pesan "Tidak ada transaksi pada periode ini." muncul. |
| `AC-07` | Pengguna tanpa izin tidak bisa membuka laporan. | Login sebagai Gudang dan buka laporan penjualan, piutang, atau kas: ditolak "Anda tidak berwenang melihat laporan ini."; login sebagai Penjualan: piutang dan kas ditolak. |
| `AC-08` | Laporan tidak disimpan sebagai tabel. | Periksa skema basis data: tidak ada tabel laporan untuk `PD-009`. |
| `AC-09` | Periode yang melewati hari ini ditolak. | Pilih periode masa depan. Pesan "Periode tidak boleh melebihi hari ini." muncul. |
| `AC-10` | Laporan penjualan dapat dirinci per pelanggan dan per produk untuk periode yang sama, dengan total rincian sama dengan total periode. | Pilih bulan; jumlahkan rincian per pelanggan dan per produk: sama dengan total laporan. |
| `AC-11` | Laporan piutang memakai tanggal laporan yang dipilih, tidak melebihi hari ini. | Tanggal laporan = hari ini + 1: ditolak "Tanggal laporan tidak boleh melebihi hari ini." |
| `AC-12` | Laporan dihitung saat dibuka; mengubah data sumber mengubah angka pada pembukaan berikutnya. | Terbitkan faktur baru, buka ulang laporan piutang: sisa baru muncul tanpa proses terpisah. |

## Edge cases (optional)

- Bulan dengan retur dan penjualan: neto (`AC-01`).
- Periode yang dikunci (`D-50`): laporan tetap bisa dibaca.

## Verifiability

- `AC-01`..`AC-03`, `AC-05`..`AC-07`, `AC-09`..`AC-12` → uji manual UI dengan seed deterministik (`FND-008`).
- `AC-04` → pemeriksaan jurnal dan laporan setelah `PD-008`.
- `AC-08` → pemeriksaan skema basis data.
