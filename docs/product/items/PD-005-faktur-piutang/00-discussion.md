# PD-005 — Diskusi

## Konteks

Faktur diterbitkan dari pengiriman yang sudah dikirim (`analisis-sia.md` §6.6, §8.1: "barang yang sudah dikirim baru difakturkan"). Faktur membentuk piutang usaha dan menjadi dasar aging. Item ini adalah track PD-C keuangan, level 4, dengan dependensi `PD-004` dan `FND-006` (ledger).

## Actor / consumer

Accounting menerbitkan faktur (`D-33`). Manajemen melihat piutang (`D-33`). Penjualan tidak melihat piutang. Pelanggan tidak punya akun.

## Problem

Tanpa faktur, nilai tagihan tidak terhubung ke barang yang keluar, piutang tidak tercatat, dan pelanggan tidak punya jatuh tempo.

## Desired outcome

Accounting menerbitkan faktur dari satu pengiriman yang sudah dikirim. Faktur memuat nilai, PPN, nomor faktur pajak (manual, `D-24`), dan jatuh tempo dari termin. Piutang bertambah, aging tersedia, dan jurnal penjualan dibentuk lewat `postJournal()`.

## Known constraints

- `D-14`: termin default 30 hari, override per dokumen.
- `D-17`: harga bersih; PPN dihitung di dokumen; tarif dari `konfigurasi_pajak` berversi (`D-51(a)`).
- `D-24`: nomor faktur pajak diinput manual; integrasi e-Faktur belum dipakai.
- `D-35`: peran akun; dokumen batal menghasilkan jurnal pembalik.
- `D-43`, `D-44` (3): jurnal langsung diposting; piutang dan penjualan saat faktur terbit.
- `D-47(b)`: pengiriman `DIKIRIM` adalah barang keluar.
- `D-48`: pembatalan sebelum posting; setelah posting hanya lewat jurnal pembalik.
- `D-49`: jatuh tempo = tanggal faktur + termin.
- `D-51(f)`: bucket umur piutang.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Satu faktur per pengiriman atau beberapa? | Terjawab — [USULAN-AGEN]: satu faktur per pengiriman (`UNIQUE(pengiriman_id)`); satu pesanan boleh punya banyak faktur, satu per pengiriman. Faktur boleh diterbitkan sejak pengiriman `DIKIRIM`. Pesanan pindah ke `DIFAKTURKAN` bila seluruh pengirimannya sudah difakturkan (`D-46`). Alasan: `D-49` menetapkan satu invoice per penerimaan dengan prinsip yang sama; `DIKIRIM` adalah titik barang keluar (`D-47(b)`). |
| `PQ-02` | Tarif PPN berlaku dan nilainya? | Terjawab — D-51: mekanisme berversi; nilai diverifikasi dan dikutip sumbernya saat implementasi. |
| `PQ-03` | Format dan kewajiban nomor faktur pajak? | Terjawab — D-51(a): input manual tanpa validasi format. Kewajiban isi saat terbit: [USULAN-AGEN], wajib diisi sebelum faktur `DITERBITKAN` karena setiap faktur ber-PPN perlu nomor yang bisa ditelusuri. |
| `PQ-04` | Akun piutang, penjualan, dan PPN keluaran? | Terjawab — D-35 dan D-41: peran `piutang_usaha`, `penjualan`, `ppn_keluaran`. Nomor PPN keluaran diberikan saat `FND-006` ditulis; modul tidak memakai nomor. |
| `PQ-05` | Rentang bucket aging? | Terjawab — D-51(f): belum jatuh tempo, 1–30, 31–60, 61–90, lebih dari 90 hari, sebagai parameter. Tafsir umur = hari lewat jatuh tempo pada tanggal laporan: [USULAN-AGEN], karena label "belum jatuh tempo" hanya bermakna dengan dasar itu. |
| `PQ-06` | Kapan jurnal pendapatan terbentuk? | Terjawab — D-44 (3): piutang dan penjualan saat faktur terbit; HPP terpisah saat pengiriman. |
| `PQ-07` | Jatuh tempo dihitung dari tanggal faktur atau pengiriman? | Terjawab — D-49: jatuh tempo = tanggal faktur + termin. |
| `PQ-08` | Faktur dibatalkan setelah berjurnal? | Terjawab — D-35 (jurnal pembalik) dan [USULAN-AGEN]: faktur `DITERBITKAN` hanya boleh dibatalkan bila belum ada pembayaran; pembatalan membentuk jurnal pembalik dan melepas tautan pengiriman sehingga pengiriman dapat difakturkan ulang. Alasan: piutang yang sudah dibayar tidak boleh dibatalkan tanpa alur retur. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-14` | termin default dan override | decisions.md | jatuh tempo dari termin |
| `D-17` | PPN di dokumen, tarif berversi | decisions.md | tidak ada tarif di kode |
| `D-24` | nomor faktur pajak manual | decisions.md | input manual |
| `D-35`, `D-41` | peran akun dan COA | decisions.md | modul memanggil peran |
| `D-43`, `D-44` (3) | jurnal saat faktur | decisions.md | Dr `piutang_usaha` / Cr `penjualan` dan `ppn_keluaran` |

## Assumptions (agent-proposed)

- `[USULAN]` Faktur tidak bisa dibuat dari pesanan (`analisis-sia.md` §6.6).
- `[USULAN]` Pajak disimpan per baris faktur, bukan hanya header (`analisis-sia.md` §7.4).

## Rejected alternatives

- Faktur dari pesanan: ditolak; tagihan tidak sama dengan barang keluar (`analisis-sia.md` §6.6).

## Catatan pertentangan

- Makalah: satu pesanan paling banyak satu pengiriman dan satu faktur. `D-46` memuat pengiriman bertahap; `PQ-01` menjawab kardinalitas.
- `D-51(a)` menulis "verifikasi tarif saat `PD-005` ditulis"; instruksi paket menulis "saat implementasi". Diperlukan keputusan koordinator; nilai T tidak ditulis di sini.

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu `PD-004`, `FND-006`, dan gate fondasi (lihat `03-readiness-review.md`).
