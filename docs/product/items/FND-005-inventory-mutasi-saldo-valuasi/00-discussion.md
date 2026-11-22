# FND-005 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-005` sebagai "Inventory: mutasi, saldo, valuasi rata-rata bergerak", sequence 5, `depends on` `FND-002` (status `specified`, belum `done`). `D-10` (Q1) mengunci metode valuasi rata-rata bergerak. `D-06` mengunci bahwa qty diturunkan dari `mutasi_stok` dan nilai disimpan di `saldo_stok`, diperbarui dalam transaksi yang sama.

Analisis §5.1 C4 mencakup juga transfer antar gudang dan stock opname. `D-52` memasukkan keduanya ke `FND-005`, dikerjakan paling akhir di item ini.

## Pembaruan 2026-11-22

Keputusan terkunci yang menjawab pertanyaan: `D-10` (rata-rata bergerak; `harga_rata` disimpan), `D-06` (qty dari mutasi; nilai di `saldo_stok`), `D-36` (stok masuk setelah QC lulus), `D-44` (1) (harga dari PO), `D-52` (multi-gudang disiapkan; transfer dan opname dalam item ini), `D-50` (master nonaktif tidak dipilih). Sisa mekanisme diberi usulan `[USULAN-AGEN]`.

Perhatian: `matriks-izin.md` belum punya baris untuk transfer, opname, dan penyesuaian stok (lihat OQ-05-06).

## Kenapa item ini

Pendapatan (cek stok, pengiriman, retur), Pengeluaran (penerimaan), dan Produksi (pemakaian bahan, hasil) semuanya mengubah stok. Tanpa satu service stok, tiga modul akan punya tiga saldo berbeda untuk barang yang sama (analisis §2.4). `ARCH-001` `ARCH-04` mewajibkan satu penulis.

Handoff `ARCH-001` menyebut bahwa bukti `INV-01` dan `INV-02` dicatat saat `FND-005` dan `FND-006` dibangun.

## Actor / consumer

- Modul Pendapatan, Pengeluaran, Produksi: memanggil layanan stok; tidak menulis `saldo_stok`.
- Gudang: pencatat mutasi masuk dan keluar, transfer, dan opname (`D-33`; masuk bahan saat QC lulus, `D-36`).
- Tech lead: pemilik item.

## Problem

Jika modul menulis saldo sendiri, qty dan nilai bisa berbeda dari riwayat mutasi, dan HPP tidak bisa dipercaya. Mutasi yang diubah atau dihapus menghilangkan jejak.

## Desired outcome

Setiap perubahan stok menjadi mutasi tak-ubah. Saldo qty dan nilai per produk per gudang sesuai dengan jumlah mutasi dan harga rata-rata bergerak, dan selalu diperbarui bersama mutasinya.

## Known constraints

