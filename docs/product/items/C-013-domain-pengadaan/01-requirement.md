---
id: C-013
slug: domain-pengadaan
title: Domain pengadaan permintaan, PO, dan penerimaan
epic: EPIC-CORE
milestone: M1–M2
lane: active
sequence: 5
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: L
depends_on:
  - FND-002
  - FND-004
  - FND-005
blocks:
  - PG-002
  - PR-003
owner_role: tech lead
package: docs/product/items/C-013-domain-pengadaan
---

# C-013 — Domain pengadaan permintaan, PO, dan penerimaan

## Masalah

Permintaan pembelian dibutuhkan dua siklus: Gudang dan Produksi mengajukan PR, dan Pengeluaran memprosesnya sampai PO dan penerimaan. Jika aturannya ditulis dua kali, akan ada dua jalur pembelian dan dua tabel utang yang tidak nyambung. Produksi juga akan menunggu siklus Pengeluaran selesai hanya untuk bisa mengajukan bahan.

## Outcome

Ada satu domain pembelian di core yang dipanggil oleh dua siklus:

- Permintaan pembelian (PR) dapat diajukan oleh Gudang atau Produksi, dan disimpan di satu tabel.
- PR yang ditolak tidak bisa menjadi PO.
- PO hanya dapat dibuat dari PR yang sudah disetujui.
- Penerimaan barang mencatat qty yang diterima, dan selisihnya tercatat sebagai exception. Penerimaan yang melebihi qty PO ditolak (`D-49`).
- Penerimaan parsial diizinkan sampai total qty sama dengan qty PO (`D-49`, `D-46`).
- Pemohon bisa membatalkan dokumennya sebelum batas yang ditetapkan (PT-13, `[USULAN-AGEN]`).
- Setiap perubahan status tercatat di riwayat.

Pengeluaran tetap memiliki layar dan alur approval. Produksi memanggil `pengadaan.ajukanPR()` dan tidak menulis tabel pengadaan langsung.

## Aktor

| Aktor | Peran |
|---|---|
| Gudang | mengajukan PR; mencatat penerimaan |
| QC | mencatat hasil QC penerimaan (matriks-izin, D-33) |
| Produksi | mengajukan PR bahan lewat service |
| Purchasing | memeriksa PR; membuat PO (matriks-izin, D-33) |
| Manajemen | menyetujui PR (matriks-izin, D-33) |
| Sistem (core pengadaan) | menegakkan aturan status dan mencatat riwayat |

## Cakupan

### Termasuk

- Tabel dan aturan status untuk PR, PO, dan penerimaan di `core/pengadaan`.
- Pemanggilan approval (mesin di `FND-004`, `D-37`) dan nomor dokumen dari `FND-004`.
- Pencatatan hasil QC penerimaan (lulus atau gagal) sebagai status dokumen.
- Pemanggilan stok masuk dari `FND-005` saat QC lulus (`D-36`).
- Pencatatan selisih qty sebagai exception.

### Tidak termasuk

- Layar permintaan, alur approval, pemilihan pemasok, dan seluruh UI PO: milik `PG-002` sampai `PG-005` (track Pengeluaran).
- Layar QC dan alur retur ke pemasok: milik `PG-007`. Tabel dan status QC ada di C-013 (`D-31`).
- Three-way match dan utang usaha: milik `PG-008` dan `PG-009`. Tabel invoice dan utang dibuat di core oleh item itu (`D-31`).
- Ambang approval nominal: milik `FND-004` (`aturan_approval`).

## Status dan transisi

Daftar status mengikuti diagram state machine (`D-46`, catatan `diagram-sia-lengkap.md` §5.2). Nama status terjawab (PT-03). Alur di item ini (pembagian dengan PG-008 dan PG-009 `[USULAN]`):

- PR: `DIAJUKAN` → `MENUNGGU_PERSETUJUAN` (diperiksa Purchasing) → `DISETUJUI` atau `DITOLAK`. Cabang `DIAJUKAN` → `REVISI` → `DIAJUKAN`.
- PR: `DISETUJUI` → `PEMASOK_DITETAPKAN` (pilih pemasok). PO terbit → `DITERBITKAN` → `DITERIMA_SEBAGIAN` atau `DITERIMA` (satu rantai status di diagram §5.2).
- Penerimaan dan QC: `DITERIMA` → `QC_LULUS` atau `QC_GAGAL`. `QC_LULUS` memicu stok masuk (`D-36`).
- Setelah `QC_LULUS` (`COCOK`, `SELISIH`, `TERCATAT`, `DIBAYAR_SEBAGIAN`, `LUNAS`) milik `PG-008` dan `PG-009`.

