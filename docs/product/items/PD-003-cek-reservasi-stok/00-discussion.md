# PD-003 — Diskusi

## Konteks

Setelah pesanan diverifikasi, Gudang perlu tahu apakah stok cukup dan mengunci bagian yang dijanjikan. `analisis-sia.md` §6.2 langkah 4 memberi contoh: stok 200, pesanan 500, alokasi 200 dikunci, status `MENUNGGU_STOK`. Item ini adalah track PD-B, level 1 (dependensi `FND-005`, `C-011`, `PD-002`).

## Actor / consumer

Gudang (cek dan alokasi, `D-33`). Penjualan membaca hasilnya di pesanan.

## Problem

Tanpa alokasi, dua pesanan bisa menjanjikan barang yang sama (`analisis-sia.md` §6.2). Tanpa cek ketersediaan, pesanan diterima tanpa tahu bisa dipenuhi atau tidak.

## Desired outcome

Gudang melihat stok tersedia dan teralokasi per baris pesanan, lalu mengalokasikan sebagian atau seluruh kebutuhan pesanan. Alokasi mengurangi "tersedia" tanpa mengubah saldo fisik.

## Known constraints

- `D-06`: qty stok diturunkan dari `mutasi_stok`; nilai di `saldo_stok`. Stok per produk per gudang.
- `D-25`, `D-31`: tabel domain bersama dimiliki `core/`; modul tidak membaca tabel modul lain.
- `ARCH-04`: perubahan stok hanya lewat `core/inventory`.
- `D-46`: `VERIFIED → MENUNGGU_STOK` (stok kurang) atau `SIAP_KIRIM` (stok cukup).
- `D-52`: struktur multi-gudang disiapkan; seed memakai satu gudang; pemilihan gudang tampil hanya bila ada lebih dari satu.
- `EPIC-PD`: stok berkurang saat pengiriman, bukan saat pesanan.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Di mana alokasi disimpan dan siapa pemiliknya? | Terjawab — D-31 (+ D-25, ARCH-04): tabel `alokasi_stok` dimiliki `core/inventory` karena alokasi mengubah "tersedia" yang dibaca Gudang dan Penjualan; DDL dibuat oleh PD-003 sebagai item pertama yang membutuhkannya (D-31). Modul pesanan hanya memanggil service core. |
| `PQ-02` | Alokasi dibuat saat `VERIFIED` atau setelah konfirmasi lanjut? | Terjawab — D-46: cek alokasi dijalankan atas pesanan `VERIFIED` (cek kredit sudah lolos); hasilnya `MENUNGGU_STOK` bila ada baris kurang atau `SIAP_KIRIM` bila semua baris teralokasi. Pesanan `MENUNGGU_PERSETUJUAN_KREDIT` tidak dialokasikan. |
| `PQ-03` | Alokasi parsial dan stok masuk kemudian: otomatis atau manual? | Terjawab — [USULAN-AGEN]: alokasi parsial diizinkan (≤ tersedia dan ≤ qty baris). Stok masuk tidak mengalokasikan otomatis; Gudang mengalokasikan manual saat stok tersedia, dan pesanan pindah ke `SIAP_KIRIM` bila seluruh baris sudah teralokasi. Alasan: makalah UC-PD04 menyatakan Gudang "menjadwalkan pemenuhan berikutnya", bukan otomatis. |
| `PQ-04` | Dua pesanan memperebutkan stok: urutan prioritasnya? | Terjawab — [USULAN-AGEN]: urutan waktu alokasi (first-come); tidak ada prioritas manual. Alokasi yang melebihi tersedia dipotong sampai sisa tersedia, bukan ditolak total, dan pemotongan ditampilkan kepada Gudang. Alasan: makalah dan keputusan tidak mengatur prioritas. |
| `PQ-05` | Stok per gudang atau total? | Terjawab — D-52 dan D-06: saldo dan alokasi per produk per gudang; seed memakai satu gudang sehingga pemilihan gudang tidak tampil. Transfer antar gudang tidak termasuk item ini (`D-52`). |
| `PQ-06` | Apakah `C-011` harus ada di `depends on`? | Terjawab — `backlog.md` sudah memuat `C-011` dan `PD-002` sebagai dependensi. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-06` | qty dari mutasi, nilai dari saldo | decisions.md | alokasi tidak menyentuh mutasi |
| `D-25`, `D-31` | tabel bersama di core | decisions.md | `alokasi_stok` di `core/inventory` |
| `D-46` | `VERIFIED → MENUNGGU_STOK / SIAP_KIRIM` | decisions.md | status pesanan dari hasil alokasi |
| `D-52` | multi-gudang disiapkan, seed satu gudang | decisions.md | dimensi gudang di alokasi |

## Assumptions (agent-proposed)

- `[USULAN]` Alokasi tidak membuat baris `mutasi_stok`; alokasi hanya mengurangi "tersedia" (`analisis-sia.md` §6.2, §9.2 G9).
- `[USULAN]` Stok tidak boleh negatif; alokasi tidak boleh melebihi saldo (`analisis-sia.md` §7.5).

## Rejected alternatives

- Mengunci stok dengan mutasi keluar saat pesanan dibuat: ditolak. Stok fisik keluar hanya saat pengiriman (`EPIC-PD`).
- Alokasi di tabel milik modul Pendapatan: ditolak (`D-25`, `D-31`).

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu `FND-005`, `C-011`, `PD-002`, dan gate fondasi (lihat `03-readiness-review.md`).
