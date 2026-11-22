# Backlog — Lionmesh SIA

Sumber kebenaran tunggal untuk urutan dan status pekerjaan.

## Cara baca

| Kolom | Arti |
|---|---|
| **ID** | identitas permanen. Tidak pernah dipakai ulang |
| **Fitur** | kode fitur di `reference/analisis-sia.md` §5 |
| **Track** | lane kerja di dalam satu siklus. Satu track = satu orang |
| **Level** | panjang jalur dependensi. **Derived**, bukan normatif |
| **Depends on** | prasyarat sebenarnya. Item boleh mulai begitu semua selesai |
| **Status** | `idea` · `discovery` · `specified` · `ready` · `in progress` · `blocked` · `done` |
| **Paket** | bukan kolom: paket item ada di `items/<ID>-<slug>/`, dibuat saat item masuk `specified` |

`level` dipakai untuk melihat **apa yang bisa dikerjakan serentak**. Item dengan level sama tidak saling bergantung, kecuali ditulis eksplisit di `depends on`.

Status `idea` = outcome sudah diketahui, paket requirement belum ditulis. Ini bukan tanda item ditunda.

## Fondasi — serial

Satu pemilik: tech lead. Urutan wajib.

| ID | Outcome | Sequence | Depends on | Status |
|---|---|---|---|---|
| `FND-001` | Lingkungan pengembangan yang dapat diulang + gerbang mutu | 1 | — | `done` |
| `FND-002` | Skema domain inti + migrasi bernomor | 2 | `FND-001` | `idea` |
| `FND-003` | Autentikasi & 12 peran staf dengan RLS | 3 | `FND-002` | `idea` |
| `FND-004` | Dokumen: penomoran, status, riwayat, approval berjenjang | 4 | `FND-002`, `FND-003` | `idea` |
| `FND-005` | Inventory: mutasi, saldo, valuasi rata-rata bergerak | 5 | `FND-002` | `idea` |
| `FND-006` | Ledger: COA, `postJournal()`, periode akuntansi | 6 | `FND-002`, `FND-003` | `idea` |
| `FND-007` | UI kit bersama: tabel, form, status badge, dialog | 7 | `FND-002` | `idea` |
| `FND-008` | Seed deterministik + reset ke skema `siap` | 8 | `FND-001`, `FND-002` | `idea` |

**Gate:** `FND-001`–`FND-006` berstatus `done` sebelum item modul mana pun boleh `ready`. `FND-007` (UI kit) dan `FND-008` (seed) boleh selesai paralel dengan gelombang pertama; item modul yang butuh primitive UI baru menunggu `FND-007`.

## Siklus Pendapatan — 4 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `PD-001` | Pelanggan, termin, batas kredit | PD-A master | 1 | `FND-003` | `idea` |
| `PD-002` | Pesanan penjualan + cek kredit | PD-B transaksi | 2 | `PD-001`, `FND-004` | `idea` |
| `PD-003` | Cek & reservasi stok | PD-B transaksi | 1 | `FND-005` | `idea` |
| `PD-004` | Pengiriman + surat jalan | PD-B transaksi | 3 | `PD-002`, `PD-003` | `idea` |
| `PD-005` | Faktur penjualan & piutang | PD-C keuangan | 4 | `PD-004`, `FND-006` | `idea` |
| `PD-006` | Penerimaan pembayaran | PD-C keuangan | 5 | `PD-005`, `FND-006` | `idea` |
| `PD-007` | Retur penjualan | PD-C keuangan | 5 | `PD-005`, `FND-005` | `idea` |
| `PD-008` | Jurnal penjualan & HPP | PD-D pelaporan | 6 | `PD-004`…`PD-007`, `FND-006` | `idea` |
| `PD-009` | Laporan penjualan, piutang, aging | PD-D pelaporan | 6 | `PD-005`…`PD-007` | `idea` |

