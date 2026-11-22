---
id: PD-003
slug: cek-reservasi-stok
title: Cek dan reservasi stok untuk pesanan
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
  - C-011
  - FND-005
  - PD-002
blocks:
  - PD-004
owner_role: kelompok Pendapatan, track PD-B (orang belum ditetapkan)
package: docs/product/items/PD-003-cek-reservasi-stok
---

# PD-003 — Cek dan reservasi stok untuk pesanan

## Masalah

Gudang belum bisa melihat berapa stok yang benar-benar bebas untuk dijanjikan kepada pesanan. Dua pesanan bisa mengklaim barang yang sama.

## Outcome

Gudang melihat, untuk setiap baris pesanan `VERIFIED`, qty diminta, qty tersedia, dan qty yang sudah dialokasikan. Gudang dapat mengalokasikan stok ke baris pesanan. Alokasi mengurangi stok yang bisa dijanjikan, tetapi saldo fisik tidak berubah sampai pengiriman. Status pesanan mengikuti hasil alokasi.

## Aktor

| Aktor | Peran |
|---|---|
| Gudang | cek dan alokasi stok; melepas alokasi bila pesanan dibatalkan (`D-33`: "Cek & alokasi stok") |
| Penjualan | melihat hasil cek stok di pesanan; tidak mengalokasikan |
| Sistem | mengubah status pesanan dari hasil alokasi (`MENUNGGU_STOK` / `SIAP_KIRIM`) |

## Cakupan

### Termasuk

- Tampilan diminta, tersedia, dan teralokasi untuk setiap baris pesanan.
- Alokasi stok ke baris pesanan, sebagian atau seluruhnya, per gudang.
- Alokasi manual saat stok masuk kemudian (tidak otomatis).
- Pelepasan alokasi saat pesanan dibatalkan (`PD-002`) atau saat pengiriman dikonfirmasi (`PD-004`), sebesar qty yang dilepas.
- Status pesanan `MENUNGGU_STOK` atau `SIAP_KIRIM` dari hasil alokasi.

### Tidak termasuk

- Mutasi stok keluar saat pengiriman (`PD-004`).
- Penerimaan barang dan QC bahan (siklus Pengeluaran).
- Stock opname (`C4`, core).
- Transfer antar gudang (`D-52`, dikerjakan paling akhir di `FND-005`).

## States

Status alokasi (per baris pesanan per gudang), bukan status pesanan:

| Dari | Ke | Oleh | Syarat |
|---|---|---|---|
| (belum ada) | `teralokasi` | Gudang | qty ≤ tersedia; qty ≤ sisa qty baris; pesanan `VERIFIED` atau `MENUNGGU_STOK` |
| `teralokasi` | `dilepas` (sebagian atau penuh) | sistem | pembatalan pesanan (`PD-002`) atau konfirmasi pengiriman (`PD-004`) |

Status pesanan dari hasil alokasi (`D-46`):

| Dari | Ke | Syarat | Riwayat |
|---|---|---|---|
| `VERIFIED` | `MENUNGGU_STOK` | cek alokasi: ada baris yang belum teralokasi penuh | 1 baris |
| `VERIFIED` | `SIAP_KIRIM` | cek alokasi: seluruh baris teralokasi penuh | 1 baris |
| `MENUNGGU_STOK` | `SIAP_KIRIM` | alokasi tambahan membuat seluruh baris teralokasi penuh | 1 baris |

Setiap perubahan status pesanan menulis `riwayat_status` dengan aktor (Gudang atau sistem) dan waktu (`D-08`).

## Aturan alokasi

- Alokasi hanya boleh dibuat dari saldo yang tersedia: tersedia = saldo qty − Σ alokasi aktif untuk produk dan gudang yang sama.
- Alokasi per baris tidak melebihi qty baris pesanan dikurangi alokasi aktif dan pengiriman yang sudah dikonfirmasi untuk baris itu.
- Alokasi parsial diizinkan; stok masuk kemudian tidak mengalokasikan otomatis (`[USULAN-AGEN]` `PQ-03`).
- Bila dua alokasi bersaing untuk stok yang sama, alokasi yang lebih dulu tersimpan mendapat stok; alokasi berikutnya dipotong sampai sisa tersedia (`[USULAN-AGEN]` `PQ-04`).
- Alokasi tidak membuat `mutasi_stok` dan tidak mengubah `saldo_stok`.

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Alokasi melebihi tersedia | "Stok tersedia hanya {n}. Alokasi tidak boleh melebihi stok tersedia." |
| Alokasi melebihi qty baris | "Alokasi melebihi jumlah yang dipesan." |
| Qty alokasi nol atau negatif | "Jumlah alokasi harus lebih dari nol." |
| Produk tidak ada di gudang | "Produk tidak tersedia di gudang ini." |
| Pesanan belum terverifikasi | "Pesanan belum terverifikasi. Stok tidak dapat dialokasikan." |
| Pesanan dibatalkan | "Pesanan dibatalkan. Stok tidak dapat dialokasikan." |
| Gudang belum dipilih saat ada lebih dari satu gudang | "Pilih gudang untuk alokasi." |
| Alokasi bersamaan kehabisan stok | "Stok tersedia berubah. Muat ulang dan coba lagi." |

## Batasan

- Stok tidak boleh negatif setelah alokasi (`[USULAN]`, `analisis-sia.md` §7.5).
- Alokasi tidak boleh melewati tanggal mutasi terakhir (`ARCH-001` `PRE-03`).
- Modul tidak membaca tabel modul lain (`D-25`); saldo dan alokasi dibaca dan ditulis lewat service `core/inventory`.
- Alokasi tidak membentuk jurnal (`D-07`).

## Dependensi

- `FND-005` — inventory, mutasi, saldo.
- `C-011` — master produk dan gudang.
- `PD-002` — pesanan terverifikasi.
- Gate fondasi `FND-001`–`FND-006` dan `FND-007`.

## Yang membuka jalan

- `PD-004` — pengiriman memakai alokasi.

## Catatan serah terima

Tabel `alokasi_stok` dimiliki `core/inventory` (`D-31`); DDL dibuat item ini dan dinomori tech lead (`D-09`). Alokasi dilepas sebagian oleh `PD-004` sesuai qty kirim.
