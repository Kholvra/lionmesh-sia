---
id: C-009
slug: laporan-keuangan
title: Laporan keuangan
epic: EPIC-CORE
milestone: M1–M2
lane: active
sequence: 1
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: L
depends_on:
  - FND-006
blocks:
  - C-010
  - INT-001
  - PD-009
owner_role: tech lead
package: docs/product/items/C-009-laporan-keuangan
---

# C-009 — Laporan keuangan

## Masalah

Jurnal dari empat siklus sudah akan ada, tetapi tidak ada cara membacanya sebagai laporan keuangan. Akibatnya, kesalahan posting baru terlihat di akhir, saat neraca tidak balance (analisis §9.4).

## Outcome

Pengguna yang berwenang dapat membuka tujuh laporan untuk periode akuntansi yang dipilih (daftar `EPIC-CORE`):

- **Buku besar** per akun: setiap baris jurnal yang memengaruhi akun itu, beserta saldo berjalan.
- **Neraca saldo**: total debit dan total kredit per akun pada periode itu.
- **Laba rugi**: pendapatan, beban, dan laba bersih.
- **Neraca**: aktiva, kewajiban, dan ekuitas.
- **Daftar jurnal**: seluruh jurnal dan barisnya pada periode itu.
- **Arus kas**: kas dan bank (peran `kas_bank`, D-35; nomor 102 di konfigurasi, D-41) per periode `[USULAN]`, proses-bisnis.md §14.
- **Kartu persediaan**: mutasi dan saldo per produk dan per gudang untuk peran `persediaan_bahan`, `persediaan_wip`, dan `persediaan_barang_jadi` (D-35, D-41, D-52) `[USULAN]`, proses-bisnis.md §14.

Setiap angka dapat ditelusuri ke baris jurnal sumbernya. Membuka laporan tidak mengubah data apa pun.

Aturan yang berlaku:

- **Periode**: satu bulan kalender (D-50). Rentang bebas tidak termasuk.
- **Keluaran**: layar (D-50). Ekspor dan cetak tidak termasuk item ini.
- **Hak baca**: Accounting, Manajemen, dan Direksi (`[USULAN-AGEN]`, PT-02). Matriks-izin belum punya baris (koordinasi).
- **Neraca bulanan**: memuat baris ekuitas "laba tahun berjalan" sampai periode dipilih (`[USULAN-AGEN]`, PT-03). Akun nominal baru ditutup di tutup buku tahunan (D-44 (5)).
- **Laba rugi**: akun peran pendapatan (401) dan beban (501, 601, 602, 701). 601 dan 602 ikut bila masih ada saldo sisa (D-44 (4)). 702 dicadangkan dan tidak dihitung (D-41).
- **Dokumen batal**: dokumen batal tanpa jurnal tidak tampil. Dokumen berjurnal yang dibatalkan tampil bersama jurnal pembaliknya di buku besar dan daftar jurnal (`[USULAN-AGEN]`, PT-08).

## Aktor

| Aktor | Peran |
|---|---|
| Accounting | menyusun dan membaca laporan |
| Manajemen, Direksi | membaca laporan (`[USULAN-AGEN]`, PT-02). Matriks-izin (D-33) belum punya baris untuk ketujuh laporan ini (koordinasi) |
| Sistem (core) | menyusun angka dari jurnal yang tercatat |

## Cakupan

### Termasuk

- Buku besar, neraca saldo, daftar jurnal, laba rugi, neraca, arus kas, dan kartu persediaan untuk satu periode akuntansi. Semuanya membaca buku besar (D-43).
- Penelusuran dari angka laporan ke baris jurnal.
- Pembacaan jurnal dari seluruh siklus yang sudah memposting lewat `postJournal()`.

### Tidak termasuk

- Penulisan jurnal dan aturan posting: milik `FND-006` (`postJournal()`) dan modul pemanggil.
- Tutup buku dan jurnal penutup: `C-010`.
- COA, periode akuntansi, dan pengelompokan akun: milik `FND-006`.
- Laporan per modul (penjualan, pembelian, produksi, payroll): milik masing-masing siklus.
- Format ekspor dan cetak: tidak termasuk; layar saja (D-50).

## Status dan transisi

Laporan tidak punya state machine. Laporan hanya membaca status periode akuntansi yang dimiliki `FND-006`:

| Status periode | Arti | Efek pada laporan |
|---|---|---|
| `terbuka` | jurnal masih bisa diposting | laporan menampilkan angka berjalan |
| `terkunci` | ditutup lewat `C-010` | laporan tetap bisa dibuka dan tidak berubah (`[USULAN]`) |

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Periode belum dipilih | Laporan tidak ditampilkan. Pengguna diminta memilih periode. |
| Periode tanpa jurnal | Laporan menampilkan nol, bukan error (`[USULAN]`). |
| Neraca saldo tidak seimbang | Laporan menampilkan selisih dan menandai bahwa angkanya tidak seimbang. Jangan menyembunyikan selisih. |
| Pengguna tanpa hak melihat laporan | Akses ditolak dengan pesan yang bisa dibaca. Angka tidak ditampilkan. Aturan hak: PT-02 (`[USULAN-AGEN]`). |
| Rentang lebih dari satu bulan | Laporan tidak ditampilkan. Pengguna diminta memilih satu bulan (D-50). |

Teks pesan final ditentukan saat implementasi, selama memuat kondisi di atas.

## Batasan

- Laporan hanya membaca. Tidak ada tulisan ke jurnal, saldo, atau periode (`D-07`).
- Laporan tidak menghitung ulang dari tabel transaksi; membaca buku besar (`D-43`).
- Laporan lintas siklus berada di core, dan modul tidak membaca tabel modul lain (`D-25`).
- Uang disimpan dengan presisi `numeric(18,2)`. Pembulatan dilakukan saat tampil (`[USULAN]`, analisis §10.6).
- Mata uang IDR. Transaksi tetap IDR sampai ada kebutuhan (`D-38`); laporan multi-mata uang tidak termasuk (PT-06 terjawab).

## Dependensi

- `FND-006` harus `done`: COA, `postJournal()`, dan periode akuntansi harus tersedia.
- Tidak ada `depends on` lain. Data uji: `db:reset` + `db:seed` (D-30) setelah `FND-008` selesai; sebelum itu fixture lewat `postJournal()` (PT-07, `[USULAN-AGEN]`).

## Yang membuka jalan

- `C-010`: tutup buku membutuhkan laporan untuk memeriksa neraca sebelum periode dikunci.
- `INT-001`: jurnal gabungan diuji dengan neraca saldo dan laba rugi dari item ini.

## Catatan serah terima

Mekanisme penyusunan (query, view, atau read model) diserahkan ke implementasi. Requirement ini mengikat hasil yang terlihat dan bukti yang bisa diulang.

Nomor urut `sequence: 1` mengikuti urutan baris pada tabel Core di `backlog.md`, bukan urutan pengiriman. Topologi Core adalah graph (sebagian item tidak memblokir siklus mana pun), jadi nomor ini tidak wajib dan dapat diganti `n/a` bila tech lead menilainya tidak berguna.

Urutan: `D-34` menempatkan item ini di gelombang 2 (menyusul), bukan level 1 seperti di `backlog.md`. Kolom level di backlog belum diselaraskan.
