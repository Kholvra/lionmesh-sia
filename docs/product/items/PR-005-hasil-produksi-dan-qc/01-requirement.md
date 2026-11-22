---
id: PR-005
slug: hasil-produksi-dan-qc
title: Hasil produksi dan QC
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
  - FND-005
  - PR-002
  - PR-004
blocks:
  - PR-006
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-005-hasil-produksi-dan-qc
---

# PR-005 — Hasil produksi dan QC

## Masalah

Setelah bahan dipakai, perintah produksi menghasilkan barang lulus, barang rework, dan barang reject. Hasil ini belum tercatat per WO, barang jadi tidak punya dasar masuk gudang, dan biaya barang cacat tidak punya perlakuan.

## Outcome

Produksi mencatat jumlah hasil per WO. QC membagi hasil menjadi lulus, rework, dan reject. Reject dalam toleransi diserap ke barang baik; reject di atas toleransi tercatat sebagai kerugian produksi abnormal. Barang jadi yang lulus masuk gudang, nilai WIP turun, dan WO selesai.

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Produksi | mencatat jumlah hasil yang diproses | `D-33` |
| QC | membagi hasil menjadi lulus, rework, reject | `D-33` |
| Gudang | menerima barang jadi lulus | `D-33` |
| Sistem | menulis mutasi lewat `core/inventory`; menulis jurnal lewat `core/ledger` | `D-06`, `D-07` |

Pemisahan tugas: pencatat hasil (Produksi) tidak memeriksa hasil yang dicatatnya (`D-48`).

## Cakupan

### Termasuk

- Mencatat jumlah hasil diproses per WO.
- Keputusan QC membagi jumlah diproses menjadi lulus (L), rework (R), dan reject (J).
- Perhitungan reject yang diserap dan reject yang menjadi kerugian.
- Penerimaan barang jadi lulus oleh gudang: mutasi masuk, nilai WIP turun.
- Status WO `HASIL_DICATAT`, `QC_PASSED`, `REWORK`, `REJECTED`, `SELESAI` (`D-46`).
- Jurnal barang jadi dan kerugian produksi abnormal.

### Di luar cakupan

- Pembebanan TKL dan overhead, HPP final, dan biaya rework (`PR-006`).
- Retur produk jadi (tidak ada, `D-13`).
- Penjualan barang jadi (`PD-*`).

## Status dan transisi

| Dari | Ke | Pelaku | Pemicu |
|---|---|---|---|
| `BERJALAN` atau `REWORK` | `HASIL_DICATAT` | Produksi | jumlah hasil dicatat (`PR-004` konfirmasi pemakaian sudah lengkap) |
| `HASIL_DICATAT` | `REWORK` | QC | R > 0 |
| `HASIL_DICATAT` | `QC_PASSED` | QC | R = 0 dan L > 0 |
| `HASIL_DICATAT` | `REJECTED` | QC | L = 0 dan R = 0 |
| `REWORK` | `HASIL_DICATAT` | Produksi | rework selesai dan hasil dicatat ulang |
| `QC_PASSED` | `SELESAI` | Gudang | seluruh L sudah diterima |

`REJECTED` adalah terminal. Keputusan QC tidak bisa diubah; koreksi lewat dokumen baru (`D-48`, `analisis-sia.md` §7.1).

## Aturan keputusan QC

- Jumlah diproses (D) = L + R + J. Dicatat Produksi; dibagi oleh QC.
- Bila R > 0: WO `REWORK`. Lulus ditunda sampai WO kembali ke `QC_PASSED`.
- Bila L = 0 dan R = 0: WO `REJECTED`; seluruh saldo WIP WO dibukukan sebagai kerugian.
- Bila R = 0 dan L > 0: WO `QC_PASSED`. Kerugian dibukukan; nilai per unit baik ditetapkan.
- Kerugian produksi abnormal = max(0, J − toleransi persen × D) × biaya terserap per unit. Biaya terserap per unit = total biaya WO yang sudah dibebankan ÷ D (`D-51`(e), mekanisme berversi; nilai diverifikasi saat implementasi).
- Reject sama dengan atau di bawah toleransi diserap ke barang baik; tidak ada kerugian.
- Nilai per unit baik = (nilai WIP WO saat `QC_PASSED` − kerugian) ÷ L. Ditetapkan sekali.

## Behavior / rules

| Kejadian | Efek | Diubah oleh |
|---|---|---|
| Hasil dicatat | jumlah D tersimpan; WO `HASIL_DICATAT` | Produksi |
| QC memutuskan L, R, J | WO berpindah sesuai aturan; kerugian dibukukan bila ada | QC |
| Penerimaan barang jadi lulus | saldo barang jadi naik; WIP turun; sebagian diperbolehkan sampai L habis | Gudang |
| Seluruh L diterima | WO `SELESAI` | sistem |

## Jurnal

Akun dipanggil lewat peran (`D-35`); nomor di konfigurasi (`D-41`).

| Kejadian | Debit | Kredit | Nilai |
|---|---|---|---|
| Kerugian produksi abnormal dibukukan | `kerugian_produksi_abnormal` | `barang_dalam_proses` | nilai kerugian |
| Seluruh saldo WIP menjadi kerugian (`REJECTED`) | `kerugian_produksi_abnormal` | `barang_dalam_proses` | saldo WIP WO |
| Barang jadi lulus diterima | `persediaan_barang_jadi` | `barang_dalam_proses` | qty diterima × nilai per unit baik |

Setiap jurnal menyimpan jenis transaksi asal, nomor transaksi, dan pemicunya (`D-43`).

## Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| Jumlah hasil negatif | "Jumlah {lulus/rework/reject} tidak boleh negatif." | tolak |
| L + R + J tidak sama dengan jumlah diproses | "Lulus, rework, dan reject ({x}) harus sama dengan jumlah diproses ({y})." | tolak |
| Hasil dicatat saat WO tidak `BERJALAN` atau `REWORK` | "Hasil hanya bisa dicatat saat perintah berstatus BERJALAN atau REWORK (sekarang: {status})." | tolak |
| Keputusan QC oleh peran selain QC | "Hanya QC yang bisa memutuskan hasil." | tolak |
| Penerimaan barang belum lulus QC | "Barang belum lulus QC dan tidak bisa diterima gudang." | tolak |
| Penerimaan melebihi jumlah lulus yang belum diterima | "Jumlah diterima melebihi jumlah lulus QC ({sisa} tersisa)." | tolak |
| Reject melebihi toleransi | (tidak ditolak; dibukukan sebagai kerugian) | sesuai aturan |

## Success

- Produksi bisa mencatat hasil dan QC bisa memutuskan dari UI.
- Stok barang jadi bertambah hanya setelah QC lulus, dan nilai WIP turun sebesar nilai yang masuk barang jadi.

## Edge cases

- Reject tepat sama dengan batas toleransi: diserap (aturan "sama dengan atau di bawah", `D-51`(e)).
- Rework dan lulus dalam satu catatan: lulus ditunda sampai rework selesai (aturan R > 0).
- Semua reject: WO `REJECTED`; seluruh saldo WIP menjadi kerugian.

## Decision references

- `D-06`, `D-07`, `D-08`, `D-10`, `D-13`, `D-33`, `D-35`, `D-36`, `D-41`, `D-43`, `D-46`, `D-48`, `D-51`(e).
- `docs/product/epics/EPIC-PR.md`, gate selesai 3.
- `docs/product/reference/analisis-sia.md` §5.4, §6.5, §6.7, §9.1 G6. Referensi, bukan normatif.
