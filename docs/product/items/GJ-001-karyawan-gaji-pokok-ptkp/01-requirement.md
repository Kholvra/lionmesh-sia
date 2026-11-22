---
id: GJ-001
slug: karyawan-gaji-pokok-ptkp
title: Data karyawan, gaji pokok, dan PTKP
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 1); topologi hybrid, bukan sequence strict
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P0 (usulan agen, belum disetujui)
size: M # usulan agen, belum disetujui
depends_on:
  - FND-003
blocks:
  - GJ-002
owner_role: unset # Decision needed: pemilik track GJ-A
package: docs/product/items/GJ-001-karyawan-gaji-pokok-ptkp
---

# GJ-001 — Data karyawan, gaji pokok, dan PTKP

## Masalah

Payroll tidak bisa dihitung tanpa data karyawan yang tertib: NIK unik, jabatan, departemen, tipe karyawan (Produksi atau Non-Produksi), status PTKP, rekening, dan gaji pokok. Gaji pokok juga harus punya riwayat, supaya perubahan gaji tidak mengubah perhitungan periode yang sudah lewat.

## Outcome

HR dapat menambah dan mengubah data karyawan, mencatat gaji pokok dengan tanggal berlaku, dan melihat riwayat gaji pokok per karyawan. Setiap perubahan tercatat dengan siapa dan kapan. Data ini menjadi masukan presensi (GJ-002), validasi rekap (GJ-003), dan hitungan payroll (GJ-004).

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| HR | Mengelola data karyawan dan gaji pokok | `D-33` (kelola data karyawan: HR) |
| Karyawan | Peran self-service dengan akun opsional. Di item ini tidak membaca data karyawan mana pun | `D-53`; AC-13 |
| Accounting, Finance | Pembaca data pribadi tertentu | Lihat "Siapa boleh melihat" di bawah |
| Direksi, Supervisor Lapangan | Tidak membaca data pribadi karyawan di item ini | `D-33`; Supervisor hanya membaca presensi (`GJ-002`/`GJ-003`) |

## Siapa boleh melihat (data pribadi)

| Field | Tulis | Baca |
|---|---|---|
| NIK, nama, jabatan, departemen, tipe, tanggal masuk dan keluar, status master | HR | HR, Accounting |
| Gaji pokok (histori) | HR | HR, Accounting |
| Status PTKP | HR | HR, Accounting |
| Rekening (nama bank, nomor, nama pemilik) | HR | HR, Finance |
| Karyawan (peran self-service) | — | Tidak ada |

Baris ini `[USULAN-AGEN]` (P-06). `D-33` hanya menetapkan tulis oleh HR dan laporan payroll.

## Cakupan

### Termasuk

- Daftar dan detail karyawan: NIK, nama, jabatan, departemen, tipe (Produksi atau Non-Produksi), status PTKP, rekening bank, tanggal masuk, dan tanggal keluar (bila nonaktif).
- Status master karyawan AKTIF atau NONAKTIF (`D-50`). Nonaktif tidak menghapus data dan tidak bisa dipilih untuk dokumen baru.
- Tambah dan ubah data karyawan oleh HR.
- Riwayat gaji pokok: setiap entri punya nominal dan tanggal berlaku.
- Master departemen dan jabatan di `core/` (`P-07`).
- Pilihan status PTKP dari daftar kategori yang berasal dari tabel berversi (`D-19`).

### Tidak termasuk

- Tarif lembur, BPJS, dan PPh 21 (`GJ-004`, sesuai `D-19`).
- Tunjangan dan potongan tetap (`GJ-004`, P-05 di sana).
- Presensi dan lembur (`GJ-002`).
- Pembuatan akun karyawan dan sesi karyawan (`FND-003` dan `GJ-002`, `D-53`). Item ini hanya memastikan akun karyawan tidak melihat data karyawan.
- Impor karyawan dari sistem lama (tidak disebut di sumber; diperlakukan sebagai tidak termasuk).

