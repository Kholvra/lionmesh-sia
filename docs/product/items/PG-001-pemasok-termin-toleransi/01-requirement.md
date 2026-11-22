---
id: PG-001
slug: pemasok-termin-toleransi
title: Master pemasok, termin, dan toleransi match
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset # graph (D-03); bukan urutan serial
type: feature
req_status: specified
delivery_status: not_started
priority: P0 # usulan dari analisis-sia §5.3; belum dikonfirmasi
size: M # usulan agen; belum disetujui
depends_on:
  - FND-003
blocks:
  - PG-004
owner_role: pemilik track PG-A (belum ditetapkan)
package: docs/product/items/PG-001-pemasok-termin-toleransi
---

# PG-001 — Master pemasok, termin, dan toleransi match

## Masalah

Pembelian membutuhkan daftar pemasok yang tetap. Setiap pemasok punya termin pembayaran dan batas toleransi selisih harga yang harus diketahui sebelum PO dan pencocokan tiga dokumen dibuat.

Analisis mencatat dua celah: termin pemasok tidak tersedia di sumber (G4) dan toleransi tidak punya angka (G5). Keputusan `D-14`, `D-15`, `D-31`–`D-33`, `D-50` sudah mengunci aturannya. Pertanyaan yang tersisa (Q-03, Q-06 sampai Q-09 di `00-discussion.md`) dijawab dengan default `[USULAN-AGEN]` dan ikut kunci koordinator.

## Outcome

Staf Purchasing dapat mengelola daftar pemasok dari UI: membuat, mengubah, menonaktifkan, dan mengaktifkan kembali pemasok. Termin dan toleransi tersimpan per pemasok sesuai `D-14` dan `D-15`, sehingga pemasok yang dipilih di `PG-004` dan dokumen PO membawa aturan yang sama. Perubahan termin atau toleransi tidak mengubah dokumen yang sudah dibuat.

## Aktor

| Aktor | Peran |
|---|---|
| Purchasing | mengelola master pemasok: buat, ubah, nonaktifkan, dan aktifkan kembali (`D-33`, "Buat / ubah pemasok") |
| Accounting | membaca field kontak pemasok untuk pencocokan dan pembayaran (`[USULAN-AGEN]` Q-03); tidak mengubah master |
| Manajemen | tidak punya aksi pada master pemasok (`D-33`) |
| Pemasok | pihak luar tanpa akun; tidak berinteraksi langsung dengan layar ini (`D-23`) |
| Sistem | memvalidasi input, menolak dengan pesan yang bisa dibaca, dan mencatat riwayat |

## Cakupan

### Termasuk

- Daftar pemasok: buat, lihat, ubah, nonaktifkan, dan aktifkan kembali dari UI.
- Termin pembayaran per pemasok. Tidak ada nilai default. Wajib diisi (`D-14`: "pemasok tanpa default, wajib input").
- Toleransi match per pemasok: `toleransi_persen` dan `toleransi_nominal`, default 0, hanya berlaku untuk harga dan total. `toleransi_nominal` dalam IDR (`D-38`). Kedua nilai disimpan terpisah.
- Field kontak: nama perusahaan, alamat, NPWP (opsional), kontak perusahaan, dan kontak PIC (data pribadi, dibatasi).

### Tidak termasuk

- Pemilihan pemasok dan perbandingan harga (`PG-004`).
- Penerapan toleransi pada pencocokan tiga dokumen (`PG-008`). `PG-001` hanya menyimpan angkanya dan kombinasinya didefinisikan di sini.
- Portal pemasok (`D-23`).
- Jurnal atau saldo utang pemasok (`PG-008`).
- Migrasi data pemasok dari sumber lain. Sumber tidak menyebutkan kebutuhan ini.

## Status dan transisi

Status pemasok: `aktif` dan `nonaktif`. Sumber menyebut "menonaktifkan" (`LAPORAN_PENGERJAAN_PROYEK.txt` KF-PG01). Aturan PO baru: "Purchase order hanya dapat diterbitkan kepada pemasok yang terdaftar dan berstatus aktif" (aturan validasi 3). `D-50`: master nonaktif tidak bisa dipilih untuk dokumen baru, dokumen terbuka tetap berjalan.

| Status | Arti | Transisi |
|---|---|---|
| `aktif` | pemasok bisa dipilih untuk PR, kandidat `PG-004`, dan PO baru | `aktif` → `nonaktif` oleh Purchasing |
| `nonaktif` | tidak bisa dipilih untuk dokumen baru; dokumen terbuka tetap berjalan (`D-50`) | `nonaktif` → `aktif` oleh Purchasing (`[USULAN-AGEN]`, Q-07) |

