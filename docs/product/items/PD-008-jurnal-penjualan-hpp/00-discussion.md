# PD-008 — Diskusi

## Konteks

Setiap kejadian penjualan (pengiriman, faktur, pembayaran, retur, pembatalan) harus menghasilkan jurnal yang balance tanpa input manual (`EPIC-PD`, gate 2). `analisis-sia.md` §6.7 memberi pasangan debit-kredit per kejadian sebagai rancangan; pasangan itu kini dikunci lewat `D-44` dan `D-41` dalam bentuk peran akun. Item ini adalah track PD-D pelaporan, level 6, dengan dependensi `PD-004`…`PD-007` dan `FND-006`. Item ini juga menjadi dependensi `INT-001`.

## Actor / consumer

Accounting melihat jurnal. Modul tidak menulis jurnal sendiri (`D-07`). Laporan keuangan (`C-009`) membaca buku besar.

## Problem

Jika setiap modul menyusun jurnal sendiri, formatnya berbeda dan laporan tidak balance (`analisis-sia.md` §9.4 poin 3). HPP tidak tercatat jika stok keluar tidak punya biaya.

## Desired outcome

Setiap kejadian penjualan yang sah menghasilkan jurnal lewat `postJournal()` dengan peran akun yang dikunci dan nilai dari dokumen dan harga rata. Setiap jurnal menyimpan jenis transaksi asal, nomor transaksi asal, dan pemicunya (`D-43`).

## Known constraints

- `D-07`: hanya `postJournal()`.
- `D-10`: nilai HPP dari harga rata.
- `D-17`: PPN dihitung di dokumen.
- `D-35`: modul memanggil peran akun; dokumen batal menghasilkan jurnal pembalik.
- `D-41`: COA dasar dan peran akun.
- `D-43`: jurnal langsung diposting; tidak bisa diubah; header dan baris dalam satu transaksi.
- `D-44`: waktu pengakuan dan pasangan jurnal; koreksi periode tertutup lewat jurnal pembalik di periode berjalan.
- `ARCH-001` `PRE-02`: periode terkunci menolak jurnal.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Akun untuk piutang, penjualan, HPP, persediaan barang jadi, kas, dan PPN keluaran? | Terjawab — D-41 dan D-35: peran `piutang_usaha` (110), `penjualan` (401), `hpp` (501), `persediaan_barang_jadi` (122), `kas_bank` (102), `ppn_keluaran` (nomor diberikan saat `FND-006` ditulis). Tidak ada akun kas tunai: [USULAN-AGEN]. Alasan: `D-41` tidak memuat akun kas tunai, dan `D-49`/`PD-006` memakai rekening bank untuk penerimaan. |
| `PQ-02` | Waktu pengakuan pendapatan dan HPP? | Terjawab — D-44 (3): HPP saat pengiriman dikirim (`hpp` / `persediaan_barang_jadi`); piutang dan penjualan saat faktur terbit (`piutang_usaha` / `penjualan`, `ppn_keluaran`). |
| `PQ-03` | Dokumen di periode terkunci? | Terjawab — D-44 (5) dan ARCH-001 `PRE-02`: periode terkunci menolak jurnal baru; koreksi periode tertutup lewat jurnal pembalik di periode berjalan. |
| `PQ-04` | Jurnal pembalik untuk dokumen batal? | Terjawab — D-35 dan D-44 (5): dokumen batal menghasilkan jurnal pembalik (G12 diadopsi). |
| `PQ-05` | Retur wajib selesai sebelum jurnal penjualan biasa? | Terjawab — [USULAN-AGEN]: dependensi `PD-007` dipertahankan sesuai `backlog.md`. Jurnal penjualan biasa tetap bisa dipakai uji lebih awal, tetapi item ini baru `done` setelah jurnal retur berjalan. Alasan: mengubah dependensi backlog adalah keputusan tech lead dan tidak dilakukan di paket. |
| `PQ-06` | Bila harga rata belum ada (stok kosong atau harga belum pernah ada)? | Terjawab — [USULAN-AGEN]: pengiriman ditolak sebelum mutasi bila saldo fisik tidak cukup (`PD-004` `PRE-02`), sehingga harga rata tersedia untuk qty > 0. Bila harga rata kosong karena data tidak konsisten, konfirmasi ditolak dengan pesan "Harga rata belum tersedia untuk produk ini."; tidak ada mutasi dan tidak ada jurnal. |
| `PQ-07` | Dependensi HPP pada `FND-005` tidak tertulis langsung di `depends on`? | Terjawab — [USULAN-AGEN]: cukup transitif. `PD-007` dan `PD-004` sudah mensyaratkan `FND-005`, sehingga `FND-005` pasti `done` sebelum item ini. `backlog.md` tidak diubah. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-07` | jurnal lewat `postJournal()` | decisions.md | modul memanggil service |
| `D-10` | rata-rata bergerak | decisions.md | HPP = qty × harga rata |
| `D-17` | PPN di dokumen | decisions.md | PPN keluaran di jurnal faktur |
| `D-35`, `D-41` | peran akun dan COA | decisions.md | tidak ada nomor akun di modul |
| `D-43` | aturan jurnal | decisions.md | tidak ada draft; sumber disimpan |
| `D-44` (3), (5) | waktu pengakuan; koreksi periode | decisions.md | pasangan jurnal |

## Assumptions (agent-proposed)

- `[USULAN]` Pasangan jurnal dari `analisis-sia.md` §6.7 diterima sebagai rancangan, dengan peran akun dari `D-41`.
- `[USULAN]` Jurnal dari kejadian yang sama memakai `sumber_tipe` dan `sumber_id` (`analisis-sia.md` §7.5).

## Rejected alternatives

- Jurnal per modul: ditolak (`D-07`, `analisis-sia.md` §2.4).
- Jurnal penjualan dalam bentuk draf lalu diposting: ditolak (`D-43`).

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu dependensi dan gate fondasi (lihat `03-readiness-review.md`).
