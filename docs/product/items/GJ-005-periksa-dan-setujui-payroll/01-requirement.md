---
id: GJ-005
slug: periksa-dan-setujui-payroll
title: Periksa dan setujui payroll, lalu kunci
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 5); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P0 (usulan agen, belum disetujui)
size: M # usulan agen, belum disetujui
depends_on:
  - FND-004
  - GJ-004
blocks:
  - GJ-006
owner_role: unset # Decision needed: pemilik track GJ-C
package: docs/product/items/GJ-005-periksa-dan-setujui-payroll
---

# GJ-005 — Periksa dan setujui payroll, lalu kunci

## Masalah

Draft payroll belum boleh dibayar sebelum angkanya diperiksa, dan belum boleh berubah setelah disetujui. Tanpa kunci, angka yang sudah disetujui bisa berubah.

## Outcome

Draft yang sudah dihitung (GJ-004) diperiksa oleh Akuntansi, lalu disetujui oleh Direksi. Persetujuan mengunci draft dan membuat jurnal akrual gaji (`D-49`, dibuat lewat service core di `GJ-007`). Draft yang dikembalikan kembali ke HR dengan alasan.

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| Akuntansi | Memeriksa angka draft; dapat mengembalikan dengan alasan | `D-33`; `D-46`; R-03 |
| Finance | Cek dana dan bayar (di GJ-006); tidak mengubah status di item ini | `D-33`; R-01, R-02 |
| Direksi | Menyetujui dan mengunci; dapat mengembalikan dengan alasan | `D-33`; `D-46`; R-03 |
| HR | Menghitung draft (GJ-004); tidak boleh memeriksa atau menyetujui draft yang dihitungnya | `D-48` |

## Siapa boleh melihat (data pribadi)

| Data | Baca |
|---|---|
| Rincian draft per karyawan | Accounting, HR |
| Ringkasan total dan jumlah karyawan | Accounting, HR, Direksi |

Baris ini `[USULAN-AGEN]` (R-08).

## Cakupan

### Termasuk

- Pemeriksaan draft oleh Akuntansi dengan status `DIPERIKSA`.
- Persetujuan oleh Direksi dengan status `DISETUJUI`, yang juga mengunci draft.
- Jurnal akrual saat `DISETUJUI` dibuat lewat service core (`D-49`); item ini memicu, `GJ-007` menyusun jurnalnya.
- Pengembalian `DIPERIKSA` → `REVISI` → `DRAFT_TERHITUNG` oleh Accounting atau Direksi, dengan alasan wajib.
- Catatan pemeriksaan dan persetujuan di `riwayat_status`.

### Tidak termasuk

- Hitungan draft (`GJ-004`).
- Pembayaran (`GJ-006`).
- Penyusunan jurnal akrual dan jurnal pembayaran (`GJ-007`).
- Buka kunci draft (tidak ada di versi awal, R-05).

## Status dan transisi

Status (`D-46`, tanpa status baru `D-47`):

| Keadaan | Transisi |
|---|---|
| `DRAFT_TERHITUNG` | → `DIPERIKSA` oleh Akuntansi |
| `DIPERIKSA` | → `DISETUJUI` oleh Direksi; mengunci draft dan memicu jurnal akrual dalam satu transaksi (`D-43`) |
| `DIPERIKSA` | → `REVISI` oleh Akuntansi atau Direksi dengan alasan wajib (`D-48`) → `DRAFT_TERHITUNG` saat HR menghitung ulang (GJ-004) |
| `DISETUJUI` | Dikunci. Tidak ada transisi keluar. Koreksi hanya lewat jurnal pembalik (`D-35`, `D-43`) |

Setiap transisi tercatat di `riwayat_status`, dengan aktor, waktu, dan catatan. Catatan wajib untuk `REVISI`.

Persetujuan ditolak bila periode akuntansi tempat jurnal akrual dibuat sudah tertutup (R-07).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Direksi menyetujui draft yang belum `DIPERIKSA` | Ditolak; pesan menyebut pemeriksaan belum dilakukan | `D-46`; `[USULAN]` |
| Pengguna selain Direksi mencoba menyetujui | Ditolak; pesan menyebut peran yang berwenang | `D-33` |
| Penghitung draft mencoba memeriksa atau menyetujui draft yang dihitungnya | Ditolak; pesan menyebut pemohon tidak boleh menyetujui | `D-48` |
| Perubahan pada draft `DISETUJUI` | Ditolak; pesan menyebut draft sudah dikunci | `[SUMBER]` §8.1 |
| Pengembalian tanpa alasan | Ditolak; pesan menyebut alasan wajib | `D-48` |
| Periode akuntansi tertutup saat persetujuan | Ditolak; pesan menyebut periode akuntansi tertutup | `D-43`; R-07 |

## Batasan

- Kunci payroll terpisah dari tutup buku; persetujuan dibatasi periode akuntansi yang terbuka (R-07).
- Data draft adalah data pribadi (R-08).
- Jurnal tidak ditulis langsung oleh modul (`D-07`).

## Dependensi

- `GJ-004`: draft yang sudah dihitung.
- `FND-004`: approval berjenjang (satu mesin, `D-37`) dan status dokumen.
- `FND-006`: service `postJournal()` dan periode akuntansi (untuk jurnal akrual).
- Gate fondasi.

## Yang membuka jalan

- `GJ-006` (pembayaran hanya untuk draft `DISETUJUI`).

## Catatan serah terima

Matriks v0 (`D-33`) memberi Finance "Cek dana & bayar". R-01 dan R-02 terjawab (`D-46`): cek dana bukan status di GJ-005. Jurnal akrual (`D-49`) disusun di `GJ-007`; GJ-005 hanya memicu lewat service core.
