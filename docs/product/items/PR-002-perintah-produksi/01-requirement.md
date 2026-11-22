---
id: PR-002
slug: perintah-produksi
title: Perintah produksi
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
  - FND-004
  - PR-001
blocks:
  - PR-003
  - PR-005
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-002-perintah-produksi
---

# PR-002 — Perintah produksi

## Masalah

Produksi belum punya dokumen yang mewakili satu rencana produksi: produk apa, berapa target, kapan, dan memakai resep yang mana. Tanpa dokumen ini, bahan, hasil, dan HPP tidak punya induk yang bisa ditelusuri.

## Outcome

Pengguna Produksi bisa membuat perintah produksi (WO) untuk satu produk dengan target qty dan tanggal, memakai satu versi BOM, dan melihat statusnya. Setiap perubahan status tercatat di riwayat dokumen.

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Produksi | membuat WO; mengubah target dan tanggal selama `DIRENCANAKAN`; membatalkan sesuai batas status | `D-33` (buat), `D-48` (pemohon membatalkan), `[USULAN-AGEN]` (ubah) |
| Sistem | memberi nomor lewat `core/dokumen`; mencatat riwayat | `D-08`, `ARCH-05` |
| Gudang, QC, Purchasing, Manajemen | mengubah status lewat item lain (`PR-003`, `PR-004`, `PR-005`) | hak tiap item |

Pemisahan tugas: pemohon tidak menyetujui WO-nya sendiri (`D-48`). WO tidak punya langkah approval (`D-46` Q-03).

## Cakupan

### Termasuk

- Membuat WO untuk satu produk dengan target qty, `tgl_target_selesai`, gudang sumber (default gudang utama, `D-52`), dan satu versi BOM.
- Melihat daftar WO dan detail WO, termasuk status dan riwayat status.
- Mengubah target qty, tanggal, dan gudang saat `DIRENCANAKAN`.
- Membatalkan WO sesuai batas status di bawah.

### Di luar cakupan

- Hitung kebutuhan bahan dan permintaan bahan (`PR-003`).
- Pemakaian bahan dan mutasi stok (`PR-004`).
- Hasil produksi dan QC (`PR-005`).
- HPP dan biaya (`PR-006`).
- Pesanan penjualan dan alokasi stok (`00-discussion.md` Q-02).
- Approval permintaan bahan dan PO (`C-013`, track PG).

## Constraints & invariants

- WO tidak dihapus (`analisis-sia.md` §7.1 poin 3).
- Setiap perubahan status masuk `riwayat_status` (`D-08`).
- Nomor WO dibuat oleh `core/dokumen` (`ARCH-05`) dengan format `D-50`.
- WO memegang versi BOM yang dipilih; perubahan BOM tidak mengubah WO lama (`EPIC-PR` gate 4).
- Audit kolom: `created_by`, `created_at`, `updated_by`, `updated_at` (`D-32`).

## Status dan transisi

Mengikuti state machine perintah produksi (`D-46`, `diagram-sia-lengkap.md` §5.3). Batal tambahan mengikuti `D-48` dan dibatasi sesuai tabel di bawah.

| Dari | Ke | Pelaku | Pemicu |
|---|---|---|---|
| (baru) | `DIRENCANAKAN` | Produksi | WO dibuat |
| `DIRENCANAKAN` | `CEK_BAHAN` | Gudang | cek ketersediaan dimulai (`PR-003`) |
| `CEK_BAHAN` | `BAHAN_CUKUP` | Sistem | stok cukup |
| `CEK_BAHAN` | `BAHAN_KURANG` | Sistem | stok kurang |
| `BAHAN_KURANG` | `MENUNGGU_PEMBELIAN` | Sistem (dari `PR-003`) | permintaan disetujui Manajemen |
| `BAHAN_KURANG` | `DIBATALKAN` | Sistem (dari `PR-003`) | permintaan ditolak |
| `MENUNGGU_PEMBELIAN` | `BAHAN_SIAP` | Gudang | bahan diterima (`PG-006`) |
| `BAHAN_CUKUP` / `BAHAN_SIAP` | `BERJALAN` | Gudang | bahan dikeluarkan (`PR-004`) |
| `BERJALAN` | `HASIL_DICATAT` | Produksi | hasil dicatat (`PR-005`) |
| `HASIL_DICATAT` | `QC_PASSED` / `REWORK` / `REJECTED` | QC | keputusan QC (`PR-005`) |
| `REWORK` | `HASIL_DICATAT` | Produksi | selesai diperbaiki dan dicatat ulang |
| `QC_PASSED` | `SELESAI` | Gudang | barang jadi lulus diterima (`PR-005`) |
| `DIRENCANAKAN`, `CEK_BAHAN`, `BAHAN_CUKUP` | `DIBATALKAN` | Produksi (`D-48`) | pembatalan dengan alasan wajib, `[USULAN-AGEN]` |

Batas batal (`[USULAN-AGEN]`, `00-discussion.md` Q-04): tidak ada batal dari `MENUNGGU_PEMBELIAN`, `BAHAN_SIAP`, `BERJALAN`, atau setelahnya. Akibatnya tidak ada transisi batal yang menyentuh stok. `REJECTED` dan `SELESAI` adalah penutup dokumen.

Pertanyaan ubah dan batal sudah dijawab; nama status final mengikuti diagram §5.3.

### Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| Target qty nol atau negatif | "Target jumlah harus lebih dari nol." | form menolak |
| Produk tanpa versi BOM berlaku | "Produk \"{nama}\" belum punya versi BOM yang berlaku. Buat BOM dulu di menu BOM." | form menolak |
| `tgl_target_selesai` sebelum tanggal perintah | "Tanggal target selesai tidak boleh sebelum tanggal perintah dibuat." | form menolak |
| Ubah target, tanggal, atau gudang setelah `DIRENCANAKAN` | "Perintah sudah diproses. Data tidak bisa diubah pada status {status}." | ditolak |
| Batal tanpa alasan | "Alasan pembatalan wajib diisi." | ditolak |
| Batal dari status di luar batas | "Perintah yang sudah diproses tidak bisa dibatalkan. Catat hasilnya lewat menu hasil produksi." | ditolak |
| Transisi di luar tabel | "Perintah tidak bisa berpindah dari {dari} ke {ke}." | ditolak, status tidak berubah |

## Success

- Produksi bisa membuat WO dari UI dan melihat nomornya.
- Setiap perubahan status tampil di riwayat dengan aktor dan waktu.

## Edge cases

- Dua WO untuk produk yang sama pada tanggal yang sama: diperbolehkan `[USULAN-AGEN]`; nomornya berbeda karena `URUT`.
- WO `BAHAN_KURANG` yang permintaannya ditolak menjadi `DIBATALKAN` lewat `PR-003`; Produksi membuat WO baru bila kebutuhan masih ada.

## Decision references

- `D-06`, `D-08`, `D-25`, `D-31`, `D-32`, `D-33`, `D-46`, `D-48`, `D-50`, `D-52`.
- `Makalah_Siklus_Produksi.txt` UC-PR02 dan kamus `perintah_produksi`. Dipakai hanya bila tidak bertentangan dengan `D-46`.
- `docs/product/epics/EPIC-PR.md`, gate 4.
- `docs/product/reference/analisis-sia.md` §5.4, §6.3, §7.1. Referensi, bukan normatif.
