---
id: PR-004
slug: pemakaian-bahan-dan-wip
title: Pemakaian bahan dan WIP
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
  - PR-003
blocks:
  - PR-005
  - PR-006
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-004-pemakaian-bahan-dan-wip
---

# PR-004 — Pemakaian bahan dan WIP

## Masalah

Bahan yang sudah dikeluarkan dari gudang ke lantai produksi belum tercatat per perintah produksi. Stok di sistem tidak sesuai kenyataan, dan selisih pemakaian dari rencana tidak terlihat.

## Outcome

Bahan keluar untuk satu WO tercatat sebagai pengeluaran dari gudang: saldo bahan turun, nilai WIP untuk WO naik. Produksi mengonfirmasi pemakaian, sisa, dan scrap; sisa kembali ke gudang; selisih terhadap rencana terlihat.

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Gudang | mencatat bahan keluar dari gudang sumber | `D-33` |
| Produksi | mengonfirmasi terpakai, sisa, dan scrap | `D-33` |
| Sistem | menulis mutasi lewat `core/inventory` dan jurnal lewat `core/ledger`; mencatat status WO | `D-06`, `D-07` |

Pemisahan tugas: Gudang mencatat keluar, Produksi mengonfirmasi pemakaian. Keduanya tidak menjadi satu aksi.

## Cakupan

### Termasuk

- Mencatat bahan keluar untuk WO sebagai mutasi keluar per komponen.
- Pemakaian pertama mengubah WO ke `BERJALAN`.
- Konfirmasi pemakaian: terpakai, sisa, dan scrap (jumlahnya harus sama dengan qty keluar).
- Sisa kembali ke gudang sebagai mutasi masuk.
- Selisih rencana dan aktual per komponen, dengan penanda bila di luar toleransi.
- Jurnal bahan keluar dan sisa kembali.

### Di luar cakupan

- Hasil produksi dan QC (`PR-005`).
- Pembebanan TKL dan overhead, HPP (`PR-006`).
- Perhitungan kebutuhan dan permintaan (`PR-003`).
- Stock opname dan transfer antar gudang (`FND-005`, `D-52`).

## Constraints & invariants

- Mutasi stok hanya lewat `core/inventory` (`ARCH-04`, `D-06`).
- `saldo_stok` di-update dalam transaksi yang sama dengan mutasi (`D-06`).
- Valuasi harga rata-rata bergerak (`D-10`).
- Tidak ada mutasi dengan tanggal mendahului mutasi terakhir (`ARCH-001` `PRE-03`).
- Stok tidak boleh negatif (`UC-PR09`).
- Jurnal hanya lewat `postJournal()` (`D-07`), langsung diposting, tidak bisa diubah (`D-43`).

## Status dan transisi

| Kejadian | Efek angka | Diubah oleh | Jejak |
|---|---|---|---|
| Bahan keluar untuk WO | stok bahan turun; WIP naik sebesar nilai keluar | Gudang | mutasi keluar, jurnal |
| Pemakaian pertama dicatat | WO `BAHAN_CUKUP` atau `BAHAN_SIAP` → `BERJALAN` (`D-46` §5.3) | sistem | riwayat status |
| Pemakaian dicatat dari status `REWORK` | tidak mengubah status WO; bahan tambahan rework (`PR-005` Q-04) | Gudang, Produksi | mutasi, jurnal |
| Konfirmasi pemakaian | terpakai + sisa + scrap = qty keluar; selisih dihitung | Produksi | baris konfirmasi |
| Sisa dikonfirmasi | stok bahan naik sebesar qty sisa; WIP turun sebesar nilai sisa | Produksi (konfirmasi), sistem (mutasi) | mutasi masuk, jurnal |
| Scrap dikonfirmasi | tidak ada mutasi tambahan; nilai tetap di WIP | Produksi | baris konfirmasi |

Aturan (`[USULAN-AGEN]`, `00-discussion.md`):

- Konfirmasi pemakaian wajib selesai (terpakai + sisa + scrap = keluar) sebelum WO dapat berpindah ke `HASIL_DICATAT`.
- Sisa dinilai pada harga per unit saat keluar untuk WO itu, bukan harga rata-rata baru.
- Scrap tidak membuat mutasi tambahan dan tidak punya nilai jual.

### Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| Qty keluar nol atau negatif | "Jumlah keluar harus lebih dari nol." | tolak; tidak ada mutasi |
| Stok tidak cukup | "Stok {bahan} di {gudang} tidak cukup: tersedia {x}, diminta {y}. Pemakaian tidak dicatat." | tolak; saldo tidak berubah |
| Tanggal mendahului mutasi terakhir | "Tanggal mutasi tidak boleh sebelum mutasi terakhir ({tanggal})." | tolak |
| WO bukan `BAHAN_CUKUP`, `BAHAN_SIAP`, atau `REWORK` | "Bahan hanya bisa dikeluarkan saat perintah berstatus BAHAN_CUKUP, BAHAN_SIAP, atau REWORK (sekarang: {status})." | tolak |
| Terpakai + sisa + scrap ≠ qty keluar | "Jumlah terpakai, sisa, dan scrap ({x}) harus sama dengan jumlah keluar ({y})." | konfirmasi ditolak |
| Sisa lebih besar dari qty keluar yang belum dikonfirmasi | "Sisa tidak boleh melebihi jumlah keluar yang belum dikonfirmasi." | konfirmasi ditolak |

## Perhitungan

- Nilai keluar per baris = qty keluar × harga rata-rata saat keluar (`D-10`).
- Nilai sisa per baris = qty sisa × harga per unit saat keluar untuk baris itu.
- Selisih per komponen = (keluar − sisa) − kebutuhan standar untuk jumlah diproses (`BOM` × jumlah diproses).
- Selisih dianggap wajar bila persentase selisih tidak melebihi `toleransi_scrap` pada versi BOM WO. Di luar itu ditandai "perlu investigasi". Nilai toleransi mengikuti `D-51` (mekanisme berversi).

## Jurnal

Akun dipanggil lewat peran (`D-35`); nomor di konfigurasi.

| Kejadian | Debit | Kredit | Nilai |
|---|---|---|---|
| Bahan keluar untuk WO | `barang_dalam_proses` | `persediaan_bahan` | qty keluar × harga per unit |
| Sisa kembali | `persediaan_bahan` | `barang_dalam_proses` | qty sisa × harga per unit saat keluar |
| Scrap | — | — | tidak ada jurnal tambahan; nilai tetap di WIP |

Setiap jurnal menyimpan jenis transaksi asal (`mutasi keluar` atau `mutasi masuk`), nomor transaksi, dan pemicunya (`D-43`).

## Success

- Gudang bisa mencatat bahan keluar untuk satu WO dari UI; saldo bahan dan WIP berubah sesuai.
- Produksi bisa mengonfirmasi pemakaian; selisih tampil di detail WO.

## Edge cases

- Bahan keluar lebih dari kebutuhan: diperbolehkan, selisih ditandai (`[USULAN-AGEN]`).
- Bahan dikeluarkan dua kali untuk WO yang sama: diperbolehkan selama stok cukup.
- Konfirmasi dilakukan setelah sebagian sisa sudah dikembalikan: tidak diperbolehkan; konfirmasi harus lengkap.

## Decision references

- `D-06`, `D-07`, `D-08`, `D-10`, `D-33`, `D-35`, `D-41`, `D-43`, `D-44` (4), `D-46`, `D-48`, `D-50`, `D-51`, `D-52`, `ARCH-04`.
- `docs/product/reference/analisis-sia.md` §3.2, §6.5, §6.7, §7.5. Referensi, bukan normatif.
