# C-011 — Diskusi

## Konteks

`C-011` adalah **master data terpadu**: produk, gudang, dan satuan (`backlog.md`, track `CORE-C master`, level 1, `depends on` `FND-002`). Di analisis, `C11` lebih luas: COA, satuan + konversi, kategori produk, gudang, mata uang + kurs (§5.1, P0). Backlog sudah mempersempit cakupannya. Changelog 2026-11-19 mencatat COA pindah ke `FND-006`. D-38 (2026-11-22) mengembalikan kategori produk, konversi satuan, dan mata uang + kurs (master saja) ke C-011.

Item ini memblokir `PR-001` (BOM berversi dan toleransi, `PR-A master`). Backlog menyebut `PR-001` "tidak membuat tabel produk sendiri. Master produk ada di `C-011`". Di `EPIC-CORE`, gate selesai nomor 4 berbunyi: `C-011` menjadi satu-satunya sumber daftar produk, gudang, dan satuan.

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `C-011`) dan `epics/EPIC-CORE.md`.

## Context

- Analisis §7.2 menyebut `produk` "satu tabel, dibedakan `tipe`" (bahan, WIP, barang jadi).
- Analisis §7.2 juga menyebut `satuan`, `konversi_satuan`, `mata_uang`, dan `kurs` sebagai "tidak ada di sumber" (usulan).
- Analisis §9.2 G18 mengusulkan multi-satuan dan tabel konversi (`[USULAN]`).
- Analisis §5.6 mencatat multi-gudang dan multi-mata uang sebagai "masuk" tanpa pemilik item di backlog.

## Actor / consumer

- Pengelola master: peran per jenis master (lihat PT-06, `[USULAN-AGEN]`).
- Pemakai master: `FND-005` (inventory), `PR-001` (BOM), dan modul pemanggil lain lewat core.

## Problem

Produk, gudang, dan satuan akan dipakai banyak modul. Jika setiap modul punya daftarnya sendiri, kode produk bisa berbeda antar siklus dan saldo stok tidak bisa dipercaya (analisis §2.4, "tiga saldo berbeda untuk barang yang sama").

## Desired outcome

