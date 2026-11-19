# EPIC-CORE — Core Bersama

**Status:** `active`
**Track:** CORE-A laporan · CORE-B tutup buku · CORE-C master & notifikasi · CORE-D pengadaan
**Milestone:** M1–M2

## Outcome

Fitur yang dipakai lebih dari satu siklus tersedia sebagai satu implementasi, bukan empat salinan.

## Cakupan

| ID | Outcome | Track | Level | Catatan |
|---|---|---|---|---|
| `C-009` | Laporan keuangan: buku besar, neraca saldo, laba rugi, neraca | CORE-A | 1 | bisa mulai setelah `FND-006` |
| `C-010` | Tutup buku & jurnal penutup | CORE-B | 2 | butuh `C-009` |
| `C-011` | Master data terpadu: produk, gudang, satuan | CORE-C | 1 | melengkapi `FND-002`; `akun` milik `FND-006` |
| `C-012` | Notifikasi in-app + email | CORE-C | 1 | butuh `FND-004` |
| `C-013` | Domain pengadaan: tabel + aturan status | CORE-D | 1 | **memblokir `PG-002` dan `PR-003`** |

## Kenapa `C-013` ada di sini

`D-05` menetapkan pengadaan sebagai domain core: tabel dan aturannya dipakai dua siklus.

Kalau diletakkan di modul Pengeluaran, Produksi ikut menunggu siklus Pengeluaran selesai. Itu dependensi buatan yang memperpanjang jalur kritis tanpa alasan.

Yang tetap milik track Pengeluaran: layar permintaan, alur approval, pemilihan pemasok, dan seluruh UI PO.

## Gate selesai

1. `C-009` menghasilkan neraca yang balance dari jurnal empat siklus.
2. `C-010` menolak posting ke periode tertutup.
3. `C-013` dipakai oleh `PG-002` dan `PR-003` tanpa duplikasi logika.
4. `C-011` menjadi satu-satunya sumber daftar produk, gudang, dan satuan.

## Risiko

| Risiko | Mitigasi |
|---|---|
| `C-013` dianggap "nanti saja" karena bukan fondasi | level 1, jadwalkan bersama gelombang pertama |
| `C-009` dibangun setelah semua siklus selesai | mulai setelah `FND-006`, uji dengan jurnal siklus yang sudah ada |