Yang sudah jelas dari sumber (tabel di bawah) tetap berlaku:

| Dokumen | Dari | Ke | Pemicu | Siapa |
|---|---|---|---|---|
| PR | `MENUNGGU_PERSETUJUAN` | `DISETUJUI` | approval | Manajemen (PT-08) |
| PR | `MENUNGGU_PERSETUJUAN` | `DITOLAK` | approval | Manajemen (PT-08) |
| PR | `DITOLAK` | (tidak bisa jadi PO) | — | aturan core (analisis §8.1) |
| PR | `DIAJUKAN`, `MENUNGGU_PERSETUJUAN`, `REVISI` | `DIBATALKAN` | pembatalan oleh pemohon, alasan wajib (`D-48`) | pemohon; tercatat di `riwayat_status` (PT-13) |
| PR | `DISETUJUI`, `PEMASOK_DITETAPKAN` | `DIBATALKAN` | pembatalan oleh pemohon sebelum PO terbit (`D-48`) | pemohon; tercatat di `riwayat_status` (PT-13) |
| PO | `DITERBITKAN` | `DIBATALKAN` | pembatalan sebelum penerimaan pertama (PT-13) | Purchasing atau pemohon PR; tercatat di riwayat |

Status `DIBATALKAN` tidak ada di diagram §5.2 (ada di §5.1 dan §5.3). `D-47` (d) tidak menambahkannya untuk PR dan PO, tetapi `D-48` mengizinkan pembatalan sebelum posting. Keputusan (PT-13, `[USULAN-AGEN]`): `DIBATALKAN` dipakai untuk PR dan PO, dengan batas di tabel di atas. Penerimaan yang sudah `QC_LULUS` dan berjurnal tidak bisa dibatalkan; koreksinya lewat jurnal pembalik (`D-35`). Pembatalan dokumen yang sudah berjurnal memakai jurnal pembalik (`D-35`).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| PR ditolak dijadikan PO | ditolak; pesan menyebut bahwa PR belum disetujui |
| PO dibuat dari PR yang belum disetujui | ditolak; pesan menyebut status PR saat ini |
| Penerimaan dengan qty lebih besar dari sisa PO | ditolak sebagai exception, tidak ada stok masuk (`D-49`) |
| Penerimaan dengan qty selisih | tercatat sebagai exception; selisih qty tidak pernah lolos toleransi (`D-15`) |
| Pengguna tanpa hak mengubah status | ditolak; pesan bisa dibaca (hak: PT-08, `D-33`, `D-42`) |

Teks final ditentukan implementasi.

## Batasan

- Tabel dan aturan pengadaan hanya ada di core (`D-05`, `ARCH-06`).
- Stok hanya berubah lewat service inventory (`D-06`).
- Setiap transisi status masuk `riwayat_status` (`D-08`).
- Dokumen tidak dihapus (`D-50`, analisis §8.2 #9).
- Toleransi three-way match hanya untuk harga dan total, tidak untuk qty (`D-15`).
- Stok masuk setelah QC lulus, bukan saat penerimaan (`D-36`). Jurnal QC lulus: Dr 120 / Cr 202 senilai qty lolos × harga PO (`D-44` 1, `D-41`).

## Dependensi

- `FND-002` harus `done`: skema domain inti.
- `FND-004` harus `done`: penomoran, status, riwayat, dan approval berjenjang.
- `FND-005` harus `done`: mutasi dan saldo stok untuk penerimaan.

## Yang membuka jalan

- `PG-002`: permintaan pembelian dari Gudang dan Produksi.
- `PR-003`: kebutuhan dan permintaan bahan, yang memanggil `pengadaan.ajukanPR()`.

## Catatan serah terima

Cakupan dipersempit `D-31` (permintaan, PO, penerimaan, QC; invoice dan utang keluar). Tidak dipecah (PT-11, `[USULAN-AGEN]`); pemecahan lewat `decompose` tetap pilihan tech lead.

Nomor urut `sequence: 5` mengikuti urutan baris Core di `backlog.md`. Lihat catatan di `C-009`.
