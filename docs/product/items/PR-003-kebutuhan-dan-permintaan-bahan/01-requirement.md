---
id: PR-003
slug: kebutuhan-dan-permintaan-bahan
title: Kebutuhan dan permintaan bahan
epic: EPIC-PR
milestone: M1
lane: active
sequence: unset # topologi hybrid (backlog.md), bukan urutan strict
type: feature
req_status: specified
delivery_status: not_started
priority: P0 # D-50: mengikuti P0 analisis §5.4
size: M # D-50: usulan paket, belum disahkan koordinator
depends_on:
  - C-013
  - PR-002
blocks:
  - PR-004
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-003-kebutuhan-dan-permintaan-bahan
---

# PR-003 — Kebutuhan dan permintaan bahan

## Masalah

Setelah perintah produksi dibuat, Produksi tidak tahu bahan apa yang dibutuhkan, berapa jumlahnya, dan apakah stok cukup. Kekurangan baru terlihat ketika produksi sudah berhenti.

## Outcome

Untuk satu perintah produksi, sistem menghitung kebutuhan bahan dari versi BOM yang dipilih, membandingkannya dengan stok yang tersedia di gudang sumber, menandai WO sebagai `BAHAN_KURANG` bila kurang, dan membuat permintaan bahan ke pengadaan untuk selisihnya. Permintaan yang ditolak membawa WO ke `DIBATALKAN` dan tidak bisa menjadi pembelian.

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Produksi | mengajukan permintaan bahan | `D-33` |
| Gudang | menjalankan cek ketersediaan | `D-33` |
| Purchasing | memeriksa permintaan (`MENUNGGU_PERSETUJUAN`) | `D-33`, `D-46` §5.2 |
| Manajemen | menyetujui permintaan (`DISETUJUI`) | `D-33`, `D-46` §5.2, `D-51`(c) |
| Sistem | menghitung kebutuhan; membuat permintaan lewat `core/pengadaan` | `D-05` |

Pemisahan tugas: pemohon tidak menyetujui permintaannya sendiri (`D-42`, `D-48`). Alur approval berjalan lewat mesin `FND-004` (`D-37`).

## Cakupan

### Termasuk

- Menghitung kebutuhan per komponen dari versi BOM WO (rumus di bagian Perhitungan).
- Memeriksa ketersediaan stok secara baca saja.
- Menandai WO `BAHAN_KURANG` atau `BAHAN_CUKUP` sesuai hasil cek.
- Membuat permintaan bahan untuk selisih lewat `pengadaan.ajukanPR()` dengan `wo_id` (`D-05`).
- Menampilkan status permintaan di detail WO.

### Di luar cakupan

- Layar dan alur approval pengadaan. Milik track PG-B dan `PG-003`, dengan layar di modul Pengeluaran (`D-05`, `D-37`).
- Purchase order, pemilihan pemasok (`PG-004`, `PG-005`).
- Mutasi stok bahan keluar (`PR-004`).
- Tabel permintaan atau PO di modul Produksi (`ARCH-06`).

## Perhitungan

Dasar (`[USULAN-AGEN]`, `00-discussion.md` Q-02 dan Q-03):

- Kebutuhan komponen = qty WO × `qty_per_unit` × (1 + `toleransi_scrap`), dibulatkan ke atas pada presisi satuan `C-011`.
- Tersedia = `saldo_stok.qty` di gudang sumber − kebutuhan WO lain yang berstatus `BAHAN_CUKUP` atau `BAHAN_SIAP` dan belum dikeluarkan.
- Selisih = max(0, kebutuhan − tersedia). Permintaan dibuat untuk selisih komponen yang lebih dari nol.

Nilai toleransi mengikuti mekanisme berversi `D-51`; nilainya diverifikasi saat implementasi.

## Constraints & invariants

- Permintaan bahan dibuat lewat `pengadaan.ajukanPR()` di `core/pengadaan` (`D-05`, `ARCH-06`).
- Item ini tidak mengubah stok (`D-06`).
- Stok dibaca lewat service core inventory (`D-25`).
- PR yang ditolak tidak bisa menjadi PO (`analisis-sia.md` §8.1).
- Satu permintaan aktif per WO (`[USULAN-AGEN]`; `makalah` kamus `permintaan_bahan` merujuk satu WO).

## Status dan transisi

Status permintaan mengikuti `D-46` §5.2 dan dimiliki `core/pengadaan` (`C-013`); item ini hanya membaca dan memicu. Status WO mengikuti `D-46` §5.3.

| Kejadian | Akibat pada WO |
|---|---|
| Cek ketersediaan: stok cukup untuk semua komponen | `CEK_BAHAN` → `BAHAN_CUKUP` |
| Cek ketersediaan: ada komponen kurang | `CEK_BAHAN` → `BAHAN_KURANG` |
| Permintaan `DISETUJUI` (Manajemen) | `BAHAN_KURANG` → `MENUNGGU_PEMBELIAN` |
| Permintaan `DITOLAK` | `BAHAN_KURANG` → `DIBATALKAN` |
| Permintaan `DIAJUKAN` dikembalikan Purchasing (`REVISI`) | WO tetap `BAHAN_KURANG`; pengaju mengajukan ulang |

Alur permintaan (`D-46` §5.2): `DIAJUKAN` → `MENUNGGU_PERSETUJUAN` (diperiksa Purchasing) → `DISETUJUI` (disetujui Manajemen) atau `DITOLAK`; `DIAJUKAN` ↔ `REVISI`. Pembatalan permintaan oleh pengaju tidak ada (`D-47` (d)).

### Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| WO tidak berstatus `BAHAN_KURANG` saat membuat permintaan | "Permintaan bahan hanya bisa dibuat saat perintah berstatus BAHAN_KURANG (sekarang: {status})." | tolak |
| Cek bahan saat WO tidak `DIRENCANAKAN` | "Cek ketersediaan hanya bisa dijalankan saat perintah berstatus DIRENCANAKAN." | tolak |
| Kebutuhan nol untuk semua komponen | "Perintah ini tidak membutuhkan bahan baru; permintaan tidak dibuat." | tolak |
| Produk tanpa versi BOM berlaku | "Produk \"{nama}\" belum punya versi BOM yang berlaku." | tolak |
| WO sudah punya permintaan aktif | "Perintah ini sudah punya permintaan bahan yang masih aktif (nomor {no})." | tolak |
| Data stok tidak terbaca | "Data stok belum bisa dibaca. Coba lagi." | tidak membuat permintaan |

## Success

- Produksi bisa membuat permintaan bahan dari detail WO dan melihat statusnya.
- Kebutuhan yang tampil bisa dicocokkan dengan rumus dan BOM dengan hasil sama setiap kali.

## Edge cases

- Stok cukup sebagian: WO `BAHAN_KURANG`; permintaan untuk selisih saja (`[USULAN-AGEN]`).
- Dua gudang: cek dilakukan pada gudang sumber WO (`D-52`).

## Decision references

- `D-05`, `D-06`, `D-11`, `D-25`, `D-31`, `D-33`, `D-37`, `D-42`, `D-46`, `D-47` (d), `D-48`, `D-51` (c), `D-52`.
- `docs/product/backlog.md`: "`PR-003` bergantung pada `C-013`, bukan pada seluruh siklus Pengeluaran".
- `docs/product/reference/analisis-sia.md` §4.1, §6.3, §8.1. Referensi, bukan normatif.
