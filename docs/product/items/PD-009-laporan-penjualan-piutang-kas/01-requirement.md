---
id: PD-009
slug: laporan-penjualan-piutang-kas
title: Laporan penjualan, piutang, dan kas
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P1
size: M
depends_on:
  - C-009
  - PD-005
  - PD-006
  - PD-007
blocks: []
owner_role: kelompok Pendapatan, track PD-D (orang belum ditetapkan)
package: docs/product/items/PD-009-laporan-penjualan-piutang-kas
---

# PD-009 — Laporan penjualan, piutang, dan kas

## Masalah

Manajemen dan Accounting tidak bisa melihat total penjualan, piutang yang belum dibayar, dan kas yang masuk dari penjualan dalam satu tempat. Angka yang tersedia tidak bisa dicocokkan dengan jurnal.

## Outcome

Pengguna berwenang membuka tiga laporan di layar: penjualan per bulan (dengan rincian per pelanggan dan per produk), piutang dengan umur, dan penerimaan kas per bulan. Angka setiap laporan untuk periode yang sama sama dengan jurnal penjualan dan penerimaan.

## Aktor

| Aktor | Peran |
|---|---|
| Manajemen | melihat laporan penjualan dan piutang (`D-33`); laporan kas (`[USULAN-AGEN]`) |
| Accounting | melihat ketiga laporan (`D-33`, `[USULAN-AGEN]` untuk kas) |
| Penjualan | melihat laporan penjualan (`D-33`); tidak melihat piutang atau kas |

## Cakupan

### Termasuk

- Laporan penjualan per bulan: total, dan rincian per pelanggan dan per produk (neto retur).
- Laporan piutang per pelanggan dengan umur tiap faktur dalam bucket (`D-51(f)`).
- Laporan penerimaan kas per bulan (dari buku besar, akun `kas_bank`).
- Angka sama dengan jurnal untuk periode yang sama.
- Dokumen batal tampil dengan nilai nol.

### Tidak termasuk

- Laporan keuangan standar: buku besar, neraca saldo, laba rugi, neraca (`C-009`).
- Tutup buku (`C-010`).
- Laporan pembelian, produksi, dan penggajian (siklus lain).
- Ekspor CSV atau PDF (`D-50`; menyusul sebagai item terpisah).
- Laporan yang disimpan sebagai tabel (`analisis-sia.md` §9.2 G14).

## States

Tidak ada status. Laporan bersifat baca dan dihitung saat dibuka.

## Definisi angka

- Penjualan periode = Σ kredit `penjualan` − Σ debit `penjualan` dari buku besar pada bulan itu (neto retur), termasuk rincian per pelanggan (dari faktur dan kredit memo) dan per produk (dari baris faktur).
- Kas periode = Σ debit `kas_bank` dari buku besar pada bulan itu.
- Piutang per faktur = sisa faktur pada tanggal laporan. Umur = hari lewat jatuh tempo pada tanggal laporan (`[USULAN-AGEN]`, lihat `PD-005`).
- Bucket umur: belum jatuh tempo (umur ≤ 0), 1–30, 31–60, 61–90, lebih dari 90 hari (`D-51(f)`, parameter).

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Periode tidak dipilih | "Pilih periode laporan." |
| Periode melewati tanggal hari ini | "Periode tidak boleh melebihi hari ini." |
| Pengguna tanpa izin | "Anda tidak berwenang melihat laporan ini." |
| Tidak ada data pada periode | "Tidak ada transaksi pada periode ini." |
| Tanggal laporan piutang melewati hari ini | "Tanggal laporan tidak boleh melebihi hari ini." |

## Batasan

- Modul tidak membaca tabel modul lain (`D-25`, `ARCH-08`). Kas dan jurnal dibaca lewat service core buku besar.
- Laporan tidak menulis baris apa pun (`POST-02`).

## Dependensi

- `PD-005`, `PD-006`, `PD-007` — sumber data faktur, penerimaan, dan retur.
- `C-009` — buku besar dan read model laporan (`D-25`); sudah di `depends on` `backlog.md`.

## Yang membuka jalan

- Tidak ada langsung (`INT-001` bergantung pada `PD-008`).

## Catatan serah terima

Kepemilikan laporan kas: core untuk angka buku besar (`D-25`, `D-43`); tampilan di modul Pendapatan. Baris matriks untuk "lihat laporan kas" (Accounting, Manajemen) belum ada; ditambahkan lewat `FND-003` sebagai revisi `D-33`.
