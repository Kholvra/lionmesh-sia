---
id: PG-007
slug: qc-bahan-dan-retur-pemasok
title: QC bahan dan retur ke pemasok
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
  - PG-006
blocks:
  - PG-008
owner_role: unset
package: docs/product/items/PG-007-qc-bahan-dan-retur-pemasok
---

# PG-007 — QC bahan dan retur ke pemasok

## Masalah

Barang yang sudah diterima belum diperiksa mutunya. Tanpa catatan QC, barang cacat bisa dihitung sebagai tersedia, dan tidak ada jalur resmi untuk mengembalikan barang gagal ke pemasok.

## Outcome

QC mencatat hasil pemeriksaan per baris penerimaan. Qty yang lulus masuk stok dan tercatat di jurnal dalam satu transaksi. Qty yang gagal tidak masuk stok, dipisahkan, dan bisa diretur ke pemasok lewat dokumen retur yang disetujui Accounting dan punya jejak.

## Aktor

| Aktor | Peran pada item ini | Sumber |
|---|---|---|
| QC | mencatat hasil QC lulus atau gagal per baris | `policies/matriks-izin.md` (D-33). `proses-bisnis.md` A5 menyebut Gudang; D-33 menang |
| Gudang | memisahkan barang gagal secara fisik; melaksanakan pengeluaran retur fisik | §5.3 PG-7; baris matriks untuk pengeluaran retur belum ada (diusulkan) |
| Purchasing | mengajukan retur ke pemasok | baris matriks untuk pengajuan retur belum ada (diusulkan) |
| Accounting | menyetujui retur (D-49); pemilik jurnal QC lulus | D-49; D-33 (Accounting tidak mengeksekusi pembayaran) |
| Sistem | menulis stok dan jurnal dalam satu transaksi, menolak input tidak valid | D-06, D-07 |

## Ringkasan (derived)

- Track: PG-C penerimaan. Level 6 (derived dari backlog).
- Menyentuh stok dan uang: jurnal dan `saldo_stok` berubah saat QC lulus.

## Cakupan

### Termasuk

- Pencatatan hasil QC lulus dan gagal per baris penerimaan (R-01, R-02).
- Mutasi masuk untuk qty lulus, dalam transaksi yang sama dengan jurnal QC lulus (R-03).
- Penandaan dan pemisahan barang gagal, tanpa mutasi (R-04).
- Dokumen retur ke pemasok untuk bahan gagal, dengan persetujuan Accounting (R-05).

### Tidak termasuk

- Penerimaan barang (PG-006).
- Pengakuan utang dan pencocokan invoice (PG-008).
- Pembayaran (PG-009).
- Rework dan reject untuk produksi (PR-005, `analisis-sia.md` G6).
- Nota kredit dari pemasok atas retur (tidak ada di sumber; di luar versi awal).

## Constraints & invariants

- Barang masuk stok hanya setelah QC lulus (aturan EPIC-PG, D-36).
- Qty stok berubah lewat mutasi, nilai lewat `saldo_stok` dalam transaksi yang sama (D-06).
- Jurnal hanya lewat `postJournal()` (D-07). Total debit sama dengan total kredit.
- Retur hanya untuk bahan (D-13). Retur merujuk penerimaan asal dan tidak melebihi qty gagal (D-49).
- Retur tidak mengubah `saldo_stok`, tidak membuat jurnal, dan tidak mengubah utang (R-06).
- Jurnal QC lulus: Dr 120 Persediaan bahan baku / Cr 202 Utang belum difakturkan, senilai qty lulus × harga PO (D-44 (1), D-41). Angka tidak diisi dari asumsi.

## Behavior / rules

### Aturan (keputusan terkunci atau [USULAN-AGEN], lihat `00-discussion.md`)

- `R-01` QC dicatat per baris penerimaan oleh peran QC (D-33). Untuk setiap baris, qty lulus + qty gagal = qty diterima baris. Baris berstatus `DITERIMA` menjadi `QC_LULUS` atau `QC_GAGAL` (D-46).
- `R-02` Hasil QC per baris bersifat final dan hanya dicatat sekali (INV-05).
- `R-03` QC lulus per baris dengan qty lulus lebih dari nol, dalam satu transaksi: (a) mutasi masuk untuk qty lulus; (b) `saldo_stok` diperbarui dengan rata-rata bergerak (D-06, D-10); (c) nilai masuk = qty lulus × harga PO (D-44 (1)); (d) jurnal Dr 120 / Cr 202 (D-41, D-43); (e) status baris `QC_LULUS` dan riwayat (D-08). Bila salah satu gagal, seluruh transaksi dibatalkan.
- `R-04` QC gagal per baris: tidak ada mutasi masuk, tidak ada jurnal, dan `saldo_stok` tidak berubah. Qty gagal tercatat sebagai barang terpisah. Lokasi pemisahan (mis. "karantina") dicatat sebagai teks pada baris dan tidak membuat mutasi ([USULAN-AGEN]).
- `R-05` Retur ke pemasok, hanya untuk bahan (D-13): dokumen tersendiri (D-49). Wajib merujuk baris penerimaan yang punya qty gagal. Qty retur tidak boleh melebihi qty gagal yang belum diretur. Diajukan Purchasing, disetujui Accounting (D-49). Status `DIAJUKAN` → `DISETUJUI` atau `DITOLAK`. `DIBATALKAN` tersedia selama masih `DIAJUKAN`, dengan alasan wajib (D-48). Setelah `DISETUJUI`, retur tidak dibatalkan; koreksi dengan dokumen retur baru selama qty gagal masih tersisa ([USULAN-AGEN]).
- `R-06` Retur tidak membuat mutasi, tidak mengubah `saldo_stok`, tidak membuat jurnal, dan tidak mengubah utang. Barang gagal tidak pernah masuk GR/IR (D-44 (1)) dan tidak pernah dicocokkan dengan invoice (PG-008 R-02) ([USULAN-AGEN]).
- `R-07` Barang gagal bahan tidak menimbulkan beban atau jurnal pada versi awal ([USULAN-AGEN]).
- `R-08` Akun 120 dan 202 harus aktif. Tanggal posting di periode terkunci menolak QC lulus (FND-006; D-43).
- `R-09` Peran: QC mencatat hasil (D-33). Gudang mencatat pemisahan fisik dan pengeluaran retur fisik. Purchasing mengajukan retur. Accounting menyetujui retur dan memiliki jurnal QC lulus.
- `R-10` Bahan tidak punya status rework. Hanya `lulus` dan `gagal` (`LAPORAN_PENGERJAAN_PROYEK.txt`; Q-01).

