---
id: PG-006
slug: penerimaan-barang
title: Penerimaan barang
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: in_progress
priority: unset
size: unset
depends_on:
  - FND-005
  - PG-005
blocks:
  - PG-007
owner_role: unset
package: docs/product/items/PG-006-penerimaan-barang
---

# PG-006 — Penerimaan barang

## Masalah

Barang dari pemasok datang untuk PO yang sudah diterbitkan, tetapi belum ada catatan resmi tentang apa yang diterima, berapa qty-nya, dan apakah cocok dengan PO. Tanpa catatan itu, invoice pemasok (PG-008) tidak punya pembanding dan barang tidak bisa diperiksa mutunya (PG-007).

## Outcome

Gudang dapat mencatat penerimaan barang terhadap satu PO yang sah. Penerimaan tersimpan sebagai dokumen dengan nomor, status awal, dan riwayat. Penerimaan ini belum menambah stok dan belum membuat jurnal; keduanya terjadi setelah QC lulus (PG-007). Qty yang tidak sama dengan qty PO pada penerimaan penuh tampil sebagai selisih, tidak diterima diam-diam. Kelebihan kirim ditolak.

## Aktor

| Aktor | Peran pada item ini | Sumber |
|---|---|---|
| Gudang | mencatat penerimaan; membatalkan penerimaan sebelum QC | `policies/matriks-izin.md` (D-33, disahkan); pembatalan D-48 |
| Purchasing | pemilik PO asal; menutup exception selisih | UC-PG07 (konfirmasi ke purchasing); baris matriks untuk penutupan exception belum ada, diusulkan di `03-readiness-review.md` |
| Sistem | memberi nomor, menyimpan riwayat, menolak input tidak valid | ARCH-05 |

## Ringkasan (derived)

- Track: PG-C penerimaan. Level 5 (derived dari backlog, bukan normatif).
- Layar milik modul Pengeluaran; tabel dan aturan milik `core/pengadaan` (D-05).

## Cakupan

### Termasuk

- Mencatat penerimaan terhadap satu PO yang sah, sekali atau bertahap (R-01, R-02).
- Qty per baris PO dan gudang tujuan per penerimaan (R-05).
- Nomor dokumen penerimaan (R-07).
- Pencatatan dan tampilan selisih qty pada penerimaan penuh (R-02, R-09).
- Penolakan kelebihan kirim sebagai exception (R-03).
- Pembatalan penerimaan sebelum QC (R-08).
- Daftar penerimaan dan riwayat status.

### Tidak termasuk

- QC bahan dan hasilnya (PG-007).
- Retur ke pemasok (PG-007).
- Penambahan stok (PG-007, setelah QC lulus).
- Jurnal apa pun dari penerimaan (PG-007 untuk QC lulus, PG-008 untuk pengakuan utang).
- Invoice pemasok dan pencocokan tiga dokumen (PG-008).
- Pembuatan PO (PG-005).
- Pembatalan atau koreksi penerimaan yang sudah punya hasil QC (koreksi lewat PG-007).

## Constraints & invariants

- Penerimaan tidak mengubah saldo stok dan tidak membuat jurnal (EPIC-PG; D-36; D-44 (1)).
- Stok bahan masuk hanya setelah QC lulus (D-36). Nilai masuk memakai harga PO (D-44 (1)), bukan harga di penerimaan (R-06).
- Qty selisih pada penerimaan penuh selalu menjadi exception dan tidak pernah lolos diam-diam (D-15).
- Total qty diterima per baris tidak boleh melebihi qty PO (D-49, R-03).
- Dokumen penerimaan yang sudah tercatat tidak diubah diam-diam (D-48; `analisis-sia.md` §9.2 G15).
- Setiap perubahan status tercatat di riwayat dengan aktor dan waktu (D-08, `ARCH-001` INV-05).
- Modul tidak menulis ke tabel milik core secara langsung (D-04, D-25).
- Dependensi konseptual ke `FND-005` dilepas di spesifikasi ini (D-36). Front-matter `depends_on` tetap mengikuti `backlog.md`.

## Behavior / rules

### Aturan (keputusan terkunci atau [USULAN-AGEN], lihat `00-discussion.md`)

- `R-01` Penerimaan hanya untuk PO berstatus `DITERBITKAN` atau `DITERIMA_SEBAGIAN` (D-46). PO berstatus `DITERIMA` menolak penerimaan baru.
- `R-02` Setiap penerimaan menyatakan jenis `sebagian` atau `penuh`. Penerimaan `penuh` yang qty per baris lebih kecil dari qty PO membuat selisih exception (D-15). Penerimaan `sebagian` dengan qty lebih kecil tidak membuat exception; sisanya tetap terbuka.
- `R-03` Total qty diterima per baris, akumulasi semua penerimaan untuk PO itu, tidak boleh melebihi qty PO. Penerimaan yang melebihi ditolak dan dicatat sebagai exception (D-49).
- `R-04` Status PO turunan: `DITERIMA_SEBAGIAN` selama ada baris yang masih punya sisa dan penerimaan sudah bertahap; `DITERIMA` setelah penerimaan `penuh` tercatat atau semua baris penuh. Dokumen penerimaan berstatus `DITERIMA` saat tersimpan (D-46; [USULAN-AGEN]).
- `R-05` Gudang tujuan dipilih per penerimaan dari gudang aktif. Pilihan gudang tampil hanya bila gudang aktif lebih dari satu (D-52).
- `R-06` Harga satuan tidak disimpan pada penerimaan. Nilai masuk saat QC lulus memakai harga PO (D-44 (1)).
- `R-07` Nomor `TRM/{TAHUN}/{BULAN}/{URUT}` dibuat oleh `core/dokumen` (D-50).
- `R-08` Pemohon, yaitu Gudang pencatat, boleh membatalkan penerimaan dengan alasan wajib selama belum ada hasil QC pada baris mana pun. Status menjadi `DIBATALKAN`, sisa qty PO kembali, dan tidak ada efek stok atau jurnal (D-48; [USULAN-AGEN]). Setelah ada hasil QC, pembatalan tidak tersedia.
- `R-09` Penerimaan yang sudah tersimpan tidak diedit. Tidak ada jalur ubah isi (D-48).
- `R-10` Exception selisih ditutup Purchasing dengan alasan tercatat. Penutupan tidak mengubah qty PO, sisa, atau saldo, dan tidak membuat jurnal ([USULAN-AGEN]).

