---
id: PG-002
slug: permintaan-pembelian
title: Permintaan pembelian dari Gudang dan Produksi
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset # graph (D-03); bukan urutan serial
type: feature
req_status: specified
delivery_status: in_progress
priority: P0 # usulan dari analisis-sia §5.3; belum dikonfirmasi
size: M # usulan agen; belum disetujui
depends_on:
  - C-011
  - C-013
blocks:
  - PG-003
  - PG-004
owner_role: pemilik track PG-B (belum ditetapkan)
package: docs/product/items/PG-002-permintaan-pembelian
---

# PG-002 — Permintaan pembelian dari Gudang dan Produksi

## Masalah

Kebutuhan barang dari Gudang dan Produksi belum punya dokumen permintaan yang bisa ditelusuri ke pengaju, barangnya, dan statusnya. Tanpa dokumen itu, Purchasing tidak punya antrean yang sah untuk diproses, dan tidak ada jejak siapa yang meminta apa.

## Outcome

Gudang atau Produksi dapat mengajukan permintaan pembelian berisi daftar barang, qty, satuan, dan tanggal butuh. Permintaan tersimpan dengan nomor dokumen dan status awal `DIAJUKAN`. Purchasing melihat antrean permintaan yang sudah diajukan dan bisa mengembalikannya untuk revisi atau meneruskannya untuk persetujuan (`PG-003`). Pengaju dapat membatalkan permintaannya sebelum PO terbit, dengan alasan tertulis.

## Aktor

| Aktor | Peran |
|---|---|
| Gudang | mengajukan permintaan untuk kebutuhan barang gudang (`D-33`, "Ajukan PR") |
| Produksi | mengajukan permintaan untuk kebutuhan bahan produksi (`D-33`, "Ajukan PR") |
| Purchasing | memeriksa permintaan, meneruskan atau mengembalikannya (`D-33`, "Periksa PR") |
| Pemohon | pengaju yang membatalkan atau merevisi permintaannya sendiri (`D-48`) |
| Sistem | memberi nomor dokumen dari core, mencatat riwayat, dan menolak aksi di luar aturan status |

## Cakupan

### Termasuk

- Form pengajuan permintaan dengan baris barang: produk, qty, satuan. Produk dan satuan diambil dari master `C-011` (`D-38`).
- Keterangan permintaan, alasan kebutuhan, dan tanggal butuh (`LAPORAN_PENGERJAAN_PROYEK.txt` KF-PG02, `waktu kebutuhan`).
- Gudang tujuan: tampil hanya bila ada lebih dari satu gudang (`D-52`).
- Nomor dokumen dan riwayat awal dari core dokumen (`D-50`).
- Antrean permintaan untuk Purchasing.
- Referensi opsional perintah produksi untuk permintaan dari Produksi (`[USULAN-AGEN]` Q-04). Validasi keberadaan menunggu `PR-002`.
- Pembatalan oleh pemohon dengan alasan wajib, sebelum PO terbit (`D-48`).
- Revisi sukarela oleh pemohon (`D-48`, `[USULAN-AGEN]` Q-08).

### Tidak termasuk

- Review dan approval permintaan (`PG-003`).
- Pemilihan pemasok dan perbandingan harga (`PG-004`). PR tidak memuat data pemasok (`LAPORAN_PENGERJAAN_PROYEK.txt`, langkah 3).
- Purchase order (`PG-005`).
- Perintah produksi dan kebutuhan bahan dari siklus Produksi (`PR-002` dan `PR-003`).
- Tabel dan aturan status permintaan. Keduanya berada di `C-013` (`D-05`); item ini hanya memakainya.
- Prioritas permintaan (`[USULAN-AGEN]` Q-06: tidak ada di v0).

## Status dan transisi

Daftar status mengikuti state machine `D-46` (`diagram-sia-lengkap.md` §5.2). Transisi tambahan dari `D-48` ditandai `[USULAN-AGEN]` sesuai `00-discussion.md`.

| Dari | Ke | Pemicu | Siapa | Catatan |
|---|---|---|---|---|
| (awal) | `DIAJUKAN` | pengajuan | Gudang, Produksi | masuk antrean Purchasing |
| `DIAJUKAN` | `REVISI` | dikembalikan | Purchasing | ada catatan perbaikan (`D-46`) |
| `REVISI` | `DIAJUKAN` | diajukan ulang | pemohon | (`D-46`) |
| `DIAJUKAN` | `MENUNGGU_PERSETUJUAN` | diperiksa dan diteruskan | Purchasing | lanjut ke `PG-003` (`D-46`) |
| `DIAJUKAN`, `REVISI`, `MENUNGGU_PERSETUJUAN`, `DISETUJUI`, `PEMASOK_DITETAPKAN` | `DIBATALKAN` | dibatalkan dengan alasan | pemohon | `D-48`; sebelum PO terbit `[USULAN-AGEN]` |
| `MENUNGGU_PERSETUJUAN`, `DISETUJUI` | `DIAJUKAN` | revisi sukarela oleh pemohon | pemohon | approval gugur dan diulang dari awal (`D-48`) `[USULAN-AGEN]` |

