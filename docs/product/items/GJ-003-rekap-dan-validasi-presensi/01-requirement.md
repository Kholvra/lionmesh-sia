---
id: GJ-003
slug: rekap-dan-validasi-presensi
title: Rekap dan validasi presensi periode penggajian
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 3); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P0 (usulan agen, belum disetujui)
size: S # usulan agen, belum disetujui
depends_on:
  - GJ-002
blocks:
  - GJ-004
owner_role: unset # Decision needed: pemilik track GJ-B
package: docs/product/items/GJ-003-rekap-dan-validasi-presensi
---

# GJ-003 — Rekap dan validasi presensi periode penggajian

## Masalah

Payroll tidak boleh jalan sebelum presensi diperiksa oleh Supervisor. Tanpa titik kunci per periode, presensi bisa berubah setelah dihitung.

## Outcome

HR dapat merekap presensi dan lembur satu periode penggajian lalu menutup periode (`REKAP`). Supervisor Lapangan memvalidasi rekap per departemen. Bila rekap tidak sesuai, Supervisor mengembalikannya ke HR dengan alasan (`TERBUKA`). Hanya periode yang `TERVALIDASI` yang boleh masuk ke hitungan payroll (GJ-004).

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| HR | Membuat rekap, menutup periode (`REKAP`), memperbaiki rekap yang dikembalikan | `D-33`; `D-47` (c) |
| Supervisor Lapangan | Memvalidasi rekap departemennya; mengembalikan dengan alasan | `D-33`; `[USULAN-AGEN]` Q-01 |
| Manajemen | Memberi otorisasi khusus membuka kembali periode `TERVALIDASI` | `[USULAN-AGEN]` Q-03 |
| Karyawan | Tidak terlibat | `D-53`: hanya mencatat presensinya di GJ-002 |

## Siapa boleh melihat (data pribadi)

| Data | Tulis | Baca |
|---|---|---|
| Rekap seluruh karyawan | HR | HR |
| Rekap departemen | Supervisor (validasi dan alasan kembali) | Supervisor departemennya |
| Lainnya | — | Tidak ada |

Baris ini `[USULAN-AGEN]` (Q-06).

## Cakupan

### Termasuk

- Rekap presensi dan lembur per periode penggajian; daftar karyawan aktif yang belum punya entri ditandai (Q-04).
- Validasi per departemen oleh Supervisor dengan keputusan setujui atau kembalikan dengan alasan.
- Penutupan periode oleh HR (`REKAP`) dan pengembalian (`TERBUKA`).
- Status periode yang terlihat, dan riwayat transisi.

### Tidak termasuk

- Pencatatan presensi harian (GJ-002).
- Impor presensi dari mesin (GJ-008).
- Perhitungan payroll (GJ-004).

## Status dan transisi

Status periode penggajian (`D-46`, `D-47`):

| Keadaan | Arti | Transisi |
|---|---|---|
| `TERBUKA` | Periode dibuat HR; presensi boleh diisi (GJ-002) | → `REKAP` oleh HR saat rekap disimpan |
| `REKAP` | Periode ditutup; rekap disimpan; entri baru ditolak | → `TERVALIDASI` oleh Supervisor (semua departemen); → `TERBUKA` oleh Supervisor bila dikembalikan dengan alasan (`D-47` c) |
| `TERVALIDASI` | Semua departemen tervalidasi; siap dihitung | → `REKAP` hanya dengan otorisasi Manajemen dan alasan, dan bila draft belum `DISETUJUI` (`[USULAN-AGEN]` Q-03) |

Setiap transisi tercatat di `riwayat_status` (`D-08`) dengan aktor, waktu, alasan bila ada, dan status sebelum dan sesudah.

Validasi per departemen (Q-05): setiap departemen punya status validasi sendiri di dalam periode. Periode menjadi `TERVALIDASI` hanya bila semua departemen tervalidasi. Pengembalian oleh satu departemen mengembalikan seluruh periode ke `TERBUKA` (`D-47` c).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Rekap disimpan dengan karyawan aktif yang belum punya entri | Ditolak; pesan menyebut karyawan dan bahwa data kosong harus diisi | makalah UC-GJ-03; Q-04 |
| Rekap dibuat untuk periode yang sudah `TERVALIDASI` atau `REKAP` | Ditolak; pesan menyebut status periode | `D-46` |
| Validasi oleh pengguna selain Supervisor departemen | Ditolak; pesan menyebut peran yang berwenang | `[USULAN]`; Q-01 |
| Validasi oleh pengguna yang mencatat presensi departemen itu (HR atas nama) | Ditolak; pesan menyebut pemohon tidak boleh memvalidasi | `D-48` |
| Pengembalian tanpa alasan | Ditolak; pesan menyebut alasan wajib | `D-48` |
| Payroll diminta untuk periode yang belum `TERVALIDASI` | Ditolak; pesan menyebut bahwa validasi supervisor belum dilakukan | `[SUMBER]` §8.1 |
| Koreksi `TERVALIDASI` → `REKAP` tanpa otorisasi Manajemen | Ditolak; pesan menyebut otorisasi khusus | `D-53` |

## Batasan

- Data presensi adalah data pribadi (`GJ-002`, P-08).
- Modul hanya membaca data lewat service core (`D-25`).
- Tidak ada akun karyawan yang terlibat (`D-53`).

## Dependensi

- `GJ-002`: presensi dan lembur.
- Gate fondasi `FND-001`–`FND-006` (lewat `GJ-002`).
- `FND-007`: primitive tabel dan dialog (Q-07).

## Yang membuka jalan

- `GJ-004` (hitung payroll hanya untuk periode `TERVALIDASI`).

## Catatan serah terima

Tidak ada peran tambahan di luar matriks §3.3 yang diusulkan. Lingkup Supervisor (Q-01) menentukan izin dan penugasan per departemen dibaca dari master departemen (GJ-001, P-07).