Ada satu daftar produk, gudang, dan satuan yang dipakai semua modul. Pengguna berwenang dapat menambah dan menonaktifkan entri, dengan kode yang unik.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-04` | Master ada di `src/core/`. Modul boleh mengimpor core, tidak sebaliknya. |
| `D-25`, `ARCH-08` | Modul tidak membaca tabel master dari modul lain. Akses lewat service core. |
| `D-31` | Tabel domain bersama dimiliki core; DDL dibuat item pertama yang membutuhkannya (dinomori tech lead, `D-09`). |
| `D-38` | Kategori produk, konversi satuan, mata uang + kurs (master saja) masuk C-011. Transaksi tetap IDR. |
| `D-41` | Persediaan dibedakan per tipe: 120 bahan, 121 barang dalam proses, 122 barang jadi. Tipe produk mengikuti ini. |
| `D-50` | Master dinonaktifkan, bukan dihapus. Master nonaktif tidak bisa dipilih untuk dokumen baru. Kode unik. |
| `D-52` | Struktur multi-gudang disiapkan sejak awal; seed memakai satu gudang. Transfer antar gudang di `FND-005`. |
| `FND-002` (backlog) | Skema domain inti dimiliki `FND-002`. Batas tabel produk, gudang, dan satuan dengan `C-011`: lihat PT-08. |
| `FND-006` (backlog) | COA dimiliki `FND-006`. `C-011` hanya membacanya. |
| `D-06` | Tidak ada kolom `stok` di tabel produk. |
| `D-18`, `D-53` | Pengelola dan pembaca master adalah peran staf. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 11 pertanyaan — 11 terjawab (8 dari keputusan terkunci, 3 `[USULAN-AGEN]`: PT-06, PT-08, PT-09; PT-07 juga memuat satu `[USULAN-AGEN]` untuk aktivasi kembali), 0 terbuka.

- PT-01 — Kategori produk: masuk `C-011` atau tidak? Owner: pengguna. **Status: Terjawab — D-38.** Kategori produk masuk C-011.
- PT-02 — Mata uang dan kurs: milik item mana? Owner: pengguna. **Status: Terjawab — D-38.** Mata uang dan kurs masuk C-011 sebagai master saja; transaksi tetap IDR.
- PT-03 — Konversi satuan: masuk `C-011` atau tidak? Owner: pengguna. **Status: Terjawab — D-38.** Konversi satuan masuk C-011. Bentuk tabel konversi detail di spec.
- PT-04 — Tipe produk: apakah pembedaan bahan, WIP, dan barang jadi dikelola di `C-011`? Owner: pengguna. **Status: Terjawab — D-41.** Tiga nilai tipe: bahan (120), barang dalam proses (121), barang jadi (122). Tipe ini mengikuti akun persediaan per tipe.
- PT-05 — Gudang: apakah aturan transfer antar gudang masuk `C-011`? Owner: tech lead. **Status: Terjawab — D-52.** Transfer antar gudang tetap dalam cakupan penuh dan dikerjakan paling akhir di `FND-005`. Bukan bagian `C-011`.
- PT-06 — Izin: siapa yang boleh membuat dan mengubah master? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: produk, kategori produk, dan satuan dikelola Produksi (produk sudah di `D-33`); gudang dikelola Gudang; mata uang dan kurs dikelola Accounting. Alasan: setiap master dikelola peran yang paling dekat dengan pemakainya, dan dokumen transaksi tidak dibuat oleh pengelola master yang sama. Baris ini belum ada di `matriks-izin.md` (koordinasi).
- PT-07 — Nonaktifkan atau hapus: apakah master yang sudah dipakai dokumen boleh dinonaktifkan? Owner: pengguna. **Status: Terjawab — D-50.** Master dinonaktifkan, bukan dihapus. Dokumen lama tetap terbaca. Aktivasi kembali oleh pengelola yang sama (`[USULAN-AGEN]`, lihat `01`).
- PT-08 — Batas dengan `FND-002`: apakah tabel produk, gudang, dan satuan dibuat di `FND-002`, lalu `C-011` menambah aturan dan UI? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: tabel dasar produk, gudang, dan satuan dibuat di `FND-002` (`D-31`, item pertama yang membutuhkannya). `C-011` menambah kolom, aturan, konversi, kategori, mata uang, dan UI. Paket `FND-002` belum memuat tabel ini (usulan koordinasi).
- PT-09 — Urutan: `FND-005` hanya `depends on` `FND-002`. Jika `FND-005` butuh produk dan gudang, apakah itu konflik? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Karena tabel dasar ada di `FND-002` (PT-08), `FND-005` tidak menunggu aturan `C-011`. Tidak ada dependensi tersembunyi.
- PT-10 — Konflik urutan dengan `D-20` (C9–C12 "menyusul"). Owner: pengguna dengan tech lead. **Status: Terjawab — D-34.** C-011 masuk gelombang 1.
- PT-11 — Prioritas dan ukuran. Owner: pengguna dan tech lead. **Status: Terjawab — D-50.** Prioritas P0 mengikuti analisis C11. Ukuran L (usulan revisi paket, lihat `03`).

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-04` | `src/core/` dan `src/modules/` | 2026-11-17 | pengguna | Master di core |
| `D-25` | modul tidak membaca tabel modul lain | 2026-11-17 | pengguna | Pemakaian lewat service core |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk C-011 |
|---|---|---|
| `D-06` | Tidak ada kolom `stok` di tabel produk | makalah memuat kolom `stok`; keputusan ini berlaku |
| `D-31` | Tabel domain bersama milik core; DDL oleh item pertama | PT-08, PT-09 |
| `D-33` | Matriks izin v0 | PT-06 |
| `D-34` | C-011 gelombang 1 | PT-10 |
| `D-38` | Kategori, konversi, dan mata uang + kurs (master) masuk C-011 | PT-01, PT-02, PT-03 |
| `D-41` | Akun persediaan per tipe (120, 121, 122); tipe produk | PT-04 |
| `D-50` | Dinonaktifkan, bukan dihapus; prioritas P0 | PT-07, PT-11 |
| `D-52` | Transfer gudang di FND-005; multi-gudang disiapkan | PT-05 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-06: pembagian pengelola master (produk, kategori, satuan: Produksi; gudang: Gudang; mata uang dan kurs: Accounting).
- PT-07 (aktivasi kembali): entri nonaktif bisa diaktifkan lagi oleh pengelolanya.
- PT-08: tabel dasar produk, gudang, dan satuan di `FND-002`.
- PT-09: `FND-005` tidak menunggu aturan `C-011`.
- `[USULAN]` Kode produk, gudang, dan satuan unik per jenis.
- `[USULAN]` Entri yang sudah dipakai dokumen dinonaktifkan, tidak dihapus (sejalan dengan analisis §8.2 #9 untuk dokumen dan `D-50`).

## Rejected alternatives (optional)

- Kolom `stok` di tabel `produk`. Ditolak: analisis §7.1 poin 1 dan `D-06`.
- Setiap modul punya tabel produk sendiri. Ditolak: `D-25` dan analisis §4 aturan 4.

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `FND-002` berstatus `done`, lalu siap menjadi `Ready` (lihat `03`). Usulan koordinasi: tabel dasar produk, gudang, dan satuan masuk paket `FND-002`; baris matriks-izin untuk gudang, satuan, kategori, mata uang, dan kurs ditambahkan.