- `D-06`: qty dari jumlah mutasi; nilai di `saldo_stok` (qty, nilai, harga_rata).
- `D-10`: metode rata-rata bergerak; tidak ada lapisan stok.
- `D-52`: saldo per produk per gudang; seed satu gudang; pemilihan gudang tampil hanya bila ada lebih dari satu gudang; transfer dan opname dikerjakan paling akhir di item ini.
- `ARCH-001` `ARCH-04`: `saldo_stok` hanya ditulis di `core/inventory`.
- `ARCH-001` `PRE-03`: mutasi tidak boleh backdate; qty bukan nol; tanggal tidak mendahului mutasi terakhir.
- `ARCH-001` `INV-02`, `INV-03`: `nilai = qty × harga_rata`; qty saldo = jumlah mutasi.
- `D-36`, `D-44` (1): bahan masuk saat QC lulus, senilai qty lolos × harga PO.
- `D-50`: master nonaktif tidak bisa dipilih untuk dokumen baru.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-05-01 | Transfer antar gudang dan stock opname masuk `FND-005` atau item lain? | Backlog `FND-005` tidak menyebutnya. | tech lead | Terjawab — D-52: masuk `FND-005`, dikerjakan paling akhir di item ini. |
| OQ-05-02 | Stok negatif dilarang? | Menentukan `PRE-03` dan AC-10. | user | Terjawab — [USULAN-AGEN]: stok tidak boleh negatif. Alasan: HPP dan nilai persediaan tidak bisa dipertanggungjawabkan bila keluar melebihi saldo (analisis §7.5 `[USULAN]`). |
| OQ-05-03 | Pembulatan qty dan nilai, dan perilaku `harga_rata` saat qty menjadi nol? | Menentukan AC-01, AC-02, AC-04. | tech lead / user | Terjawab — [USULAN-AGEN]: harga satuan dan harga rata `numeric(18,4)`, nilai `numeric(18,2)`; nilai masuk = pembulatan(qty × harga, 2); keluar memakai harga rata; saat qty habis nilai dibuat nol dan selisih pembulatan dibebankan ke keluar terakhir; `harga_rata` dipertahankan saat qty nol. Alasan: tidak ada perubahan harga saat stok habis dan selisih sen tidak tertinggal. |
| OQ-05-04 | `produk` dan `gudang` milik `C-011`, `FND-005` hanya bergantung `FND-002`. Harus ada di `FND-002`? | Dependensi `FND-005` tidak tercatat di backlog. | tech lead | Terjawab — [USULAN-AGEN]: tabel `produk` dan `gudang` dibuat `FND-002` (lihat `FND-002` OQ-02-03). Alasan: menghindari dependensi tersembunyi tanpa mengubah backlog. |
| OQ-05-05 | `alokasi_stok` (reservasi): milik `FND-005` atau `PD-003`? | Backlog `PD-003` menyebut reservasi. | tech lead | Terjawab — [USULAN-AGEN]: tabel `alokasi_stok` dibuat `PD-003` (item pertama yang membutuhkan, `D-31`); `FND-005` menyediakan saldo, dan "tersedia" = qty saldo sampai `PD-003` menambah pengurang alokasi. Alasan: `FND-005` tidak perlu tabel yang belum ada pemakainya. |
| OQ-05-06 | Koreksi mutasi: dokumen penyesuaian atau mutasi langsung? Dokumen penyesuaian butuh `FND-004`. | Menentukan dependensi baru atau bentuk koreksi. | tech lead | Terjawab — [USULAN-AGEN]: koreksi hanya lewat mutasi baru jenis `PENYESUAIAN` dengan alasan wajib; transfer, opname, dan penyesuaian dilakukan peran Gudang (matriks belum punya baris, usulan ini diusulkan menambahkannya). Tidak ada dependensi ke `FND-004`. Alasan: mutasi sudah tak-ubah; dokumen penyesuaian bukan kebutuhan yang tercatat di sumber. |
| OQ-05-07 | Penegakan `ARCH-04` di database sebelum `FND-003` selesai? | Tanpa ini AC-06 tidak bisa diuji. | tech lead | Terjawab — [USULAN-AGEN]: role klien tidak punya hak `INSERT`, `UPDATE`, atau `DELETE` pada `mutasi_stok` dan `saldo_stok`; penulisan hanya lewat fungsi database milik `core/inventory`. Pembatasan per peran ditambah `FND-003`. Alasan: penegakan tidak menunggu `FND-003`. |
| OQ-05-08 | `harga_rata` disimpan atau dihitung saat dibaca? | Mengubah isi `saldo_stok`. | tech lead | Terjawab — D-10 dan D-06: disimpan di `saldo_stok`. |
| OQ-05-09 | Dari siapa harga masuk dicatat? | Batas antara modul dan core. | tech lead | Terjawab — D-44 (1) dan D-36: harga dari PO, qty lolos QC, dicatat pemicu `PG-007`. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `[USULAN-AGEN]` OQ-05-02..03 | Stok tidak negatif; aturan pembulatan dan `harga_rata` saat nol | 2026-11-22 | tech lead (kunci koordinator) | AC-02, AC-04, AC-10 |
| `[USULAN-AGEN]` OQ-05-04..07 | `produk`/`gudang` di `FND-002`; `alokasi_stok` di `PD-003`; koreksi lewat `PENYESUAIAN`; penulisan dibatasi hak database | 2026-11-22 | tech lead (kunci koordinator) | Migrasi dan AC-06 |
| `[USULAN-AGEN]` matriks | Transfer, opname, dan penyesuaian oleh Gudang; baris ini ditambahkan ke matriks | 2026-11-22 | koordinator | `matriks-izin.md` perlu baris baru |

## Assumptions (agent-proposed)

- A1: Rumus rata-rata bergerak mengikuti definisi standar: masuk menghitung ulang harga rata dari nilai dan qty total; keluar memakai harga rata yang berlaku. Ini definisi metode `D-10`.
- A2: Tipe qty dan uang mengikuti `FND-002` `OQ-02-07`.
- A3: Ukuran `M` `[USULAN]`; transfer dan opname menambah ukuran (dikerjakan paling akhir, `D-52`).

## Rejected alternatives

- Lapisan stok (FIFO/lapisan): ditolak oleh `D-10` (`lapisan_stok` tidak dipakai).
- Kolom `stok` di produk: ditolak oleh `D-06`.
- Modul menulis saldo sendiri: ditolak oleh `ARCH-04`.
- Transfer sebagai dua dokumen terpisah: ditolak; transfer adalah dua mutasi dalam satu transaksi.

## Next step

Koordinator mengunci keputusan `[USULAN-AGEN]` dan baris matriks baru. Setelah `FND-002` `done`, item ini dapat menjadi `Ready` sesuai 03.
