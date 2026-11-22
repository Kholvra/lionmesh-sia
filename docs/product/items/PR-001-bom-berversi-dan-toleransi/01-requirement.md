---
id: PR-001
slug: bom-berversi-dan-toleransi
title: BOM berversi dan toleransi
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
  - C-011
  - FND-002
blocks:
  - PR-002
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-001-bom-berversi-dan-toleransi
---

# PR-001 — BOM berversi dan toleransi

## Masalah

Produksi belum punya tempat resmi untuk mencatat bahan apa, dan berapa banyak, yang dibutuhkan untuk satu unit produk. Resep yang diubah juga tidak bisa ditelusuri: tidak ada cara membuktikan resep mana yang dipakai oleh perintah produksi tertentu.

Akibatnya, kebutuhan bahan (`PR-003`) dan HPP (`PR-006`) tidak punya dasar angka.

## Outcome

Pengguna Produksi dapat mencatat BOM satu level untuk setiap produk aktif di master produk, membuat versi baru dengan tanggal berlaku, dan menetapkan toleransi scrap dan reject untuk versi tersebut. Versi yang sudah ada tetap bisa dibuka dan isinya tidak berubah.

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Produksi | membuat versi BOM, mengisi komponen dan toleransi | `D-33`: "Kelola data produk" = Produksi |
| Gudang, Purchasing, Manajemen, Accounting | melihat BOM dan versinya (baca saja) | `[USULAN-AGEN]`, lihat `00-discussion.md` Q-07 |
| Tech lead | pemilik skema dan migrasi | `D-09` |
| Item pemanggil (`PR-002`, `PR-003`, `PR-006`) | membaca versi lewat service core | `D-25` |

Tidak ada persetujuan sebelum versi berlaku (`[USULAN-AGEN]`, Q-07). Aktor yang tidak berperan Produksi ditolak saat mencoba menulis.

## Cakupan

### Termasuk

- Daftar komponen per produk (satu level, hanya tipe `bahan`).
- Versi BOM dengan nomor versi dan `berlaku_dari`.
- `toleransi_scrap` dan `toleransi_reject` per versi (`D-11`, `D-13`, `D-51`(e)).
- Daftar versi dan detail versi di UI.
- DDL migrasi yang diusulkan, bernomor oleh tech lead (`D-09`).

### Di luar cakupan

- Master produk: nama, tipe, satuan, gudang, kategori. Itu milik `C-011`.
- BOM bertingkat (`D-11`).
- Perhitungan kebutuhan bahan dan pengajuan permintaan (`PR-003`).
- Pemakaian aktual bahan (`PR-004`), hasil produksi (`PR-005`), HPP dan biaya (`PR-006`).
- Impor BOM dari sistem lain. Tidak ada sumber yang menyebutnya.

## Constraints & invariants

- Satu level, berversi, dengan kedua toleransi per versi (`D-11`, `D-13`).
- BOM tidak memuat kolom stok, harga, atau harga rata (`D-06`, `D-10`).
- Versi yang sudah disimpan tidak diedit. Perubahan resep dibuat sebagai versi baru (`EPIC-PR` gate 4).
- Master produk dibaca lewat service `C-011`, bukan lewat tabel milik modul lain (`D-25`, `D-04`).
- `produk_komponen` dimiliki `core/`; modul Produksi memiliki layar dan aturan BOM (`D-31`).
- Migrasi yang sudah di-merge tidak diubah (`D-09`).

## Status versi

Versi BOM bukan dokumen transaksi, jadi tidak masuk `riwayat_status` (`D-08`). Statusnya diturunkan dari tanggal (`[USULAN-AGEN]`, `00-discussion.md` Q-02 dan Q-06):

| Status | Arti | Transisi |
|---|---|---|
| `TERJADWAL` | `berlaku_dari` lebih besar dari hari ini | menjadi `BERLAKU` saat `berlaku_dari` tercapai, otomatis |
| `BERLAKU` | versi dengan `berlaku_dari` terbesar yang tidak melewati hari ini | menjadi `DIGANTIKAN` saat versi lain yang lebih baru berlaku |
| `DIGANTIKAN` | ada versi lebih baru yang sudah berlaku | terminal |

Setelah disimpan, versi tidak bisa diedit. Koreksi dibuat sebagai versi baru dengan `berlaku_dari` yang tidak lebih kecil dari versi terakhir. Bila tanggal yang sama sudah dipakai, versi baru ditolak.

## Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| Qty komponen nol atau negatif | "Jumlah komponen harus lebih dari nol." | form menolak; tidak ada baris tersimpan |
| Produk tidak ada atau nonaktif di master | "Produk \"{kode}\" tidak ditemukan di master produk atau sudah nonaktif." | form menolak |
| Komponen sama dua kali dalam satu versi | "Komponen \"{nama}\" sudah ada di versi ini." | form menolak |
| Versi tanpa komponen | "Versi BOM harus memuat minimal satu komponen." | form menolak |
| Komponen bukan bahan baku | "\"{nama}\" bukan bahan baku; hanya bahan yang bisa menjadi komponen BOM." | form menolak |
| Toleransi di luar 0 sampai kurang dari 100 persen | "Toleransi {scrap/reject} harus antara 0 dan kurang dari 100 persen." | form menolak |
| `berlaku_dari` lebih kecil dari versi terakhir | "Tanggal berlaku harus sama dengan atau setelah tanggal berlaku versi terakhir ({tanggal})." | form menolak |
| `berlaku_dari` sama dengan versi yang ada | "Sudah ada versi yang berlaku mulai {tanggal}." | form menolak |

## Success

- Produksi bisa membuat BOM dan versinya dari UI tanpa bantuan developer.
- Setelah versi baru disimpan, versi lama tetap sama isinya, toleransinya, dan tanggal berlakunya.
- Layanan `versiBerlakuPada(produk, tanggal)` mengembalikan versi dengan `berlaku_dari` terbesar yang tidak melewati tanggal, atau kosong bila tidak ada.

## Edge cases

- Produk yang punya BOM lalu dinonaktifkan di master: versi tetap terbaca; WO baru tidak bisa memakainya (`D-50`, master nonaktif tidak dipilih untuk dokumen baru).
- Produk tanpa versi: `PR-002` menolak pembuatan WO untuk produk itu.

## Decision references

- `D-06`, `D-09`, `D-10`, `D-11`, `D-13`, `D-25`, `D-31`, `D-33`, `D-38`, `D-50`, `D-51`(e).
- `docs/product/epics/EPIC-PR.md`, gate 4.
- `docs/product/reference/analisis-sia.md` §6.3, §7.2, §14.1. Referensi, bukan normatif.
