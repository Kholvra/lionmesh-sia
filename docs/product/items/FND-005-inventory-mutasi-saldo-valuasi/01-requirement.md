---
id: FND-005
slug: inventory-mutasi-saldo-valuasi
title: Inventory: mutasi, saldo, dan valuasi rata-rata bergerak
epic: EPIC-FND
milestone: M0
lane: active
sequence: 5
type: feature
req_status: specified
delivery_status: not_started
priority: unset
size: unset
depends_on:
  - FND-002
blocks:
  - C-013
  - PD-003
  - PD-007
  - PG-006
  - PG-007
  - PR-004
  - PR-005
owner_role: tech lead
package: docs/product/items/FND-005-inventory-mutasi-saldo-valuasi
---

# FND-005 — Inventory: mutasi, saldo, dan valuasi rata-rata bergerak

## Masalah

Stok diubah oleh tiga siklus. Jika masing-masing menghitung saldonya sendiri, barang yang sama punya tiga angka berbeda, dan nilai persediaan serta HPP tidak bisa dipertanggungjawabkan.

## Outcome

Setiap masuk dan keluar barang tercatat sebagai mutasi yang tidak bisa diubah. Qty dan nilai saldo per produk per gudang selalu sesuai dengan mutasi dan harga rata-rata bergerak, dan diperbarui dalam transaksi yang sama. Transfer antar gudang dan opname menghasilkan mutasi biasa. Modul lain tidak bisa mengubah saldo secara langsung.

## Aktor

| Aktor | Peran |
|---|---|
| Gudang | mencatat masuk dan keluar, transfer, opname, dan penyesuaian (`D-33`; masuk bahan saat QC lulus, `D-36`) |
| Modul siklus | memanggil layanan stok untuk mutasi yang timbul dari dokumennya |
| Accounting | melihat nilai persediaan dan HPP (lewat laporan, bukan item ini) |
| Tech lead | pemilik item |

## Cakupan

### Termasuk

- Mutasi masuk dan keluar per produk per gudang, tidak bisa diubah atau dihapus.
- Saldo qty, nilai, dan harga rata-rata bergerak per produk per gudang.
- Pembaruan saldo dalam transaksi yang sama dengan mutasi.
- Larangan mutasi dengan tanggal mundur (`ARCH-001` `PRE-03`).
- Mutasi masuk bahan saat QC lulus, bukan saat penerimaan (`D-36`); harga satuan dari PO (`D-44` (1)).
- Stok tidak boleh negatif (`OQ-05-02`).
- Transfer antar gudang (`D-52`): dua mutasi (keluar dari asal, masuk ke tujuan) dalam satu transaksi.
- Stock opname (`D-52`): perbandingan qty fisik dan saldo, selisih menjadi mutasi penyesuaian.
- Multi-gudang: saldo per produk per gudang; seed satu gudang; pemilihan gudang di layar hanya tampil bila ada lebih dari satu gudang (layar milik modul pemakai).

### Tidak termasuk

- Dokumen penerimaan, pengiriman, produksi (modul).
- Reservasi dan alokasi stok (`PD-003`, `OQ-05-05`).
- Jurnal persediaan dan HPP (`FND-006`, `PD-008`, `PR-006`).
- Mata uang dan kurs (`D-38`).

## Aturan valuasi

Metode rata-rata bergerak (`D-10`). Definisi operasional (`OQ-05-03`):

- Masuk: `nilai_masuk = pembulatan(qty × harga_satuan, 2)`. `nilai_baru = nilai_lama + nilai_masuk`; `qty_baru = qty_lama + qty`; `harga_rata_baru = pembulatan(nilai_baru ÷ qty_baru, 4)`.
- Keluar: `nilai_keluar = pembulatan(qty × harga_rata, 2)`. `harga_rata` tidak berubah. Bila keluar menghabiskan saldo, `nilai_keluar` = nilai saldo sisa (selisih pembulatan ikut keluar).
- Saat qty saldo nol: `nilai` nol; `harga_rata` dipertahankan (tidak direset).
- Transfer: keluar dari asal pada harga rata asal; masuk ke tujuan pada harga yang sama dengan nilai keluar (nilai total tidak berubah).
- Opname selisih: lebih ke atas dinilai pada `harga_rata` saat itu; lebih ke bawah dikeluarkan pada `harga_rata` saat itu.
- Tampilan dibulatkan dua desimal; penyimpanan memakai presisi di atas.

## Mutasi dan saldo