### Alur utama QC lulus

1. QC membuka baris penerimaan berstatus `DITERIMA` (PG-006).
2. QC mengisi qty lulus dan qty gagal untuk baris itu (R-01).
3. Sistem menulis mutasi masuk untuk qty lulus, memperbarui nilai stok, dan membuat jurnal, dalam satu transaksi (R-03).
4. Status baris berubah ke `QC_LULUS` dan riwayat tercatat.

### Alur QC gagal dan retur

1. QC mencatat qty gagal per baris (R-01, R-04).
2. Sistem menandai barang gagal dan tidak menambah stok.
3. Gudang memisahkan barang gagal secara fisik dan mencatat lokasi sebagai teks.
4. Purchasing mengajukan retur untuk qty gagal (R-05). Accounting menyetujui atau menolak.
5. Setelah disetujui, Gudang melaksanakan pengeluaran fisik. Tidak ada mutasi atau jurnal dari retur (R-06).

### Status

| Status | Objek | Arti | Transisi keluar |
|---|---|---|---|
| `DITERIMA` (D-46) | baris penerimaan | menunggu QC | ke `QC_LULUS` atau `QC_GAGAL` |
| `QC_LULUS` (D-46) | baris penerimaan | qty lulus sudah masuk stok | — |
| `QC_GAGAL` (D-46) | baris penerimaan | qty gagal dipisahkan, tidak masuk stok | ke retur (R-05) |
| `DIAJUKAN` ([USULAN-AGEN], nama dari diagram §5.2) | dokumen retur | diajukan Purchasing | ke `DISETUJUI`, `DITOLAK`, atau `DIBATALKAN` |
| `DISETUJUI` / `DITOLAK` (diagram §5.2) | dokumen retur | keputusan Accounting | `DISETUJUI` final dalam versi awal |
| `DIBATALKAN` (D-48) | dokumen retur | dibatalkan sebelum disetujui | — |

Status dokumen penerimaan adalah turunan dari status baris: semua `QC_LULUS`, semua `QC_GAGAL`, atau campuran yang ditampilkan sebagai kombinasi (bukan status baru).

### Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| QC dicatat untuk baris yang tidak berstatus `DITERIMA` | Ditolak; pesan menyebut status baris |
| Qty lulus + qty gagal tidak sama dengan qty diterima pada baris | Ditolak; pesan menyebut baris dan jumlah yang tidak cocok |
| Hasil QC untuk baris yang sudah final dicatat lagi | Ditolak; pesan menyebut hasil sebelumnya |
| Akun 120 atau 202 tidak aktif di konfigurasi | Ditolak; pesan menyebut akun yang tidak aktif |
| Tanggal posting berada di periode yang terkunci | Ditolak; pesan menyebut periode terkunci |
| Retur tanpa referensi baris penerimaan | Ditolak; pesan menyebut referensi yang wajib |
| Qty retur melebihi qty gagal yang belum diretur | Ditolak; pesan menyebut qty gagal yang tersedia |
| Retur dibatalkan setelah disetujui | Ditolak; pesan menyebut status retur |
| Retur dibatalkan tanpa alasan | Ditolak; pesan menyebut alasan wajib diisi |

Teks pesan final mengikuti implementasi; yang diikat adalah isi informasi pesan.

## Success

- Stok bahan bertambah tepat sebesar qty lulus × harga PO, tidak lebih.
- Setiap QC lulus punya satu jurnal yang balance.
- Barang gagal tidak terhitung tersedia di laporan stok.
- Retur tidak mengubah stok, jurnal, atau utang.

## Edge cases (optional)

- QC lulus sebagian per baris (R-01): sisa qty gagal menjadi barang terpisah.
- QC dicatat dua kali bersamaan (satu ditolak, AC-10).
- Retur untuk sebagian qty gagal, lalu sisanya diretur kemudian (R-05).

## Decision references (optional)

- `EPIC-PG` aturan mengikat: barang masuk stok setelah QC lulus.
- `D-06`, `D-07`, `D-08`, `D-10`, `D-13`, `D-25`, `D-33`, `D-35`, `D-36`, `D-41`, `D-43`, `D-44`, `D-46`, `D-48`, `D-49`.
- Pertanyaan dan jawabannya: lihat `00-discussion.md`.

## Catatan serah terima

Requirement ini mengikat perilaku dan bukti. Akun jurnal QC lulus sudah ditetapkan (D-41, D-44). Angka lain yang belum ada di sumber tidak boleh diisi dari asumsi. Desain kontrak ada di `04-design-contract.md` (status `Proposed`). Baris matriks izin untuk pengajuan dan pengeluaran retur diusulkan di `03-readiness-review.md`; matriks sendiri di luar folder item.
