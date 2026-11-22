---
id: FND-003
slug: autentikasi-peran-rls
title: Autentikasi dan 13 peran (12 staf + Karyawan self-service) dengan RLS
epic: EPIC-FND
milestone: M0
lane: active
sequence: 3
type: feature
req_status: specified
delivery_status: done
priority: unset
size: unset
depends_on:
  - FND-002
blocks:
  - C-014
  - FND-004
  - FND-006
  - GJ-001
  - PD-001
  - PG-001
owner_role: tech lead
package: docs/product/items/FND-003-autentikasi-peran-rls
---

# FND-003 — Autentikasi dan 12 peran staf dengan RLS

Catatan judul: `D-53` menambah peran ke-13 (Karyawan). Judul di front matter mengikuti `backlog.md` dan perlu diselaraskan koordinator; isi item mencakup 13 peran.

## Masalah

Login sudah ada, tetapi sistem belum tahu siapa staf dan apa perannya. Tanpa itu, siapa pun yang masuk bisa melakukan aksi apa pun, dan pembatasan hanya bisa berupa tampilan menu yang bisa dilewati.

## Outcome

Staf masuk dengan akunnya dan hanya bisa melihat serta menjalankan aksi sesuai dari 12 peran staf. Karyawan (peran ke-13, `D-53`) masuk hanya untuk presensi dan lembur miliknya sendiri. Permintaan tanpa sesi ditolak. Pengguna dengan sesi sah tetapi tanpa peran tidak bisa membaca atau mengubah data domain. Perubahan peran atau penonaktifan akun mencabut sesi yang sedang berjalan (`D-48`).

## Aktor

| Aktor | Peran |
|---|---|
| Staf (12 peran) | masuk; melakukan aksi sesuai peran (`D-33`) |
| Karyawan (peran ke-13) | masuk; presensi, lembur, dan riwayat presensi miliknya sendiri (`D-53`) |
| Tech lead | pemilik item; menetapkan kebijakan RLS dasar; mengelola akun (`D-33`) |
| Pengguna tanpa akun (pelanggan, pemasok, karyawan tanpa akun) | tidak masuk ke aplikasi (`D-18`, `D-23`, `D-53`) |

Daftar 13 peran (sah, `D-33` dan `D-53`): Penjualan, Pengiriman, Gudang, Purchasing, QC, Produksi, Accounting, Finance, Manajemen, Direksi, HR, Supervisor Lapangan, Karyawan.

## Cakupan

### Termasuk

- Masuk, keluar, dan sesi dari Supabase Auth yang sudah ada; sesi berlaku 8 jam (`D-42`).
- Akun di tabel `profiles` (`OQ-03-11`): kolom `peran` (wajib, salah satu dari 13), `aktif`, dan `karyawan_id` (opsional, hanya untuk peran Karyawan).
- Satu akun satu peran (`D-48`).
- Penerapan matriks izin v0 (`D-33`) per aksi, lewat satu fungsi izin yang dipakai server dan menu (`OQ-03-10`).
- Pembacaan peran dari sesi sah pada setiap permintaan (A1).
- Kebijakan RLS dasar pada setiap tabel domain yang ada (`OQ-03-09`). Tanpa peran atau tanpa sesi, tidak ada baris yang terbaca atau berubah.
- Pembatasan per pemilik untuk Karyawan di database: hanya baris dengan `karyawan_id` milik sesi itu. Mekanisme ini disediakan item ini; tabel presensi (`GJ-002`) memakainya.
- Penolakan aksi di server untuk peran yang tidak berwenang, dengan pesan yang bisa dibaca.
- Pencabutan sesi saat akun dinonaktifkan atau peran berubah (`D-48`).
- Login gagal dengan pesan generik (`D-42`).

### Tidak termasuk

- Approval berjenjang dan nominal (`FND-004`).
- Portal pelanggan, pemasok (`D-23`). Pendaftaran mandiri dimatikan (`OQ-03-05`).
- Pemisahan tugas yang spesifik di pemilik aksi (`PD-004`, `GJ-006`, `PG-005`, `FND-004`); item ini menyediakan identitas sesi untuk pengecekan itu.
- Layar menu per peran di item pemilik layar; `FND-007` hanya menyediakan primitive.

## Status dan transisi

| Status akun | Arti | Transisi |
|---|---|---|
| `tanpa peran` | akun sah, belum punya peran | → `aktif` setelah peran diberikan (tech lead, `D-33`) |
| `aktif` | masuk dan melakukan aksi sesuai peran | → `nonaktif` (tech lead); → `aktif` dengan peran berubah (tech lead) |
| `nonaktif` | tidak bisa masuk atau melakukan aksi | → `aktif` (tech lead) |

