---
id: GJ-007
slug: jurnal-dan-laporan-payroll
title: Jurnal dan laporan payroll
epic: EPIC-GJ
milestone: M1
lane: active
sequence: unset # backlog memakai level derived (level 7); topologi hybrid
type: feature
req_status: specified
delivery_status: not_started
priority: unset # analisis P1 (usulan agen, belum disetujui)
size: M # usulan agen, belum disetujui
depends_on:
  - FND-006
  - GJ-006
blocks:
  - INT-001
owner_role: unset # Decision needed: pemilik track GJ-D
package: docs/product/items/GJ-007-jurnal-dan-laporan-payroll
---

# GJ-007 — Jurnal dan laporan payroll

## Masalah

Payroll yang disetujui belum punya jejak keuangan sampai dibayar. Beban gaji, kewajiban BPJS dan PPh 21, dan utang gaji harus masuk buku besar pada periode saat payroll disetujui (`D-49`), sehingga laporan keuangan lengkap.

## Outcome

Setiap payroll `DISETUJUI` menghasilkan satu jurnal akrual yang balance. Setiap karyawan yang `DIBAYAR` menghasilkan jurnal pembayaran. Semua jurnal dibuat lewat `postJournal()`. Laporan payroll dan laporan tenaga kerja langsung menampilkan angka yang sama dengan buku besar.

## Aktor

| Aktor | Peran | Catatan |
|---|---|---|
| Akuntansi | Memantau jurnal payroll; membuat koreksi lewat jurnal pembalik | `D-33`; `D-35` |
| Sistem (pemicu status) | Membuat jurnal akrual saat `DISETUJUI` dan jurnal pembayaran saat `DIBAYAR` | `D-49`; dijalankan lewat service core |
| HR, Akuntansi, Direksi | Melihat laporan | `D-33` |
| Siklus Produksi | Tidak mengakses modul ini; menerima TKL lewat jurnal dan track Produksi | `D-25`, `D-44` (4) |

## Siapa boleh melihat (data pribadi)

| Data | Baca |
|---|---|
| Laporan payroll per komponen dan departemen | HR, Accounting, Direksi |
| Laporan per karyawan | HR, Accounting |
| Laporan TKL | HR, Accounting, Direksi |

Baris ini `[USULAN-AGEN]` (J-11).

## Cakupan

### Termasuk

- Jurnal akrual per payroll periode saat `DISETUJUI` (`D-49`).
- Jurnal pembayaran per karyawan saat `DIBAYAR` (`D-49`).
- Laporan payroll per periode, per departemen, dan per tipe (J-06).
- Laporan TKL per periode.
- Koreksi lewat jurnal pembalik.

### Tidak termasuk

- Penetapan akun dan nomor (`FND-006`). Item ini memakai peran akun yang sudah ada.
- Tutup buku (`C-010`).
- Laporan keuangan gabungan (`C-009`, `INT-001`).
- Perhitungan HPP produksi (`PR-006`).
- Pembebanan TKL ke WIP dari kartu jam kerja (`D-44` butir 4, track Produksi) dan penyelesaian sisa tenaga kerja langsung saat tutup buku (`C-010`).
- Jurnal penyetoran BPJS dan PPh 21 ke negara (tidak ada use case di makalah; lihat "Jurnal").
- Ekspor laporan (`D-50`, menyusul).

## Jurnal (peran akun)

Akun dirujuk lewat peran (`D-35`). Nomor ditetapkan di `FND-006` (`D-41`).

**Jurnal akrual** (satu per payroll periode, dibuat saat `DISETUJUI`):

| Baris | Peran akun | Sisi | Nilai per karyawan |
|---|---|---|---|
| Beban gaji produksi | `tenaga_kerja_langsung` | Debit | Penambah (gaji pokok, tunjangan, uang lembur) minus potongan ketidakhadiran, untuk karyawan tipe Produksi |
| Beban gaji administrasi | `beban_gaji_administrasi` | Debit | Sama, untuk karyawan tipe Non-Produksi |
| Utang BPJS | `utang_bpjs` | Kredit | Potongan BPJS Ketenagakerjaan dan Kesehatan karyawan |
| Utang PPh 21 | `utang_pph21` | Kredit | Potongan PPh 21 |
| Utang gaji | `utang_gaji` | Kredit | Nominal bersih (take-home) |
| Selisih pembulatan | `selisih_pembulatan` | Debit atau kredit | Selisih agar jurnal balance (`D-51(b)`) |

