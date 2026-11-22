# PD-009 — Diskusi

## Konteks

Manajemen dan Accounting perlu melihat penjualan, piutang, dan kas dari siklus pendapatan. `analisis-sia.md` §5.2 (PD-9) menyebut laporan penjualan, piutang, dan kas dengan prioritas P1. `EPIC-PD` mensyaratkan bahwa laporan menunjukkan angka yang sama dengan jurnal. Item ini adalah track PD-D pelaporan, level 6, dengan dependensi `PD-005`–`PD-007` dan `C-009`.

## Actor / consumer

Manajemen dan Accounting melihat laporan. Penjualan melihat laporan penjualan (`D-33`). Laporan lintas siklus adalah milik core (`D-25`, `C-009`).

## Problem

Tanpa laporan, piutang yang jatuh tempo tidak terlihat, dan kas dari penjualan tidak bisa dicocokkan dengan jurnal.

## Desired outcome

Pengguna berwenang membuka laporan penjualan per bulan (per pelanggan dan per produk), laporan piutang dengan umur, dan laporan penerimaan kas. Angka sama dengan jurnal untuk periode yang sama.

## Known constraints

- `D-25`, `ARCH-08`: laporan lintas siklus lewat service core atau read model core.
- `D-43`: semua laporan membaca buku besar; tidak menghitung ulang dari tabel transaksi untuk angka yang sudah ada di jurnal.
- `D-50`: laporan tampil di layar dulu; ekspor menyusul; periode bulanan.
- `D-51(f)`: laporan penjualan per bulan, per pelanggan, per produk; bucket umur piutang sebagai parameter.
- `D-33`: izin laporan per peran.
- `analisis-sia.md` §9.2 G14: laporan dihitung saat dibuka, tidak disimpan.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Pengelompokan laporan penjualan dan periodenya? | Terjawab — D-51(f) dan D-50: penjualan per bulan, per pelanggan, dan per produk; periode = bulan akuntansi (periode bulanan). |
| `PQ-02` | Sumber angka kas: buku besar atau tabel penerimaan? | Terjawab — D-43 dan D-25: angka kas dan penjualan dibaca dari buku besar lewat service core; tidak menghitung ulang dari tabel transaksi. |
| `PQ-03` | Dependensi `C-009` di `depends on`? | Terjawab — D-25 dan `backlog.md`: `C-009` sudah ada di `depends on`. |
| `PQ-04` | Bucket umur piutang? | Terjawab — D-51(f): belum jatuh tempo, 1–30, 31–60, 61–90, lebih dari 90 hari, sebagai parameter. |
| `PQ-05` | Siapa boleh membuka laporan kas? | Terjawab — D-33 untuk penjualan (Penjualan, Accounting, Manajemen) dan piutang (Accounting, Manajemen); laporan kas: [USULAN-AGEN] Accounting dan Manajemen. Alasan: laporan kas adalah angka verifikasi Accounting, sama dengan akses piutang (`D-33`). Baris matriks belum ada. |
| `PQ-06` | Format keluaran: layar, CSV, atau PDF? | Terjawab — D-50: tampil di layar dulu; ekspor menyusul sebagai item terpisah. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-25` | laporan lintas siklus milik core | decisions.md | kas dan jurnal lewat service core |
| `D-43` | semua laporan membaca buku besar | decisions.md | angka sama dengan jurnal |
| `D-50` | layar dulu; bulanan | decisions.md | tidak ada ekspor di item ini |
| `D-51(f)` | dimensi dan bucket | decisions.md | rincian laporan |
| `ARCH-08` | modul tidak membaca tabel modul lain | `ARCH-001` | tidak ada query lintas siklus |

## Assumptions (agent-proposed)

- `[USULAN]` Laporan dihitung saat dibuka (`analisis-sia.md` §9.2 G14).
- `[USULAN]` Dokumen batal tampil dengan nilai nol (`analisis-sia.md` §7.1 prinsip 3).

## Rejected alternatives

- Tabel laporan tersimpan: ditolak (`analisis-sia.md` §7.3, G14).
- Laporan penjualan dihitung dari tabel faktur saja tanpa buku besar: ditolak (`D-43`).

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu dependensi dan gate fondasi (lihat `03-readiness-review.md`).
