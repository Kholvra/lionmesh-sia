---
id: C-011
slug: master-data
title: Master data terpadu produk, gudang, dan satuan
epic: EPIC-CORE
milestone: M1–M2
lane: active
sequence: 3
type: feature
req_status: specified
delivery_status: in_progress
priority: P0
size: L
depends_on:
  - FND-002
blocks:
  - PD-003
  - PG-002
  - PR-001
owner_role: tech lead
package: docs/product/items/C-011-master-data
---

# C-011 — Master data terpadu produk, gudang, dan satuan

## Masalah

Produk, gudang, dan satuan dibutuhkan lintas siklus. Tanpa daftar tunggal, setiap modul bisa memakai kode produk atau gudang yang berbeda untuk barang yang sama, dan saldo stok tidak bisa dibandingkan.

## Outcome

Pengguna yang berwenang dapat mengelola daftar berikut, dan setiap modul memakai daftar yang sama (cakupan D-38):

- **Produk**: kode, nama, tipe, dan satuan dasar.
- **Gudang**: kode dan nama.
- **Satuan**: kode dan nama, dengan konversi antar satuan (D-38; bentuk tabel di spec).
- **Kategori produk**: pengelompokan produk (D-38).
- **Mata uang dan kurs** (master saja): daftar mata uang dan kurs. Transaksi tetap IDR (D-38).

Setiap entri punya kode unik. Entri yang tidak dipakai lagi dinonaktifkan, bukan dihapus (`D-50`). Entri nonaktif tidak bisa dipilih untuk dokumen baru, tetapi dokumen lama tetap terbaca. Entri nonaktif dapat diaktifkan kembali oleh pengelolanya (`[USULAN-AGEN]`).

Tipe produk: bahan, barang dalam proses, dan barang jadi (`D-41`). Tabel dasar produk, gudang, dan satuan dibuat di `FND-002` (`[USULAN-AGEN]`, PT-08); `C-011` menambah aturan, konversi, kategori, mata uang, kurs, dan UI di atasnya.

## Aktor

| Aktor | Peran |
|---|---|
| Pengelola master | menambah, mengubah, dan menonaktifkan entri. `[USULAN-AGEN]` (PT-06): produk, kategori produk, dan satuan oleh Produksi (produk: `D-33`); gudang oleh Gudang; mata uang dan kurs oleh Accounting. Baris matriks-izin belum ada untuk gudang, satuan, kategori, mata uang, dan kurs (koordinasi) |
| Pemakai master | memilih produk, gudang, dan satuan saat membuat dokumen di modul |
| Sistem (core) | menolak kode ganda dan menolak pemilihan entri nonaktif |

## Cakupan

### Termasuk

- Daftar produk, gudang, satuan, kategori produk, konversi satuan, dan mata uang dengan kurs (master), beserta status aktif dan nonaktif.
- Penolakan kode ganda dan entri tanpa satuan dasar.
- Layar pengelolaan master (lihat PT-06 untuk siapa yang boleh).

### Tidak termasuk

- COA: milik `FND-006`. `C-011` membacanya.
- Transaksi dalam mata uang asing: tetap IDR (D-38).
- Transfer antar gudang dan saldo stok: milik `FND-005`.
- BOM dan toleransi produksi: milik `PR-001`.

## Status dan transisi

| Entitas | Status | Dari | Ke | Pemicu |
|---|---|---|---|---|
| Produk, gudang, satuan | `aktif` | (dibuat) | `aktif` | tambah entri |
| Produk, gudang, satuan | `aktif` | `aktif` | `nonaktif` | nonaktifkan (PT-07, `D-50`; tidak dihapus) |
| Produk, gudang, satuan | `nonaktif` | `nonaktif` | `aktif` | aktifkan kembali `[USULAN-AGEN]` (PT-07) |

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Kode produk, gudang, atau satuan sudah dipakai | ditolak; pesan menyebut kode yang sama |
| Produk tanpa satuan dasar | ditolak; pesan menyebut field yang kurang |
| Pemilihan entri nonaktif di dokumen baru | ditolak; pesan menyatakan entri nonaktif |
| Pengguna tanpa hak mengubah master | ditolak; pesan bisa dibaca (PT-06, `[USULAN-AGEN]`) |

Teks final ditentukan implementasi.

## Batasan

- Master hanya boleh diubah lewat core (`D-04`, `D-25`).
- Kode tidak berubah setelah dipakai dokumen (`[USULAN]`).
- Tidak ada penghapusan fisik entri yang sudah dipakai (`[USULAN]`, sejalan analisis §8.2 #9).

## Dependensi

- `FND-002` harus `done`: skema domain inti, termasuk tabel dasar produk, gudang, dan satuan (`[USULAN-AGEN]`, PT-08).
- Tidak ada dependensi tersembunyi ke `FND-005` (PT-09, `[USULAN-AGEN]`).

## Yang membuka jalan

- `PR-001`: BOM dan toleransi produksi memakai produk dari `C-011`.
- `FND-005` dan modul pemakai master (secara tidak langsung, lihat PT-09).

## Catatan serah terima

Tabel dasar produk, gudang, dan satuan dibuat `FND-002` (PT-08, `[USULAN-AGEN]`). Paket `FND-002` belum memuatnya; usulan koordinasi. Catatan: Makalah_Siklus_Produksi.txt mencantumkan kolom `stok` pada tabel produk dan barang; D-06 melarang kolom itu, dan D-06 yang berlaku.

Nomor urut `sequence: 3` mengikuti urutan baris Core di `backlog.md`, bukan urutan pengiriman. Lihat catatan di `C-009`.
