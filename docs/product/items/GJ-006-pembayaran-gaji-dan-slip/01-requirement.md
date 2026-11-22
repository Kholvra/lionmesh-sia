---
id: GJ-006
slug: pembayaran-gaji-dan-slip
title: Pembayaran gaji dan cetak slip
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 6); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P0 (usulan agen, belum disetujui)
size: M # usulan agen, belum disetujui
depends_on:
  - FND-006
  - GJ-005
blocks:
  - GJ-007
owner_role: unset # Decision needed: pemilik track GJ-D
package: docs/product/items/GJ-006-pembayaran-gaji-dan-slip
---

# GJ-006 — Pembayaran gaji dan cetak slip

## Masalah

Gaji yang sudah disetujui harus dibayar, dan pembayaran yang gagal tidak boleh tersembunyi. Karyawan tidak melihat slip digital, sehingga slip harus dicetak HR dan diserahkan.

## Outcome

Finance mencatat hasil transfer gaji untuk draft `DISETUJUI` per karyawan. Setiap karyawan berstatus `DIBAYAR` atau `GAGAL_TRANSFER`. Karyawan yang gagal bisa diulang dengan alasan. Bukti transfer tersimpan. HR mencetak slip per karyawan per periode untuk diserahkan.

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| Finance | Mengirim batch transfer, mencatat hasil, menyimpan bukti | `D-33`; `D-49` |
| HR | Mencetak dan menyerahkan slip; memperbaiki rekening yang bermasalah | `D-33`; `D-53` |
| Accounting | Membaca status dan bukti; jurnal di GJ-007 | `D-33` |
| Karyawan | Menerima slip cetak; tidak punya akses digital | `D-53` |

## Siapa boleh melihat (data pribadi)

| Data | Tulis | Baca |
|---|---|---|
| Rekening bank karyawan | HR | HR, Finance |
| Nominal bersih per karyawan dan status transfer | Finance | Finance, Accounting |
| Bukti transfer | Finance | Finance, Accounting |
| Slip per karyawan | HR (cetak) | HR |

Baris ini `[USULAN-AGEN]` (T-09). Direksi tidak membaca nominal per karyawan di item ini.

## Cakupan

### Termasuk

- Batch transfer gaji per periode untuk draft `DISETUJUI` (T-01, T-10).
- Pencatatan hasil per karyawan: `DIBAYAR` atau `GAGAL_TRANSFER`.
- Percobaan ulang untuk karyawan `GAGAL_TRANSFER`, dengan alasan (`D-49`).
- Bukti transfer tersimpan per batch dengan referensi per karyawan.
- Penundaan pembayaran untuk rekening yang tidak lengkap; daftar rekening bermasalah ditampilkan.
- Cetak slip per karyawan per periode, dan slip pengganti dengan alasan.

### Tidak termasuk

- Jurnal pembayaran dan jurnal akrual (`GJ-007`).
- Integrasi bank (menunggu konfirmasi; bentuk berkas mengikuti `DISC-002` bila perlu).
- Portal atau akses digital karyawan (`D-53`).
- Email slip (tidak ada di keputusan terkunci).

## Status dan transisi

Status (`D-46`, tanpa status baru `D-47`):

| Objek | Keadaan | Transisi |
|---|---|---|
| Draft (periode) | `DISETUJUI` | → `DIBAYAR` bila semua karyawan `DIBAYAR`; → `GAGAL_TRANSFER` bila ada karyawan `GAGAL_TRANSFER` |
| Karyawan (dalam batch) | `DIBAYAR` | Final. Tidak masuk batch ulang (INV-02) |
| Karyawan (dalam batch) | `GAGAL_TRANSFER` | → `DIBAYAR` lewat percobaan ulang dengan alasan (`D-49`) |
| Draft (periode) | `DIBAYAR` | → `DIPOSTING` setelah jurnal pembayaran semua karyawan dibuat (GJ-007; lihat J-03 di sana) |

Slip tidak punya status tersimpan (`D-47`). Jejak cetak disimpan sebagai baris slip dengan nomor, aktor, dan waktu cetak.

Setiap transisi tercatat di `riwayat_status`. Kegagalan tidak boleh tercatat sebagai `DIBAYAR`.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Pembayaran untuk draft yang belum `DISETUJUI` | Ditolak; pesan menyebut persetujuan belum ada | `D-46` |
| Batch untuk karyawan yang sudah `DIBAYAR` | Ditolak untuk karyawan itu; pesan menyebut sudah dibayar | `D-49`; INV-02 |
| Bukti transfer tidak ada untuk status `DIBAYAR` | Ditolak; pesan menyebut bukti wajib | `[SUMBER]` §8.1 |
| Percobaan ulang tanpa alasan | Ditolak; pesan menyebut alasan wajib | `D-49` |
| Karyawan tanpa rekening lengkap masuk batch | Karyawan tidak masuk batch; daftar rekening bermasalah tampil; pembayaran ditunda | makalah UC-GJ-08 |
| Dana tidak cukup | Batch tidak diproses; manajemen diberi tahu | `[USULAN]` catatan diagram GJ08 |
| Slip untuk karyawan yang belum `DIBAYAR` | Ditolak; pesan menyebut pembayaran belum tercatat | `[USULAN]` |
| Pencatat pembayaran sama dengan penghitung draft | Ditolak; pesan menyebut pemisahan tugas | `D-42` |
| Slip pengganti tanpa alasan | Ditolak; pesan menyebut alasan wajib | `[USULAN-AGEN]` T-08 |

## Batasan

- Data rekening dan nominal adalah data pribadi (T-09).
- Slip tidak bisa dibuka karyawan karena tidak ada akses digital (`D-53`).
- Tidak ada penulisan jurnal di item ini (`GJ-007`).

## Dependensi

- `GJ-005`: draft `DISETUJUI`.
- `FND-006`: ledger dan periode akuntansi.
- Gate fondasi.
- `FND-007`: primitive tabel batch dan daftar slip (T-11).

## Yang membuka jalan

- `GJ-007` (jurnal pembayaran dan laporan).

## Catatan serah terima

Jurnal pembayaran (kas turun) adalah tanggung jawab `GJ-007`, lewat `postJournal()` (`D-07`). Item ini tidak menulis jurnal. Pemicu jurnal pembayaran adalah hasil transfer `DIBAYAR` per karyawan (`D-49`).