- `mutasi_stok`: id, produk, gudang, tanggal, tipe (`MASUK`, `KELUAR`, `TRANSFER_KELUAR`, `TRANSFER_MASUK`, `PENYESUAIAN`), `qty` bertanda (positif masuk, negatif keluar; tidak boleh nol), `harga_satuan`, `nilai`, sumber (jenis dan id dokumen pemicu), `alasan` (wajib untuk `PENYESUAIAN`), kolom audit.
- `saldo_stok`: produk, gudang (kunci), `qty`, `nilai`, `harga_rata`, kolom audit.
- Tanggal mutasi tidak boleh mendahului mutasi terakhir pada pasangan produk dan gudang yang sama (`ARCH-001` `PRE-03`).
- Penulisan mutasi dan saldo satu transaksi; gagal salah satu, keduanya batal.

## Status dan transisi

Tidak ada state machine dokumen. Mutasi bersifat tak-ubah; koreksi dilakukan lewat mutasi baru (`PENYESUAIAN`).

| Keadaan saldo | Arti |
|---|---|
| belum ada saldo | belum pernah ada mutasi untuk pasangan produk dan gudang |
| ada saldo, qty > 0 | saldo terbuka |
| qty = 0 | nilai nol; `harga_rata` dipertahankan |

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Teks |
|---|---|---|
| Qty nol | ditolak | "Qty harus bukan nol." |
| Produk atau gudang tidak ada atau nonaktif (`D-50`) | ditolak | "Produk {kode} tidak ditemukan atau nonaktif." / "Gudang {kode} tidak ditemukan atau nonaktif." |
| Tanggal mendahului mutasi terakhir | ditolak; baris tidak bertambah | "Tanggal mutasi tidak boleh mendahului mutasi terakhir ({tanggal})." |
| Keluar melebihi qty saldo | ditolak | "Qty keluar {x} melebihi stok tersedia {y}." |
| Harga satuan masuk nol atau negatif | ditolak | "Harga satuan harus lebih dari nol." |
| Transfer dengan gudang asal sama dengan tujuan | ditolak | "Gudang asal dan tujuan tidak boleh sama." |
| Penyesuaian tanpa alasan | ditolak | "Isi alasan penyesuaian stok." |
| Gagal menulis saldo | mutasi tidak tersimpan | pesan teknis |
| Percobaan ubah atau hapus mutasi | ditolak; mutasi tetap | "Mutasi stok tidak bisa diubah atau dihapus. Koreksi dengan mutasi baru." |

## Batasan

- Mutasi bersifat tak-ubah.
- Harga satuan masuk berasal dari PO (`D-44` (1)) dan wajib positif.
- Modul tidak menulis `saldo_stok` langsung; penulisan hanya lewat fungsi `core/inventory`.
- Valuasi berada di balik satu antarmuka sehingga bisa diganti FIFO tanpa menyentuh modul (`D-10`).

## Menyentuh uang dan stok

- Stok: setiap mutasi menyebut arah (masuk atau keluar) dan efek ke `saldo_stok` (qty, nilai, `harga_rata`).
- Uang: item ini tidak memposting jurnal. Sumber angka yang disediakan: `nilai_masuk` (qty lolos × harga PO, `D-44` (1), pemicu `PG-007`) dan `nilai_keluar` (qty × `harga_rata`, untuk HPP saat kirim, `D-44` (3), pemicu `PD-004`/`PD-008`). Akun jurnal (Dr 120 / Cr 202 untuk masuk bahan; Dr 501 / Cr 122 untuk HPP kirim) ditetapkan di item pemicu lewat peran akun (`D-35`). Pasangan jurnal untuk keluar bahan ke produksi belum tercatat di keputusan terkunci; ditentukan `PR-004`/`PR-006`.

## Dependensi

- `FND-002`: tabel `mutasi_stok`, `saldo_stok` (dibuat item ini), dan `produk`, `gudang` (dibuat `FND-002`, `OQ-05-04`).

## Yang membuka jalan

- `PD-003`, `PD-007`, `PG-006`, `PG-007`, `PR-004`, `PR-005`, `C-013`.

## Data pribadi

Tidak ada. Aktor mutasi adalah identitas sesi (`FND-003`) dan tercatat di kolom audit.

## Catatan serah terima

- Handoff `ARCH-001` meminta bukti pertama `INV-02` (nilai saldo) dicatat saat item ini dibangun; `INV-01` (jurnal balance) dicatat di `FND-006`. Lihat AC-04.
- Matriks izin perlu baris baru untuk transfer, opname, dan penyesuaian (Gudang), lewat keputusan koordinator.
