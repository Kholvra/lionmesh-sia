---
id: PD-008
slug: jurnal-penjualan-hpp
title: Jurnal penjualan dan HPP
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: M
depends_on:
  - FND-006
  - PD-004
  - PD-005
  - PD-006
  - PD-007
blocks:
  - INT-001
owner_role: kelompok Pendapatan, track PD-D (orang belum ditetapkan)
package: docs/product/items/PD-008-jurnal-penjualan-hpp
---

# PD-008 — Jurnal penjualan dan HPP

## Masalah

Kejadian penjualan (pengiriman, faktur, pembayaran, retur) sudah terjadi, tetapi buku besar tidak mencatatnya. Laporan keuangan tidak menampilkan penjualan dan harga pokok.

## Outcome

Setiap kejadian penjualan yang sah secara otomatis membentuk jurnal yang balance, dengan peran akun yang dikunci dan nilai yang bersumber dari dokumen dan harga rata-rata. Accounting dapat melihat jurnal yang terbentuk dari setiap dokumen. Dokumen yang dibatalkan setelah berjurnal membentuk jurnal pembalik, tanpa menghapus jurnal asal.

## Aktor

| Aktor | Peran |
|---|---|
| Accounting | melihat jurnal dan buku besar penjualan; tidak menulis jurnal |
| Sistem | membentuk jurnal saat kejadian terjadi, melalui `postJournal()` |

Jurnal langsung diposting tanpa draft dan tanpa persetujuan (`D-43`).

## Cakupan

### Termasuk

- Jurnal saat pengiriman dikirim (`PD-004`): Dr `hpp`, Cr `persediaan_barang_jadi`, nilai qty × harga rata (`D-44` (3)).
- Jurnal saat faktur terbit (`PD-005`): Dr `piutang_usaha` total, Cr `penjualan` DPP, Cr `ppn_keluaran` PPN.
- Jurnal saat penerimaan terverifikasi (`PD-006`): Dr `kas_bank`, Cr `piutang_usaha`.
- Jurnal saat retur selesai (`PD-007`): kredit memo dan pembalik HPP.
- Jurnal pembalik saat dokumen batal yang sudah berjurnal (`D-35`).
- Pembentukan jurnal melalui `postJournal()` saja.

### Tidak termasuk

- Laporan keuangan dan buku besar (`C-009`).
- Tutup buku dan jurnal penutup (`C-010`).
- Jurnal penggajian dan produksi (siklus lain).
- Pembentukan COA dan nomor akun (`FND-006`).
- Akun kas tunai (`[USULAN-AGEN]`, tidak ada di `D-41`).

## States

Jurnal tidak punya status pengguna dan langsung diposting (`D-43`). Jurnal yang sudah terbentuk tidak diubah atau dihapus. Koreksi lewat jurnal pembalik.

## Pemetaan kejadian ke jurnal

| Kejadian | Jenis transaksi asal | Pemicu | Baris (peran) |
|---|---|---|---|
| Pengiriman `DIKIRIM` | `pengiriman` | kirim | Dr `hpp` = Σ nilai keluar; Cr `persediaan_barang_jadi` = Σ nilai keluar |
| Faktur `DITERBITKAN` | `faktur` | terbit | Dr `piutang_usaha` = total; Cr `penjualan` = DPP; Cr `ppn_keluaran` = PPN |
| Penerimaan `TERVERIFIKASI` | `penerimaan` | verifikasi | Dr `kas_bank` = nominal; Cr `piutang_usaha` = nominal |
| Retur `SELESAI` | `retur` | qc_lulus | Dr `penjualan` = DPP retur; Dr `ppn_keluaran` = PPN retur; Cr `piutang_usaha` = total retur |
| Retur `SELESAI` (HPP) | `retur` | qc_lulus | Dr `persediaan_barang_jadi` = nilai masuk; Cr `hpp` = nilai masuk |
| Pembatalan dokumen berjurnal | sama dengan asal | batal | seluruh baris jurnal asal dengan arah dibalik |

Setiap baris jurnal memakai peran akun; nomor akun diisi oleh konfigurasi `FND-006`.

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Jurnal tidak balance | "Jurnal tidak seimbang. Transaksi dibatalkan." |
| Peran akun tidak ditemukan atau tidak aktif | "Akun {peran} tidak tersedia untuk jurnal penjualan." |
| Periode terkunci | "Periode {bulan} sudah ditutup. Transaksi tidak dapat diposting." |
| Harga rata belum tersedia | "Harga rata belum tersedia untuk produk ini." |
| Jurnal tanpa sumber | "Jurnal harus memiliki dokumen sumber." |

## Batasan

- Modul tidak menulis jurnal langsung (`D-07`, `ARCH-03`); hanya memanggil `postJournal()`.
- Modul tidak membaca tabel modul lain (`D-25`); nilai stok dibaca lewat service core inventory.
- Header dan baris jurnal ditulis dalam satu transaksi (`D-43`).

## Dependensi

- `PD-004`, `PD-005`, `PD-006`, `PD-007` — kejadian sumber.
- `FND-006` — ledger.
- `FND-005` — harga rata, transitif lewat `PD-004` dan `PD-007` (`[USULAN-AGEN]` `PQ-07`).

## Yang membuka jalan

- `INT-001` — jurnal gabungan lintas siklus.

## Catatan serah terima

Peran akun (`D-35`) dan waktu pengakuan (`D-44`) sudah dikunci. Nomor PPN keluaran dan kas tunai menunggu keputusan di `FND-006` (kas tunai tidak dipakai). Pasangan jurnal di `analisis-sia.md` §6.7 menjadi rujukan saja.