Jalur gagal:
- Menonaktifkan pemasok yang masih punya dokumen terbuka: **diizinkan**. Dokumen terbuka tetap berjalan (`D-50`); tidak ada dokumen yang berubah status karena ini.
- Mengaktifkan kembali pemasok yang sudah aktif: ditolak dengan pesan, status tidak berubah.
- Setiap perubahan status meninggalkan jejak di `riwayat_status` (`D-08`) dengan aktor dan waktu.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Nama pemasok kosong | Ditolak dengan pesan "Nama pemasok wajib diisi" `[USULAN]` |
| Nama pemasok sudah terdaftar | Ditolak dengan pesan "Nama pemasok sudah terdaftar" `[USULAN]` (`diagram-sia-lengkap.md` PG01, catatan rancangan) |
| Termin kosong saat disimpan | Ditolak dengan pesan "Termin pembayaran wajib diisi" `[USULAN]`. Wajib sesuai `D-14` |
| `toleransi_persen` di luar 0 sampai 100 | Ditolak dengan pesan "Toleransi persen harus antara 0 dan 100" `[USULAN]` |
| `toleransi_nominal` negatif | Ditolak dengan pesan "Toleransi nominal tidak boleh negatif" `[USULAN]` |
| Pengguna tanpa izin mengubah pemasok | Ditolak dengan pesan "Anda tidak punya izin mengubah data pemasok" `[USULAN]`. Izin sesuai `D-33` (hanya Purchasing) |
| Pemasok nonaktif dipilih untuk dokumen baru | Ditolak di item pemakainya (`PG-002`, `PG-004`, `PG-005`) dengan pesan "Pemasok nonaktif tidak bisa dipilih" `[USULAN]` |

## Batasan

- Toleransi hanya berlaku untuk harga dan total. Selisih qty tidak pernah lolos toleransi (`D-15`).
- Kombinasi dua toleransi: kedua batas berlaku bersama, batas yang lebih ketat menang (`[USULAN-AGEN]`, Q-06). Penerapan dibuktikan di `PG-008`.
- Termin dan toleransi yang berlaku **disalin** ke dokumen saat dokumen dibuat (`[USULAN-AGEN]`, Q-08). Perubahan master hanya berlaku untuk dokumen baru.
- Termin pemasok tidak punya default (`D-14`).
- Pemasok tidak punya akun login (`D-18`, `D-23`).
- Item ini tidak membuat jurnal. Akun debit dan kredit tidak berlaku untuk item ini. Sumber angkanya adalah input pengguna.
- Field kontak PIC adalah data pribadi: hanya Purchasing dan Accounting yang membacanya (`[USULAN-AGEN]`, Q-03; ditegakkan lewat RLS `FND-003`).
- Tabel `pemasok` dimiliki `core/` (`D-31`, `D-05`). Modul hanya memiliki layar dan aturan alur.
- DDL dikirim sebagai usulan dan dinomori tech lead (`D-09`).
- Perubahan status dan perubahan master tercatat lewat kolom audit `D-32` dan `riwayat_status` `D-08`. Nilai lama per field tidak disimpan (`[USULAN-AGEN]`, Q-09).

## Dependensi

- `FND-003` (backlog `depends on`): autentikasi dan 12 peran staf dengan RLS. Dibutuhkan untuk izin dan pembatasan field kontak. Status `specified` (belum `done`).
- Gate fondasi `FND-001` sampai `FND-006` (`backlog.md`): `FND-001` sudah `done`. `FND-002` sampai `FND-006` masih `specified`.
- `FND-007` (UI kit: tabel, form, status badge): item ini memakai tabel dan form. Backlog menyatakan item modul yang membutuhkan primitive UI menunggu `FND-007`, tetapi `FND-007` belum tercantum di `depends on`. Lihat `03-readiness-review.md`.
- Tabel `pemasok`: pemilik `core/` (`D-31`).

## Yang membuka jalan

- `PG-002` permintaan pembelian (backlog `depends on` `PG-001`).
- `PG-004` pemilihan pemasok dan perbandingan harga (backlog `depends on` `PG-001`).

## Catatan serah terima

Nama tabel dan mekanisme implementasi mengikuti domain implementasi. Yang mengikat adalah aturan termin, toleransi, status nonaktif, pembatasan field kontak, dan aturan snapshot di atas.