## Siklus Pengeluaran — 5 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `PG-001` | Pemasok, termin, toleransi match | PG-A master | 1 | `FND-003` | `idea` |
| `PG-002` | Permintaan pembelian | PG-B pengadaan | 2 | `PG-001`, `C-013` | `idea` |
| `PG-003` | Approval berjenjang | PG-B pengadaan | 3 | `PG-002`, `FND-004` | `idea` |
| `PG-004` | Pemilihan pemasok & perbandingan harga | PG-B pengadaan | 3 | `PG-002`, `PG-001` | `idea` |
| `PG-005` | Purchase order | PG-B pengadaan | 4 | `PG-003`, `PG-004` | `idea` |
| `PG-006` | Penerimaan barang | PG-C penerimaan | 5 | `PG-005`, `FND-005` | `idea` |
| `PG-007` | QC bahan & retur ke pemasok | PG-C penerimaan | 6 | `PG-006`, `FND-005` | `idea` |
| `PG-008` | Three-way match & utang usaha | PG-D utang | 7 | `PG-007`, `FND-006` | `idea` |
| `PG-009` | Pembayaran utang | PG-D utang | 8 | `PG-008`, `FND-006` | `idea` |
| `PG-010` | Rekonsiliasi bank | PG-E bank | 1 | `FND-006` | `idea` |

`PG-010` sengaja berdiri sendiri. Ia tidak menunggu rantai PO selesai — hanya butuh ledger.

## Siklus Produksi — 4 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `PR-001` | BOM berversi & toleransi (master produk di `C-011`) | PR-A master | 2 | `C-011`, `FND-002` | `idea` |
| `PR-002` | Perintah produksi | PR-B eksekusi | 3 | `PR-001`, `FND-004` | `idea` |
| `PR-003` | Kebutuhan & permintaan bahan | PR-B eksekusi | 4 | `PR-002`, `C-013` | `idea` |
| `PR-004` | Pemakaian bahan & WIP | PR-B eksekusi | 5 | `PR-003`, `FND-005` | `idea` |
| `PR-005` | Hasil produksi & QC (rework/reject) | PR-C mutu | 4 | `PR-002`, `FND-005` | `idea` |
| `PR-006` | Biaya produksi & HPP | PR-D biaya | 6 | `PR-004`, `PR-005`, `FND-006` | `idea` |
| `PR-007` | Laporan produksi & efisiensi | PR-D biaya | 7 | `PR-006` | `idea` |

`PR-003` bergantung pada `C-013` (domain pengadaan di core), bukan pada seluruh siklus Pengeluaran. Jadi Produksi tidak ikut menunggu `PG-005`.

`PR-001` tidak membuat tabel produk sendiri. Master produk ada di `C-011`; track Produksi hanya memiliki BOM, versinya, dan toleransinya.

## Siklus Penggajian — 4 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `GJ-001` | Karyawan, gaji pokok, PTKP | GJ-A master | 1 | `FND-003` | `idea` |
| `GJ-002` | Presensi & pengajuan lembur | GJ-B presensi | 2 | `GJ-001`, `FND-004` | `idea` |
| `GJ-003` | Rekap & validasi presensi | GJ-B presensi | 3 | `GJ-002` | `idea` |
| `GJ-004` | Hitung payroll | GJ-C payroll | 4 | `GJ-003`, `FND-002` | `idea` |
| `GJ-005` | Periksa & setujui payroll | GJ-C payroll | 5 | `GJ-004`, `FND-004` | `idea` |
| `GJ-006` | Pembayaran gaji & slip | GJ-D bayar | 6 | `GJ-005`, `FND-006` | `idea` |
| `GJ-007` | Jurnal & laporan payroll | GJ-D bayar | 7 | `GJ-006`, `FND-006` | `idea` |
| `GJ-008` | Impor presensi dari mesin | GJ-B presensi | 3 | `GJ-002` | `idea` |

## Core bersama — 4 track

Sebagian tidak memblokir siklus mana pun. Satu di antaranya memblokir dua item lintas siklus.

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `C-009` | Laporan keuangan | CORE-A laporan | 1 | `FND-006` | `idea` |
| `C-010` | Tutup buku & jurnal penutup | CORE-B tutup | 2 | `C-009` | `idea` |
| `C-011` | Master data terpadu: produk, gudang, satuan | CORE-C master | 1 | `FND-002` | `idea` |
| `C-012` | Notifikasi in-app + email | CORE-C master | 1 | `FND-004` | `idea` |
| `C-013` | Domain pengadaan: tabel + aturan status (permintaan, PO, penerimaan) | CORE-D pengadaan | 1 | `FND-002`, `FND-004`, `FND-005` | `idea` |

`C-013` adalah penerapan `D-05`. Ia **memblokir** `PG-002` dan `PR-003`, tapi bukan seluruh siklus: layar dan alur approval tetap milik track Pengeluaran. Karena itu ia ada di core, bukan di `PG-*` — supaya Produksi tidak ikut menunggu siklus Pengeluaran selesai.