Catatan:
- Baris dan keterangan dapat diedit saat status `DIAJUKAN` atau `REVISI` tanpa mengubah status. Kolom audit (`updated_by`, `updated_at`) tercatat (`D-32`).
- `DITOLAK` (dari `PG-003`) dan `DIBATALKAN` bersifat final.
- Status `DISETUJUI` dan `DITOLAK` dijelaskan di `PG-003`. Status `PEMASOK_DITETAPKAN` dijelaskan di `PG-004`.
- `DRAFT` dan `DIPERIKSA` dari `analisis-sia.md` §2.3 tidak ada di daftar terkunci (`D-46`).
- Setiap perubahan status menulis baris `riwayat_status` (`D-08`) dengan aktor dan waktu.

Jalur gagal:
- Pembatalan oleh pengguna selain pemohon: ditolak.
- Pembatalan setelah PO terbit (status `DITERBITKAN` atau lebih lanjut): ditolak. Koreksi lewat pembatalan PO (`PG-005`) lalu permintaan baru.
- Pembatalan atau revisi dengan status yang sudah berubah oleh pengguna lain: ditolak dengan pesan untuk memuat ulang.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Permintaan tanpa baris barang | Ditolak dengan pesan "Permintaan harus memuat minimal satu barang" `[USULAN]` |
| Qty nol atau negatif | Ditolak dengan pesan "Qty harus lebih dari 0" `[USULAN]` |
| Produk tidak ada di master | Ditolak dengan pesan "Produk tidak ditemukan" `[USULAN]` |
| Satuan tidak cocok dengan produk | Perilaku mengikuti aturan satuan dan konversi di spec `C-011` |
| Tanggal butuh kosong | Ditolak dengan pesan "Tanggal butuh wajib diisi" `[USULAN]` |
| Gudang tujuan kosong padahal ada lebih dari satu gudang | Ditolak dengan pesan "Pilih gudang tujuan" `[USULAN]` (`D-52`) |
| Pengguna tanpa izin mengajukan | Ditolak dengan pesan "Anda tidak punya izin mengajukan permintaan pembelian" `[USULAN]`. Izin sesuai `D-33` (Gudang, Produksi) |
| Pembatalan tanpa alasan | Ditolak dengan pesan "Alasan pembatalan wajib diisi" `[USULAN]` (`D-48`) |
| Pembatalan atau revisi oleh bukan pemohon | Ditolak dengan pesan "Hanya pemohon yang dapat membatalkan atau merevisi permintaan ini" `[USULAN]` (`D-48`) |
| Pembatalan setelah PO terbit | Ditolak dengan pesan "Permintaan sudah menjadi PO. Batalkan PO lebih dulu" `[USULAN]` |

## Batasan

- Pengajuan permintaan tidak mengubah stok dan tidak membuat jurnal. Item ini tidak memposting apa pun, sehingga akun debit dan kredit tidak berlaku.
- Pengaju diambil dari sesi, bukan dari form (`ARCH-001` BOUNDARY-02).
- Dokumen tidak dihapus (`[USULAN]` §8.2 #9; `D-48` membatalkan, bukan menghapus).
- Permintaan yang ditolak atau dibatalkan tidak bisa menjadi PO (`analisis-sia.md` §8.1, `[SUMBER]`). Aturan ini ditegakkan di `PG-005`.
- Penomoran lewat `core/dokumen` (`ARCH-05`), format `D-50`. Item tidak menghitung nomor sendiri.
- Revisi sukarela setelah persetujuan menggugurkan approval (`D-48`).
- Pemisahan tugas: pemohon tidak boleh menyetujui permintaannya sendiri (`D-42`, `D-48`; ditegakkan di `PG-003`).

## Dependensi

- `PG-001` (backlog `depends on`). Dependensi dipertahankan sesuai backlog; sumber tidak mendukung alasannya (`[USULAN-AGEN]` Q-03).
- `C-013` (backlog `depends on`): tabel dan aturan status permintaan. Item ini memblokir `PG-002`.
- `C-011` (backlog `depends on`): produk dan satuan (`D-38`).
- Gate fondasi `FND-001` sampai `FND-006`. `FND-002` sampai `FND-006` masih `specified` (belum `done`).
- `FND-007` (UI kit: tabel, form, badge, dialog): item ini memakai tabel antrean dan form. Belum tercantum di `depends on` backlog (lihat `03-readiness-review.md`).

## Yang membuka jalan

- `PG-003` review dan approval (backlog `depends on` `PG-002`).
- `PG-004` pemilihan pemasok (backlog `depends on` `PG-002`).

## Catatan serah terima

Status final mengikuti `D-46` dan transisi `D-48`. Kolom referensi produksi mengikuti `[USULAN-AGEN]` Q-04 (spec, bersama track Produksi). Nama tabel dan mekanisme implementasi mengikuti domain implementasi.