### Alur utama

1. Gudang membuka PO yang berstatus `DITERBITKAN` atau `DITERIMA_SEBAGIAN`.
2. Gudang memilih jenis penerimaan (`sebagian` atau `penuh`), gudang tujuan bila perlu, dan mengisi qty diterima per baris PO.
3. Sistem memeriksa input (lihat Validasi). Bila kelebihan kirim, penerimaan ditolak dan exception dicatat.
4. Sistem menyimpan penerimaan dengan nomor dan status `DITERIMA`, memperbarui status PO turunan (R-04), dan menulis riwayat.
5. Bila penerimaan `penuh` punya baris kurang dari qty PO, sistem menandai selisih. Purchasing menutup exception (R-10).

### Status

Daftar status mengikuti state machine (D-46, `diagram-sia-lengkap.md` §5.2).

| Status | Objek | Arti | Transisi keluar |
|---|---|---|---|
| `DITERBITKAN` | PO | PO sudah terbit; boleh diterima | ke `DITERIMA_SEBAGIAN` atau `DITERIMA` |
| `DITERIMA_SEBAGIAN` | PO turunan | sebagian qty PO sudah tercatat; sisa belum datang | ke `DITERIMA` bila sisa datang atau penerimaan `penuh` tercatat |
| `DITERIMA` | PO turunan dan dokumen penerimaan | barang sudah dicatat Gudang, belum diperiksa QC | ke tahap QC (PG-007) |
| `DIBATALKAN` | dokumen penerimaan | dibatalkan sebelum ada hasil QC (D-48) | — |

### Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| PO belum berstatus `DITERBITKAN` atau `DITERIMA_SEBAGIAN` | Penerimaan ditolak; pesan menyebut status PO saat ini |
| Qty diterima kosong, nol, atau negatif pada baris mana pun | Penerimaan ditolak; pesan menyebut baris dan aturan qty harus lebih dari nol |
| Total qty per baris melebihi qty PO | Penerimaan ditolak; exception tercatat; pesan menyebut baris, qty PO, dan sisa |
| Penerimaan `penuh` dengan qty per baris lebih kecil dari qty PO | Penerimaan disimpan dengan selisih exception; pesan dan tampilan menyebut qty PO dan qty diterima |
| Gudang tujuan tidak ditemukan atau tidak aktif | Penerimaan ditolak; pesan menyebut gudang yang dipilih |
| Dua pencatatan untuk PO yang sama terjadi bersamaan | Salah satu ditolak dengan pesan bahwa dokumen sudah diproses pengguna lain |
| Percobaan mengubah penerimaan yang sudah tercatat | Ditolak; pesan menyebut bahwa penerimaan tidak dapat diubah |
| Pembatalan setelah ada hasil QC pada baris mana pun | Ditolak; pesan menyebut hasil QC yang sudah ada |
| Pembatalan tanpa alasan | Ditolak; pesan menyebut alasan wajib diisi |

Teks pesan final mengikuti implementasi; yang diikat di sini adalah isi informasi pesan.

## Success

- Gudang dapat mencatat penerimaan dari UI tanpa skrip atau langkah manual di dashboard.
- Setelah penerimaan tercatat, saldo stok dan jumlah jurnal tidak berubah.
- Setiap selisih qty pada penerimaan penuh terlihat oleh pengguna sebelum QC dimulai.

## Edge cases (optional)

- Penerimaan untuk PO yang belum pernah diterbitkan (ditolak, lihat Validasi).
- Dua pengguna mencatat penerimaan untuk PO sama pada saat yang sama (salah satu ditolak).
- Qty diterima lebih besar dari qty PO (ditolak sebagai exception, R-03).
- Penerimaan bertahap sampai sisa habis lalu satu penerimaan tambahan (ditolak, R-03).

## Decision references (optional)

- `D-04`, `D-05`, `D-08`, `D-15`, `D-25`, `D-33`, `D-36`, `D-44`, `D-46`, `D-48`, `D-49`, `D-50`, `D-52`.
- `EPIC-PG` aturan mengikat: barang masuk stok setelah QC lulus; utang diakui saat tiga dokumen cocok.
- `ARCH-001` ARCH-05, ARCH-06, ARCH-08.
- Pertanyaan dan jawabannya: lihat `00-discussion.md`.

## Catatan serah terima

Requirement ini mengikat perilaku dan bukti, bukan tabel atau nama fungsi. Desain kontrak ada di `04-design-contract.md` (status `Proposed`). Usulan bertanda [USULAN-AGEN] menunggu penguncian koordinator.
