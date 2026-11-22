---
id: GJ-004
slug: hitung-payroll
title: Hitung draft payroll per periode
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 4); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P0 (usulan agen, belum disetujui)
size: L # usulan agen, belum disetujui; lihat risiko di 03
depends_on:
  - FND-002
  - GJ-003
blocks:
  - GJ-005
owner_role: unset # Decision needed: pemilik track GJ-C
package: docs/product/items/GJ-004-hitung-payroll
---

# GJ-004 — Hitung draft payroll per periode

## Masalah

Payroll perlu angka per karyawan dan total per periode. Angka itu harus berasal dari tabel tarif yang berversi, bukan dari kode, dan harus bisa dihitung ulang dengan hasil yang sama.

## Outcome

HR dapat menghitung draft payroll untuk satu periode `TERVALIDASI`. Draft menampilkan per karyawan: gaji pokok, tunjangan, uang lembur, potongan ketidakhadiran, BPJS, PPh 21, dan take-home pay (nominal bersih); serta total periode. Menghitung ulang pada data yang sama menghasilkan angka yang sama.

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| HR | Menjalankan hitungan dan mengoreksi komponen dengan alasan | `D-33`; `D-48` |
| Accounting | Memeriksa rincian dan konsistensi draft (di GJ-005) | `D-33` |
| Finance | Melihat nominal bersih per karyawan untuk transfer (di GJ-006) | `D-33` |
| Direksi | Melihat ringkasan total dan jumlah karyawan (di GJ-005) | `D-33`; UC-GJ-07 |
| Karyawan | Tidak terlibat | `D-53` |

## Siapa boleh melihat (data pribadi)

| Data | Tulis | Baca |
|---|---|---|
| Draft per karyawan (rincian komponen) | HR (hitung dan override) | HR, Accounting |
| Nominal bersih per karyawan | HR | HR, Accounting, Finance |
| Ringkasan total dan jumlah karyawan | — | HR, Accounting, Direksi, Finance |

Baris ini `[USULAN-AGEN]` (P-13).

## Cakupan

### Termasuk

- Hitung draft per periode yang `TERVALIDASI`.
- Komponen penambah: gaji pokok (dari histori), tunjangan tetap, tunjangan kehadiran, uang lembur.
- Komponen pengurang: potongan ketidakhadiran, BPJS Ketenagakerjaan, BPJS Kesehatan, PPh 21 (lookup TER bulanan).
- Dasar hitung lembur dan BPJS: gaji pokok + tunjangan tetap (`D-51(b)`).
- Prorata hari kerja untuk karyawan masuk atau keluar di tengah periode (`D-51(b)`).
- Pembulatan per komponen per karyawan ke rupiah terdekat; selisih ke akun selisih pembulatan (`D-51(b)`).
- PPh 21 bulan terakhir masa pajak ditandai "perlu penyesuaian tahunan"; input manual dengan alasan (`D-51(b)`).
- Rincian per karyawan dan total per periode.
- Koreksi manual komponen dengan alasan (`D-48`).
- Status `DRAFT_TERHITUNG`, dan `REVISI` bila dikembalikan.

### Tidak termasuk

- Pemeriksaan dan persetujuan (`GJ-005`).
- Pembayaran dan slip (`GJ-006`).
- Jurnal (`GJ-007`).
- Mengisi tabel tarif: itu proses data (tech lead, `D-33`), bukan fitur item ini.
- Penyesuaian tahunan PPh 21 penuh (di luar versi awal).

## Status dan transisi

Status (`D-46`, tanpa status baru `D-47`):

| Keadaan | Transisi |
|---|---|
| (tidak ada draft) | → `DRAFT_TERHITUNG` saat hitungan berhasil |
| `DRAFT_TERHITUNG` | → `DRAFT_TERHITUNG` saat dihitung ulang (menimpa, P-07); → `DIPERIKSA` di GJ-005 |
| `REVISI` | → `DRAFT_TERHITUNG` saat dihitung ulang setelah dikembalikan (GJ-005) |

Kegagalan di tengah hitungan tidak boleh menyimpan draft parsial (lihat 04). Transisi tercatat di `riwayat_status`.

Draft yang sudah `DISETUJUI` tidak bisa dihitung ulang (GJ-005).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Periode belum `TERVALIDASI` | Ditolak; pesan menyebut validasi supervisor belum dilakukan | `[SUMBER]` §8.1 |
| Tarif periode tidak ditemukan di tabel berversi | Ditolak; pesan menyebut tabel dan periode yang tidak ada versinya | `D-19`; P-09 |
| Kategori PTKP karyawan tidak ada di tabel TER | Ditolak; pesan menyebut karyawan dan kategori | `D-19` |
| Gaji pokok histori tidak ada untuk periode | Ditolak; pesan menyebut karyawan | `[USULAN]`; GJ-001 |
| Karyawan tanpa presensi tervalidasi | Ditolak untuk karyawan itu; pesan menyebut karyawan | makalah UC-GJ-05 (ditangguhkan) |
| Koreksi manual tanpa alasan | Ditolak; pesan menyebut alasan wajib | `D-48`; `[SUMBER]` EPIC-GJ |
| Periode atau draft `DISETUJUI` dihitung ulang | Ditolak; pesan menyebut draft sudah dikunci | GJ-005 |

## Batasan

- Tidak ada angka tarif di spesifikasi ini. Nilai ada di tabel berversi (`D-19`, `D-51`).
- Hitungan ulang pada data yang sama harus menghasilkan angka yang sama (gerbang `EPIC-GJ`).
- Data gaji adalah data pribadi (P-13).
- Jurnal tidak ditulis di item ini (`D-43`, `GJ-007`).

## Dependensi

- `GJ-003`: periode `TERVALIDASI`.
- `FND-002`: skema domain dan migrasi bernomor.
- Gate fondasi `FND-001`–`FND-006`.
- `FND-007`: primitive tabel rincian (P-12).

## Yang membuka jalan

- `GJ-005` (periksa dan setujui draft).

## Catatan serah terima

Risiko ukuran: item ini bisa melebihi satu track dalam satu periode pengerjaan. Pemecahan (misalnya lembur dan BPJS terpisah dari TER) adalah keputusan tech lead dan pengguna, bukan keputusan item ini. Lihat 03 Risiko.
