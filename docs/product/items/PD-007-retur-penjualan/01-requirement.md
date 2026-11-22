---
id: PD-007
slug: retur-penjualan
title: Retur penjualan dan kredit memo
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P1
size: M
depends_on:
  - FND-005
  - PD-005
blocks:
  - PD-008
  - PD-009
owner_role: kelompok Pendapatan, track PD-C (orang belum ditetapkan)
package: docs/product/items/PD-007-retur-penjualan
---

# PD-007 — Retur penjualan dan kredit memo

## Masalah

Pelanggan mengembalikan barang yang sudah difakturkan, tetapi tidak ada dokumen retur. Piutang tetap menunjukkan tagihan penuh, dan stok tidak kembali.

## Outcome

Penjualan atau Gudang mencatat retur dari faktur pelanggan. Accounting menyetujui. QC memeriksa barang. Jika lulus, stok kembali ke gudang dan kredit memo mengurangi piutang dalam satu transaksi berjurnal.

## Aktor

| Aktor | Peran |
|---|---|
| Penjualan atau Gudang | mengajukan retur dari faktur; membatalkan retur yang belum disetujui (`D-49`, `D-48`) |
| Accounting | menyetujui atau menolak retur (`D-49`) |
| QC | mencatat hasil pemeriksaan barang retur (`D-33`, `[USULAN-AGEN]` `PQ-03`) |
| Pemohon | tidak boleh menyetujui retur sendiri (`D-48`) |

## Cakupan

### Termasuk

- Membuat retur dari faktur pelanggan (qty dan baris).
- Persetujuan oleh Accounting.
- Pemeriksaan QC; stok masuk hanya untuk qty lulus.
- Kredit memo yang mengurangi sisa faktur asal.
- Jurnal retur lewat `postJournal()`.
- Pembatalan retur yang belum diproses.

### Tidak termasuk

- Retur bahan ke pemasok (siklus Pengeluaran; `D-13`).
- Retur barang dari hasil produksi (siklus Produksi).
- Penerbitan faktur baru atas retur.
- Pengembalian dana tunai (belum didukung, `D-49`).
- Penyesuaian stok manual.

## States

| Dari | Ke | Oleh | Syarat | Efek |
|---|---|---|---|---|
| — | `DIAJUKAN` | Penjualan atau Gudang | faktur `DITERBITKAN`/`SEBAGIAN_LUNAS`/`LUNAS`; qty > 0; kumulatif ≤ qty dikirim per baris | tidak ada efek stok atau jurnal |
| `DIAJUKAN` | `DISETUJUI` | Accounting (bukan pengaju) | — | tidak ada efek stok atau jurnal |
| `DIAJUKAN` | `DITOLAK` | Accounting; alasan wajib | — | final |
| `DIAJUKAN` / `DISETUJUI` | `DIBATALKAN` | pengaju; alasan wajib | belum diproses QC | final |
| `DISETUJUI` | `SELESAI` | QC mencatat hasil lulus (qty lulus > 0) | qty lulus ≤ qty disetujui | stok masuk; kredit memo; jurnal (lihat di bawah) |
| `DISETUJUI` | `DITOLAK` | QC mencatat hasil gagal (qty lulus = 0); alasan wajib | — | tidak ada stok, tidak ada kredit memo |

Setiap transisi menulis `riwayat_status` dengan aktor dan waktu (`D-08`).

## Aturan saat QC lulus

Dalam satu transaksi:
1. Mutasi masuk sebesar qty lulus; nilai = qty lulus × harga rata saat retur (`D-10`, `[USULAN-AGEN]` `PQ-08`); `saldo_stok` diperbarui.
2. Kredit memo: DPP retur = qty lulus × harga baris faktur asal − diskon baris; PPN retur = DPP retur × tarif faktur asal; total = DPP + PPN. Total ≤ sisa faktur asal (`[USULAN-AGEN]` `PQ-02`).
3. Jurnal kredit memo dan jurnal pembalik HPP lewat `postJournal()`.

Selisih qty (disetujui vs lulus) tidak disesuaikan otomatis (`[USULAN-AGEN]` `PQ-04`).

## Jurnal (`D-44`, `D-43`, `D-41`)

- Kredit memo: Dr `penjualan` (DPP retur), Dr `ppn_keluaran` (PPN retur), Cr `piutang_usaha` (total).
- Pembalik HPP: Dr `persediaan_barang_jadi` (nilai stok masuk), Cr `hpp` (nilai stok masuk).

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Qty retur nol atau negatif | "Jumlah retur harus lebih dari nol." |
| Qty kumulatif melebihi qty dikirim | "Jumlah retur melebihi jumlah yang pernah dikirim untuk baris ini." |
| Retur tanpa faktur asal | "Retur harus merujuk faktur penjualan." |
| Alasan penolakan atau pembatalan kosong | "Alasan wajib diisi." |
| Persetujuan oleh pengaju | "Pemohon retur tidak dapat menyetujui returnya sendiri." |
| Persetujuan oleh pengguna selain Accounting | "Anda tidak berwenang menyetujui retur." |
| QC untuk retur yang belum disetujui | "Retur harus disetujui sebelum QC." |
| Qty lulus melebihi qty disetujui | "Qty lulus QC tidak boleh melebihi qty yang disetujui." |
| Nilai kredit memo melebihi sisa faktur asal | "Nilai retur melebihi sisa tagihan faktur asal. Pengembalian dana belum didukung." |
| Periode akuntansi terkunci saat QC lulus | "Periode {bulan} sudah ditutup. Retur tidak dapat diproses." |
| Batalkan retur yang sudah diproses QC | "Retur yang sudah diperiksa QC tidak dapat dibatalkan." |

## Batasan

- Jurnal hanya lewat `postJournal()` (`D-07`).
- Mutasi masuk hanya lewat `core/inventory` (`ARCH-04`).
- Modul tidak membaca tabel modul lain (`D-25`).
- Retur tidak dihapus (`D-48`).
- Koreksi periode tertutup lewat jurnal pembalik di periode berjalan (`D-44` (5)).

## Dependensi

- `PD-005` — faktur.
- `FND-005` — mutasi stok masuk dan valuasi.
- Gate fondasi `FND-001`–`FND-006` dan `FND-007`.

## Yang membuka jalan

- `PD-008` — jurnal retur.
- `PD-009` — laporan retur (neto retur pada penjualan).

## Catatan serah terima

Semua aturan persetujuan, QC, dan kredit memo ada di atas sebagai `[USULAN-AGEN]` atau keputusan terkunci; menunggu kunci koordinator. Baris matriks untuk "setujui retur" (Accounting) dan "catat QC retur" (QC) belum ada di `matriks-izin.md`; ditambahkan lewat `FND-003` sebagai revisi `D-33`.