## Status dan transisi

Tidak ada status dokumen baru (`D-47`). Keadaan di bawah diturunkan dari data dan tanggal, bukan disimpan sebagai status.

| Objek | Keadaan | Aturan |
|---|---|---|
| Karyawan (master) | `AKTIF` atau `NONAKTIF` | Dinonaktifkan oleh HR; wajib tanggal keluar. Nonaktif tetap tampil di riwayat (`D-50`) |
| Entri gaji pokok | `dijadwalkan` | Tanggal berlaku di masa depan |
| Entri gaji pokok | `berlaku` | Tanggal berlaku sudah tercapai dan tidak ada entri lebih baru yang sudah berlaku |
| Entri gaji pokok | `digantikan` | Ada entri dengan tanggal berlaku lebih baru yang sudah berlaku. Entri ini tidak berubah |

Gagal: simpan yang ditolak validasi tidak mengubah apa pun (lihat Validasi).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| NIK sudah dipakai karyawan lain | Ditolak; pesan menyebut NIK yang duplikat; tidak ada baris baru | `[SUMBER]` NIK unik; pesan `[USULAN]` |
| NIK bukan 16 digit numerik | Ditolak; pesan menyebut format 16 digit | `D-51(d)` |
| NIK kosong | Ditolak; pesan menyebut kolom NIK | `[USULAN]` |
| Kategori PTKP tidak ada di daftar aktif | Ditolak; pesan menyebut kategori yang dikenal | `D-19`; pesan `[USULAN]` |
| Rekening tanpa nama bank, nomor, atau nama pemilik | Ditolak; pesan menyebut bagian yang kosong | `D-51(d)` |
| Gaji pokok kosong atau tidak valid | Ditolak; pesan menyebut kolom gaji pokok | `[USULAN]`; batas nilai ditetapkan di tabel berversi |
| Tanggal berlaku kosong | Ditolak; pesan menyebut tanggal berlaku | `[USULAN]` |
| Tanggal berlaku sama dengan entri lain untuk karyawan yang sama | Ditolak; pesan menyebut tanggal yang bentrok | `[USULAN]` (P-04) |
| Karyawan nonaktif dipilih untuk dokumen baru | Ditolak; pesan menyebut status nonaktif | `D-50` |
| Status nonaktif tanpa tanggal keluar | Ditolak; pesan menyebut tanggal keluar | `[USULAN]` |
| Pengguna tanpa izin mencoba mengubah data | Ditolak; pesan menyebut izin yang kurang | `[USULAN]` |

## Batasan

- Data pribadi (NIK, rekening, gaji pokok, PTKP): pembaca mengikuti tabel "Siapa boleh melihat".
- Modul hanya memakai service core untuk data yang dipakai lintas siklus (`D-25`). Tabel `karyawan` dimiliki `core/` (`D-31`); modul penggajian memiliki layar dan aturan.
- Akun karyawan (`D-53`) tidak membaca baris karyawan mana pun, termasuk dirinya. Presensi dirinya dibaca lewat `GJ-002`.
- Tidak ada aturan yang bergantung pada tanggal hari ini kecuali tanggal berlaku yang dipilih pengguna.

## Dependensi

- `FND-003`: autentikasi dan 12 peran staf plus peran Karyawan dengan RLS (`D-53`).
- Gate fondasi `FND-001`–`FND-006` (`backlog.md`).
- `FND-007`: primitive tabel dan form (`P-10`).

## Yang membuka jalan

- `GJ-002` (presensi memakai data karyawan).
- `GJ-004` lewat `GJ-003` (gaji pokok dari histori, prorata dari tanggal masuk dan keluar).

## Catatan serah terima

Keputusan perilaku ada di 02 dan 04. Pertentangan makalah dengan `D-19` (gaji pokok histori) dicatat di 00-discussion.md; `D-19` menang. Tidak ada tabel atau rumus yang ditetapkan di sini; itu domain implementasi setelah item `Ready`.