`[USULAN-AGEN]`: porsi perusahaan BPJS, bila ada di tabel berversi, dijurnal sebagai tambahan beban tipe karyawan yang sama dengan kredit `utang_bpjs`.

**Jurnal pembayaran** (satu per karyawan per percobaan transfer berhasil, dibuat saat `DIBAYAR`):

| Baris | Peran akun | Sisi | Nilai |
|---|---|---|---|
| Utang gaji | `utang_gaji` | Debit | Nominal bersih karyawan |
| Kas bank | `kas_bank` | Kredit | Nominal bersih karyawan |

Setiap jurnal menyimpan jenis transaksi asal (payroll atau pembayaran), nomor transaksi asal, dan pemicunya (`D-43`).

**Setoran BPJS dan PPh 21 ke negara**: tidak ada use case di makalah. Saldo `utang_bpjs` dan `utang_pph21` tampil di laporan sebagai kewajiban. Penyetoran tidak dijurnal di item ini (`[USULAN-AGEN]`, lihat J-02; dicatat untuk koordinator).

## Status dan transisi

Tidak ada status baru (`D-47`). Status pemicu dari `D-46`:

| Keadaan | Jurnal |
|---|---|
| `DISETUJUI` | Jurnal akrual dibuat (dalam transaksi yang sama dengan transisi, `D-43`) |
| `DIBAYAR` (per karyawan) | Jurnal pembayaran dibuat untuk karyawan itu |
| `DIPOSTING` | Semua jurnal pembayaran untuk draft sudah dibuat (J-03) |

Jurnal yang sudah diposting tidak diubah. Koreksi lewat jurnal pembalik baru (J-08).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Sumber |
|---|---|---|
| Jurnal tidak balance | Ditolak oleh `postJournal()`; tidak ada baris tersimpan | `D-07`; `D-43` |
| Akun peran belum ada di konfigurasi | Ditolak; pesan menyebut peran yang kurang | `[USULAN]`; J-01 |
| Periode akuntansi terkunci atau tertutup | Ditolak; pesan menyebut periode tertutup | `D-44` (5); GJ-005 R-07 |
| Jurnal akrual untuk payroll yang belum `DISETUJUI` | Ditolak; pesan menyebut status yang diperlukan | `D-49` |
| Jurnal pembayaran untuk karyawan yang belum `DIBAYAR` | Ditolak; pesan menyebut status yang diperlukan | `D-49` |
| Jurnal akrual kedua untuk payroll yang sama | Ditolak; pesan menyebut jurnal yang sudah ada | `[USULAN]` |
| Jurnal pembayaran kedua untuk karyawan dan transfer sukses yang sama | Ditolak; pesan menyebut pembayaran sudah dijurnal | `[USULAN]` |

## Batasan

- Jurnal hanya lewat `postJournal()` (`D-07`). Modul tidak menulis tabel jurnal.
- Data karyawan dan nominal adalah data pribadi (J-11).
- Item ini tidak membaca data produksi (`D-44` butir 4, `D-25`).
- Laporan membaca buku besar, tidak menghitung ulang dari tabel transaksi (`D-43`).

## Dependensi

- `GJ-006`: pembayaran tercatat per karyawan.
- `FND-006`: COA peran, `postJournal()`, periode akuntansi.
- Gate fondasi.
- `FND-007`: primitive tabel laporan (J-10).

## Yang membuka jalan

- `INT-001` (jurnal gabungan lintas siklus).

## Catatan serah terima

Pembebanan TKL ke WIP bukan bagian item ini (`D-44` butir 4). Jurnal akrual dibuat lewat service core saat `DISETUJUI` (GJ-005 memicu, item ini menyusun jurnalnya). Pertentangan `D-46`/`D-49` untuk `DIPOSTING` dicatat di 00 (J-03).
