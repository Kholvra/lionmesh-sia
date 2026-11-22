# PD-005 — Acceptance Criteria

Setiap kriteria dapat dibuktikan lewat UI dan pemeriksaan jurnal. Tarif PPN dinyatakan sebagai T (`D-51(a)`); nilai T tidak ditulis di paket ini.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Faktur hanya bisa dibuat dari pengiriman `DIKIRIM`. | Buka aksi buat faktur untuk pengiriman `DRAFT`: tidak tersedia atau ditolak "Faktur hanya dapat dibuat dari pengiriman yang sudah dikirim.". |
| `AC-02` | Pengiriman yang sudah difakturkan tidak bisa difakturkan lagi. | Buat faktur dari pengiriman, lalu coba lagi. Ditolak "Pengiriman ini sudah memiliki faktur."; hanya satu faktur tersimpan. |
| `AC-03` | Total faktur = DPP + PPN per baris; PPN memakai T yang berlaku pada tanggal faktur. | Baris qty kirim 10 × harga 100.000, diskon 0: DPP 1.000.000; PPN = 1.000.000 × T; total = 1.000.000 + PPN. Layar sama dengan hitungan dari T yang sama (uji unit dengan T uji). |
| `AC-04` | Jatuh tempo = tanggal faktur + termin (`D-14`, `D-49`). | Termin 30, tanggal faktur 1 Desember: jatuh tempo 31 Desember. |
| `AC-05` | Penerbitan menambah piutang sebesar total faktur dan membentuk satu jurnal: Dr `piutang_usaha` total, Cr `penjualan` DPP, Cr `ppn_keluaran` PPN. | Sebelum: piutang 0. Terbitkan faktur dengan DPP 1.000.000 dan PPN = 1.000.000 × T. Sesudah: piutang = total; satu jurnal debit = kredit; `sumber_tipe` = faktur. |
| `AC-06` | Nomor faktur pajak disimpan sesuai input manual tanpa validasi format. | Isi "ABC-1" (format bebas) dan simpan: nilai tersimpan sama dengan input. |
| `AC-07` | Setiap transisi status menulis riwayat. | Terbitkan dan (pada faktur lain) batalkan dari `DRAFT`: masing-masing dua baris riwayat dengan aktor dan waktu. |
| `AC-08` | Daftar piutang menempatkan tiap faktur di bucket umur yang benar. | Tanggal laporan = jatuh tempo + 0 → belum jatuh tempo; + 10 hari → 1–30; + 45 → 31–60; + 90 → 61–90; + 120 → lebih dari 90. |
| `AC-09` | Periode terkunci menolak penerbitan dengan pesan jelas. | Kunci periode (`FND-006`). Terbitkan faktur di periode itu: ditolak "Periode ... sudah ditutup..."; tidak ada faktur atau jurnal. |
| `AC-10` | Nomor faktur pajak wajib diisi sebelum faktur diterbitkan. | Kosongkan nomor, terbitkan: ditolak "Nomor faktur pajak wajib diisi sebelum faktur diterbitkan."; status tetap `DRAFT`. |
| `AC-11` | Faktur yang sudah berpembayaran tidak bisa dibatalkan. | Terbitkan faktur, catat pembayaran (`PD-006`), lalu batalkan: ditolak "Faktur yang sudah menerima pembayaran tidak dapat dibatalkan."; tidak ada jurnal baru. |
| `AC-12` | Faktur `DITERBITKAN` tanpa pembayaran dibatalkan lewat jurnal pembalik; pengiriman dapat difakturkan ulang. | Batalkan dengan alasan: jurnal pembalik dengan nilai sama dan arah berlawanan; jurnal asal tetap; piutang kembali 0; buat faktur baru dari pengiriman yang sama diterima. |
| `AC-13` | Hanya Accounting yang menerbitkan faktur dan melihat piutang sesuai `D-33`. | Login sebagai Penjualan: aksi terbit ditolak; daftar piutang tidak tampil. Login sebagai Manajemen: daftar piutang tampil. |
| `AC-14` | Pesanan menjadi `DIFAKTURKAN` setelah seluruh pengirimannya difakturkan. | Pesanan dengan dua pengiriman: terbitkan faktur pertama → status tetap `TERKIRIM`/`TERKIRIM_SEBAGIAN`; terbitkan kedua → `DIFAKTURKAN`. |
| `AC-15` | Qty faktur sama dengan qty kirim pengiriman, bukan qty pesanan. | Pesanan 500, pengiriman 200 `DIKIRIM`. Faktur mencatat qty 200 dan nilai sesuai 200. |

## Edge cases (optional)

- Tarif PPN berubah di tengah periode: `AC-03` memakai tarif tanggal faktur.
- Faktur batal setelah pembayaran: `AC-11`.

## Verifiability

- `AC-01`, `AC-02`, `AC-06`, `AC-07`, `AC-10`, `AC-13`..`AC-15` → uji manual UI.
- `AC-03`, `AC-04` → uji unit rumus dengan T uji dan data tetap.
- `AC-05`, `AC-09`, `AC-11`, `AC-12` → pemeriksaan jurnal dan periode setelah `FND-006`.
- `AC-08` → uji dengan data seed deterministik (`FND-008`) dan tanggal laporan yang diatur.
