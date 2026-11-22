---
id: GJ-008
slug: impor-presensi-mesin
title: Impor presensi dari mesin absensi
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 3); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P2 (usulan agen, belum disetujui)
size: M # usulan agen, belum disetujui
depends_on:
  - GJ-002
blocks: []
owner_role: unset # Decision needed: pemilik track GJ-B
package: docs/product/items/GJ-008-impor-presensi-mesin
---

# GJ-008 — Impor presensi dari mesin absensi

## Masalah

Presensi dari mesin absensi harus diketik ulang oleh HR. Itu lambat dan membuka peluang salah input.

## Outcome

HR dapat mengimpor presensi dari berkas CSV ekspor mesin absensi. Kolom dipetakan lewat profil pemetaan. Setiap ID mesin dipetakan ke karyawan (NIK). Baris yang tidak bisa dipetakan, tidak lengkap, atau bentrok ditampilkan sebagai daftar dan tidak masuk diam-diam. Hasil impor menjadi presensi yang menunggu validasi Supervisor (`D-53`).

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| HR | Mengisi profil pemetaan, menjalankan impor, memeriksa daftar hasil | `D-33`; `D-52`; `[USULAN-AGEN]` |
| Supervisor Lapangan | Membaca dan memvalidasi hasil lewat GJ-003 | `D-53`; GJ-003 |
| Karyawan | Tidak terlibat. Impor tidak berasal dari perangkat karyawan | `D-53` |

## Siapa boleh melihat (data pribadi)

| Data | Tulis | Baca |
|---|---|---|
| Profil pemetaan ID mesin → NIK | HR | HR |
| Berkas impor dan daftar hasil (ID mesin, NIK, waktu) | HR | HR |
| Presensi hasil impor | HR (impor) | HR, Supervisor departemennya (GJ-002 P-08) |

Baris ini `[USULAN-AGEN]` (M-03).

## Cakupan

### Termasuk

- Impor berkas CSV ekspor mesin absensi dengan profil pemetaan kolom (`D-52`).
- Profil pemetaan: pemisah, format tanggal dan jam, kolom ID mesin, tanggal, jam masuk, dan jam pulang.
- Pemetaan ID mesin ke NIK, diisi HR (satu ID satu NIK).
- Daftar baris yang tidak terpetakan, tidak lengkap, atau bentrok, dengan alasan.
- Penolakan berkas identik yang sudah pernah diimpor.

### Tidak termasuk

- Pemilihan merek atau protokol mesin (`D-52`).
- Konektor API atau SDK mesin.
- Pencatatan manual (`GJ-002`).
- Rekap dan validasi (`GJ-003`).

## Status dan transisi

Tidak ada status impor tersimpan (`D-47`). Impor berjalan atomik per berkas:

| Kejadian | Hasil |
|---|---|
| Berkas tidak sesuai format atau baris rusak | Seluruh berkas ditolak; tidak ada baris tersimpan |
| Baris valid | Tersimpan sebagai presensi `MENUNGGU_VALIDASI_SUPERVISOR` dengan penanda sumber impor (`D-53`) |
| Baris tanpa NIK, tidak lengkap, bentrok, atau di luar periode | Dilewati dan didaftar dengan alasan |

Hasil impor dicatat dengan aktor, waktu, jumlah baris tersimpan, dilewati, dan bentrok (`D-32`). Setiap presensi yang dibuat tercatat di `riwayat_status` bila statusnya berubah (`D-08`).

Impor hanya untuk periode `TERBUKA` (`D-53`, `D-47` c).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Format berkas tidak sesuai profil | Seluruh berkas ditolak sebelum baris apa pun disimpan; pesan menyebut format yang diharapkan | `[USULAN-AGEN]`; M-02 |
| Baris rusak di tengah berkas | Seluruh berkas ditolak; pesan menyebut nomor baris | `[USULAN-AGEN]` |
| ID mesin tanpa NIK | Baris dilewati dan tampil sebagai tidak terpetakan; tidak disimpan | `[USULAN-AGEN]`; M-03 |
| Berkas identik sudah pernah diimpor | Ditolak; pesan menyebut berkas sudah diimpor | `[USULAN-AGEN]`; M-04 |
| Baris bentrok dengan presensi yang sudah ada (NIK dan tanggal sama) | Baris dilewati dan tampil sebagai bentrok; presensi yang ada tidak diubah | `[USULAN-AGEN]`; M-05 |
| Periode `REKAP` atau `TERVALIDASI` | Impor ditolak; pesan menyebut periode tertutup | `D-53`; M-07 |
| Baris di luar rentang periode | Baris dilewati dan tampil dengan alasan | GJ-002 validasi |
| Berkas kosong | Ditolak; pesan menyebut berkas kosong | `[USULAN]` |
| ID mesin dipetakan ke dua NIK | Pemetaan ditolak; pesan menyebut ID ganda | `[USULAN-AGEN]` |

## Batasan

- Data presensi adalah data pribadi (`GJ-002`).
- Tidak ada sumber impor yang berasal dari karyawan (`D-53`).
- Modul hanya membaca data karyawan lewat service core (`D-25`).
- Format berkas dan profil tidak mengunci merek mesin (`D-52`).

## Dependensi

- `GJ-002`: presensi harian dan aturan entri.
- Gate fondasi `FND-001`–`FND-006` (lewat `GJ-002`).
- `DISC-001` (`D-39`, `D-60`(e)): spike **non-pemblokir**, bukan dependensi. Hasilnya hanya mengisi profil pemetaan (`D-52`). Item ini dikerjakan paling akhir di siklusnya (`D-39`).
- `FND-007`: primitive pratinjau dan daftar hasil (M-08).

## Yang membuka jalan

- Tidak ada item lain di `backlog.md` yang bergantung pada item ini.

## Catatan serah terima

Spesifikasi di 02 tidak mengunci merek, protokol, atau kode status mesin (`D-52`). Hasil `DISC-001` mengisi profil pemetaan. Pertentangan dependensi dan `D-52` terselesaikan oleh `D-60`(e) (lihat 00).
