---
id: PD-001
slug: pelanggan-termin-batas-kredit
title: Pelanggan, termin, dan batas kredit
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: S
depends_on:
  - FND-003
blocks:
  - PD-002
owner_role: kelompok Pendapatan, track PD-A (orang belum ditetapkan)
package: docs/product/items/PD-001-pelanggan-termin-batas-kredit
---

# PD-001 — Pelanggan, termin, dan batas kredit

## Masalah

Staf penjualan belum punya tempat untuk menyimpan data pelanggan yang dipakai dokumen penjualan: termin pembayaran, batas kredit, dan status aktif. Tanpa data ini, pesanan tidak bisa dicek terhadap batas kredit dan faktur tidak punya jatuh tempo.

## Outcome

Staf yang berwenang dapat membuat, mencari, mengubah, dan menonaktifkan pelanggan dari UI. Setiap pelanggan memiliki termin pembayaran (default 30 hari, bisa dikoreksi) dan batas kredit (default 0 = tunai). Dokumen penjualan berikutnya membaca nilai ini. Nonaktifkan pelanggan menghentikan pemilihannya di dokumen baru, tanpa menghapus datanya atau dokumen yang sudah terbuka.

## Aktor

| Aktor | Peran |
|---|---|
| Penjualan | membuat, mengubah, menonaktifkan, dan mengaktifkan pelanggan; mengatur termin (D-33, `Buat / ubah pelanggan`) |
| Manajemen | mengatur batas kredit pelanggan (`[USULAN-AGEN]`, lihat `00-discussion.md` `PQ-02`) |
| Pelanggan | pihak luar, tidak punya akun (`D-23`) |

Izin per aksi:

| Aksi | Boleh | Pemeriksaan |
|---|---|---|
| Buat / ubah nama, kontak, alamat, termin | Penjualan | server action, sesi |
| Ubah batas kredit | Manajemen | server action, sesi (`PRE-01`) |
| Nonaktifkan / aktifkan | Penjualan | server action, sesi |

## Cakupan

### Termasuk

- Daftar pelanggan dengan pencarian berdasarkan nama.
- Tambah dan ubah pelanggan.
- Nonaktifkan dan aktifkan kembali pelanggan.
- Termin pembayaran per pelanggan, default 30 hari.
- Batas kredit per pelanggan, default 0 (tunai).
- Field opsional NPWP dan alamat (nullable, tanpa validasi format).
- Pesan validasi yang bisa dibaca pengguna.

### Tidak termasuk

- Portal pelanggan (`D-23`).
- Pembuatan pesanan dan pengecekan kredit (`PD-002`).
- Override batas kredit per pesanan (`PD-002`).
- Hitungan exposure piutang (`PD-002`, `PD-005`).
- Master produk, gudang, dan mata uang (`C-011`).
- Validasi format NPWP dan pembuatan faktur pajak (`D-24`, `D-51(a)`).

## States

Status pelanggan:

| Status | Arti | Transisi |
|---|---|---|
| `aktif` | bisa dipilih di dokumen baru | `aktif → nonaktif` oleh Penjualan |
| `nonaktif` | tidak bisa dipilih di dokumen baru; data dan dokumen terbuka tetap ada | `nonaktif → aktif` oleh Penjualan |

Setiap perubahan status pelanggan dicatat dengan aktor dan waktu (`D-50`, master). Dokumen yang sudah terbuat tetap memakai data pelanggan yang tersimpan saat dibuat (`D-50`).

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Nama pelanggan kosong | "Nama pelanggan wajib diisi." |
| Termin kosong (diisi default 30) | tidak ada pesan; nilai default 30 |
| Termin bukan bilangan bulat atau negatif | "Termin pembayaran harus berupa jumlah hari, minimal 0." |
| Batas kredit negatif | "Batas kredit tidak boleh negatif." |
| Pengguna tanpa izin mengubah batas kredit | "Anda tidak berwenang mengubah batas kredit pelanggan." |
| Nonaktifkan pelanggan yang dipilih untuk dokumen baru | tidak terjadi: pelanggan nonaktif tidak muncul di pilihan (lihat AC) |

## Batasan

- Data pelanggan tidak boleh dihapus setelah dipakai dokumen (`D-50`, `analisis-sia.md` §7.1 prinsip 3).
- Modul tidak membaca tabel modul lain; data pelanggan untuk laporan lintas siklus lewat service core (`D-25`).
- Tabel `pelanggan` dimiliki `core/`; modul memiliki layar dan aturan alurnya (`D-31`).
- Termin dan batas kredit adalah nilai master. Perubahannya tidak mengubah dokumen yang sudah dibuat.
- Batas kredit ≥ 0. Termin bilangan bulat ≥ 0 hari.
- Data kontak (telepon, email, alamat) diperlakukan sebagai data pribadi tingkat dasar: hanya peran Penjualan, Accounting, dan Manajemen yang dapat membacanya melalui dokumen; tidak diekspor di versi awal (`[USULAN-AGEN]`).

## Dependensi

- `FND-003` — autentikasi dan peran (wajib `done`).
- Gate fondasi `FND-001`–`FND-006` (`backlog.md`).
- `FND-007` — UI kit (tabel, form, status badge) dipakai daftar dan form pelanggan; mengikuti aturan gate di `backlog.md`.

## Yang membuka jalan

- `PD-002` — pesanan memakai termin dan batas kredit.

## Catatan serah terima

Semua pertanyaan sudah dijawab (`00-discussion.md`). Baris matriks izin untuk "ubah batas kredit" (Manajemen) belum ada di `matriks-izin.md`; baris ini ditambahkan lewat `FND-003` sebagai revisi `D-33`.