`C-011` hanya memiliki master yang dipakai lintas siklus: produk, gudang, dan satuan. `akun` (COA) lahir di `FND-006`; `C-011` membacanya, bukan membuatnya.

## Integrasi — join

| ID | Outcome | Level | Depends on | Status |
|---|---|---|---|---|
| `INT-001` | Jurnal gabungan konsisten lintas empat siklus | 9 | `PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, `C-010` | `idea` |
| `INT-002` | Uji rantai end-to-end dari `db:reset` + `db:seed` | 10 | `INT-001` | `idea` |
| `INT-003` | Rekonsiliasi stok vs jurnal vs laporan | 10 | `INT-001` | `idea` |

## Matriks paralel

Terbaca per level. Semua item dalam satu baris boleh dikerjakan serentak.

| Level | Pendapatan | Pengeluaran | Produksi | Penggajian | Core | Jumlah |
|---|---|---|---|---|---|---|
| 1 | `PD-001` `PD-003` | `PG-001` `PG-010` | — | `GJ-001` | `C-009` `C-011` `C-012` `C-013` | **9** |
| 2 | `PD-002` | `PG-002` | `PR-001` | `GJ-002` | `C-010` | 5 |
| 3 | `PD-004` | `PG-003` `PG-004` | `PR-002` | `GJ-003` `GJ-008` | — | 6 |
| 4 | `PD-005` | `PG-005` | `PR-003` `PR-005` | `GJ-004` | — | 5 |
| 5 | `PD-006` `PD-007` | `PG-006` | `PR-004` | `GJ-005` | — | 5 |
| 6 | `PD-008` `PD-009` | `PG-007` | `PR-006` | `GJ-006` | — | 5 |
| 7 | — | `PG-008` | `PR-007` | `GJ-007` | — | 3 |
| 8 | — | `PG-009` | — | — | — | 1 |
| 9 | — | — | — | — | — | `INT-001` |
| 10 | — | — | — | — | — | `INT-002` `INT-003` |

**Puncak paralel: 9 item serentak di level 1, dan baru terbuka setelah gate `FND-001`–`FND-006` selesai.** Setelah itu turun karena rantai dokumen memang berurutan.

**Titik kritis awal: `C-013`.** Dua siklus menunggunya. Ia harus selesai di gelombang pertama, bukan menyusul.

## Aturan gate

1. **Gate fondasi** — tidak ada item modul `ready` sebelum `FND-001`–`FND-006` `done`. `FND-007`/`FND-008` boleh menyusul paralel, dengan pengecualian primitive UI seperti di atas.
2. **Gate per item** — `depends on` harus `done`, bukan sekadar "hampir".
3. **Gate migrasi** — DDL dari kelompok berupa usulan; tech lead yang menomori dan merge.
4. **Gate join** — `INT-001` tidak boleh mulai sebelum seluruh jurnal siklus ada.
5. **`level` tidak mengikat** — kalau `depends on` sudah `done`, item boleh mulai walau level lebih tinggi. Pengecualian: gate fondasi (aturan 1) tetap berlaku lebih dulu.

## Changelog

| Tanggal | Perubahan |
|---|---|
| 2026-11-17 | Inisialisasi. 50 item: 8 fondasi, 34 modul, 5 core bersama, 3 integrasi |
| 2026-11-17 | Tambah `C-013` domain pengadaan (level 1, memblokir `PG-002` dan `PR-003`) |
| 2026-11-19 | Gate fondasi dipersempit ke `FND-001`–`FND-006`; `FND-007`/`FND-008` boleh paralel |
| 2026-11-19 | `C-011` tidak lagi memiliki `akun` (COA milik `FND-006`); `PR-001` bergantung `C-011`, level rantai Produksi bergeser +1 |
| 2026-11-19 | `FND-001` diselaraskan ke `in progress` di semua dokumen |
| 2026-11-22 | `FND-001` → `done`: CI merah lalu hijau terbukti di PR #3; branch `fnd-001-lingkungan` di-merge ke `main` |
| 2026-11-22 | `INT-001` menambah `C-010` ke `depends on` (selaras `EPIC-INT`); gate fondasi ditegaskan menang atas aturan 5; `README` level 1 dikoreksi ke 9 item; `FND-001` diselaraskan (D-30) |
| 2026-11-22 | Catatan pemetaan `D-01` (FND-001/002/008 infrastruktur; `C6`/`C8` belum punya item); bukti `INV-01` dikoreksi ke riwayat git; istilah "seed kosong" diganti `db:reset` + `db:seed` |
