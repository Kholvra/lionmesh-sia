---
id: GJ-002
slug: presensi-dan-lembur
title: Presensi dan pengajuan lembur
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 2); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P0 (usulan agen, belum disetujui)
size: M # usulan agen, belum disetujui
depends_on:
  - FND-004
  - GJ-001
blocks:
  - GJ-003
  - GJ-008
owner_role: unset # Decision needed: pemilik track GJ-B
package: docs/product/items/GJ-002-presensi-dan-lembur
---

# GJ-002 — Presensi dan pengajuan lembur

## Masalah

Payroll tidak bisa dihitung tanpa data kehadiran dan lembur per karyawan per periode. Lembur tidak punya jejak dasar yang sah bila tidak ada nomor SPL, dan karyawan tanpa akun harus tetap tercatat.

## Outcome

Karyawan dapat mencatat jam masuk dan pulang miliknya serta mengajukan lembur dengan nomor SPL (`D-53`). HR dapat mencatat presensi dan lembur atas nama karyawan, termasuk karyawan tanpa akun. Setiap entri menunggu validasi Supervisor. Lembur hanya tercatat bila ada nomor SPL. Data ini menjadi masukan rekap dan validasi (GJ-003).

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| Karyawan (self-service) | Mencatat presensi masuk dan pulang miliknya; mengajukan lembur dengan nomor SPL; melihat riwayat presensinya | `D-53`; akun opsional |
| HR | Mencatat presensi dan lembur atas nama karyawan; mengajukan koreksi periode tertutup | `D-33`, `D-53` |
| Supervisor Lapangan | Memvalidasi presensi dan lembur per departemen (di GJ-003). Tidak mencatat | `D-33`; makalah UC-GJ-04 |
| Manajemen | Memberi otorisasi khusus untuk koreksi periode tertutup | `[USULAN-AGEN]` (P-07) |

## Siapa boleh melihat (data pribadi)

| Data | Tulis | Baca |
|---|---|---|
| Presensi dan lembur semua karyawan | Karyawan untuk dirinya; HR | HR |
| Presensi dan lembur per departemen | — | Supervisor Lapangan (departemennya saja) |
| Presensi dan riwayat diri sendiri | Karyawan | Karyawan |
| Lainnya | — | Tidak ada |

Baris ini `[USULAN-AGEN]` (P-08).

## Cakupan

### Termasuk

- Presensi harian per karyawan per tanggal dalam periode penggajian: nilai HADIR, IZIN, SAKIT, ALPHA, atau CUTI. Untuk HADIR wajib jam masuk dan jam pulang (`[USULAN-AGEN]`, P-03).
- Pengajuan lembur per karyawan per tanggal: jumlah jam lembur dan nomor SPL wajib (`D-53`).
- Pencatatan oleh karyawan untuk dirinya sendiri, dan oleh HR atas nama karyawan.
- Pembatalan pengajuan oleh pemohon sebelum validasi, dengan alasan (`D-48`).
- Riwayat presensi per karyawan (untuk karyawan dan HR).
- Daftar presensi dan lembur per periode.
- Koreksi periode tertutup oleh HR dengan otorisasi khusus (P-07).

### Tidak termasuk

- Rekap dan validasi supervisor (`GJ-003`).
- Impor presensi dari mesin absensi (`GJ-008`).
- Perhitungan upah lembur (`GJ-004`).
- Pembuatan akun karyawan dan sesi (`FND-003`, `D-53`).

## Status dan transisi

Status yang dipakai (tidak ada status baru, `D-47`):

| Objek | Keadaan | Transisi |
|---|---|---|
| Presensi dan lembur (per baris) | `MENUNGGU_VALIDASI_SUPERVISOR` | → `TERVALIDASI` saat Supervisor memvalidasi rekap periode (GJ-003) |
| Lembur (per baris) | `DIBATALKAN` | Dari `MENUNGGU_VALIDASI_SUPERVISOR` oleh pemohon, dengan alasan wajib (`D-48`). Setelah `TERVALIDASI`, tidak bisa dibatalkan |
| Periode penggajian | `TERBUKA` | Entri baru hanya di sini (`D-47` c) |
| Periode penggajian | `REKAP` | Periode ditutup oleh HR. Entri baru ditolak. Dari sini bisa kembali `TERBUKA` (GJ-003) |

Setiap transisi status tercatat di `riwayat_status` (`D-08`). Presensi yang belum divalidasi boleh diperbaiki HR selama periode `TERBUKA`.

Koreksi periode tertutup (`P-07`): HR mengajukan dengan alasan; Manajemen memberi otorisasi; periode kembali `TERBUKA` bila `REKAP`. Bila periode sudah `TERVALIDASI`, lihat transisi di GJ-003 dan `04` (`PRE-07`).

Gagal: simpan yang ditolak validasi tidak membuat baris.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Lembur tanpa nomor SPL | Ditolak; pesan menyebut nomor SPL wajib diisi | `D-53`; makalah UC-GJ-02 |
| Jam pulang kosong untuk HADIR | Ditolak; pesan menyebut jam pulang | makalah UC-GJ-02 |
| Tanggal di luar periode penggajian yang dipilih | Ditolak; pesan menyebut periode yang berlaku | `[USULAN]`; P-06 |
| Periode sudah `REKAP` atau lebih lanjut | Ditolak; pesan menyebut periode tertutup dan jalur koreksi HR | `D-53`; `D-47` c |
| Presensi ganda untuk karyawan dan tanggal yang sama | Ditolak; pesan menyebut karyawan dan tanggal | `[USULAN]` |
| Karyawan tidak ditemukan atau nonaktif | Ditolak; pesan menyebut NIK | GJ-001 AC-12 |
| Jam lembur melebihi batas berversi | Ditolak; pesan menyebut batas yang berlaku | `D-51`; nilai dikutip saat implementasi |
| Pembatalan tanpa alasan | Ditolak; pesan menyebut alasan wajib | `D-48` |
| Pembatalan setelah `TERVALIDASI` | Ditolak; pesan menyebut status saat ini | `D-48` |
| Koreksi periode tertutup tanpa otorisasi Manajemen | Ditolak; pesan menyebut otorisasi khusus | `D-53` |

## Batasan

- Data presensi dan lembur adalah data pribadi (P-08).
- Modul hanya membaca data karyawan lewat service core (`D-25`).
- Karyawan (akun) hanya membaca baris dirinya (`D-53`).
- Tidak boleh bergantung pada tanggal hari ini kecuali untuk penentuan periode yang dipilih pengguna.

## Dependensi

- `GJ-001`: data karyawan dan status master.
- `FND-004`: penomoran, status, dan riwayat dokumen.
- Gate fondasi `FND-001`–`FND-006` (`backlog.md`).
- `FND-007`: primitive tabel dan form (P-09).

## Yang membuka jalan

- `GJ-003` (rekap dan validasi presensi).
- `GJ-008` (impor presensi dari mesin).

## Catatan serah terima

Tidak ada tabel atau kolom yang ditetapkan di sini. Keputusan perilaku ada di 02 dan 04.