Setiap transisi akun ke `nonaktif` atau perubahan peran pada akun `aktif` mencabut sesi aktif akun itu (`D-48`). Permintaan berikutnya dengan sesi lama ditolak dan pengguna diarahkan ke `/login`. Jejak transisi akun: kolom audit `updated_by` dan `updated_at` di `profiles` (`D-32`). `riwayat_status` (`D-08`) hanya untuk dokumen, sehingga tidak dipakai untuk akun.

## Matriks izin dan pembatasan Karyawan

- Hak aksi per peran mengikuti `policies/matriks-izin.md` (`D-33`). Baris pada matriks adalah sumber tunggal; fungsi izin di kode dan kebijakan RLS mengikuti baris itu.
- Karyawan (`D-53`): mencatat presensi masuk dan pulang miliknya, mengajukan lembur dengan nomor SPL, dan melihat riwayat presensinya sendiri. Tidak ada akses ke data karyawan lain atau ke menu lain. Penolakan di database, bukan hanya di layar.
- Karyawan yang juga memegang peran staf tidak mendapat akun Karyawan kedua; presensinya dicatat HR atas namanya (`OQ-03-04`, `[USULAN-AGEN]`).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Teks |
|---|---|---|
| Permintaan tanpa sesi ke halaman terlindungi | diarahkan ke `/login`; tidak ada data | (tidak ada teks) |
| Login dengan akun tidak ada, sandi salah, atau akun nonaktif | ditolak; pesan sama untuk semua kasus (`D-42`) | "Username atau password salah." |
| Sesi sah, tanpa peran | aksi ditolak | "Akun Anda belum memiliki peran. Hubungi pengelola akun." |
| Aksi tidak diizinkan peran | ditolak di server; tidak ada perubahan | "Peran Anda tidak berwenang melakukan tindakan ini." |
| Sesi berakhir (8 jam) atau dicabut | diarahkan ke `/login` | "Sesi Anda sudah berakhir. Silakan masuk lagi." |
| Peran di luar 13 | ditolak database; tidak tersimpan | pesan teknis, menyebut nama constraint |
| Dua peran untuk satu akun | ditolak database | pesan teknis, menyebut nama constraint |
| Karyawan membaca data karyawan lain | hasil kosong; tidak ada pesan yang membocorkan keberadaan data | "Data tidak ditemukan." |
| Klien mengirim `user_id` atau `actor_id` sendiri | nilai itu diabaikan; identitas dari sesi | (tidak ada teks) |
| Pendaftaran mandiri dicoba | tidak tersedia | (tidak ada tautan daftar) |

## Pemisahan tugas (`D-42`, `D-48`)

Aturan yang ditegakkan sistem dan diuji sebagai AC di item pemilik aksi:

- Pemohon PR tidak menyetujui PR-nya (`FND-004`, `PG-002`).
- Pemohon PR tidak membayar invoice dari PR itu (`PG-009`).
- Penghitung gaji tidak membayar gaji (`GJ-006`).
- Pembuat pesanan penjualan tidak mengirim barangnya (`PD-004`).
- Pemohon tidak menyetujui dokumen apa pun miliknya (`D-48`, `FND-004`).

Item ini menyediakan identitas sesi dan peran yang dipakai pengecekan itu.

## Batasan

- Peran tidak disimpan di token (analisis §10.1 `[USULAN]`); peran dibaca dari `profiles` per permintaan.
- Sesi berlaku 8 jam (`D-42`).
- Penyembunyian menu hanya kenyamanan; penolakan wajib di server dan database.
- Tidak ada peran selain 13 peran tanpa keputusan (`ARCH-09`, diselaraskan `D-53`).
- Data pribadi: `profiles` memuat nama login, peran, status aktif, dan tautan karyawan. Yang boleh melihat: pemilik akun untuk data sendiri, tech lead untuk seluruh akun. Karyawan tidak melihat `profiles` orang lain.

## Dependensi

- `FND-002`: tabel dasar (`satuan`, `produk`, `gudang`) yang diberi RLS.
- Login dan callback Supabase Auth yang sudah ada (`FND-001` baseline).

## Yang membuka jalan

- `FND-004`: approval membutuhkan identitas dan peran.
- `FND-006`: posting jurnal membutuhkan pembatasan penulisan dan identitas aktor.
- `C-014`, `PD-001`, `PG-001`, `GJ-001`: master dan dashboard membutuhkan aturan siapa yang boleh mengubah.
- `GJ-002` memakai pembatasan per pemilik untuk presensi.

## Catatan serah terima

- Matriks peran per aksi sudah disahkan (`D-33`); AC-03 final.
- Kebijakan RLS per tabel mengikuti `OQ-03-09`; tabel baru wajib punya RLS sejak migrasinya.
- Runner uji pertama diperkenalkan di item ini (`OQ-02-11`).
