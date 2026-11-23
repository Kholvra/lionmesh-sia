---
id: C-014
slug: dashboard
title: Dashboard ringkasan dan antrean tindakan
epic: EPIC-CORE
milestone: M1–M2
lane: active
type: feature
req_status: ready
delivery_status: not_started
priority: P1
size: M
depends_on:
  - FND-003
  - FND-004
blocks: []
owner_role: tech lead
package: docs/product/items/C-014-dashboard
---

# C-014 — Dashboard

## Masalah dan outcome

Pengguna perlu menemukan pekerjaan yang menunggu tanpa memeriksa setiap siklus. Dashboard `/` menampilkan ringkasan dan antrean tindakan aktual yang dapat dilakukan pengguna saat ini, dari sumber yang sudah tersedia. Dashboard tidak menjadi satu-satunya jalur ke pekerjaan.

## Aktor dan izin

Pengguna bersesi melihat hanya dokumen yang boleh dilihat dan ditindaklanjuti menurut peran, status, dan pemisahan tugas. Pembuat tidak dapat menyetujui dokumennya sendiri. Karyawan tetap dibatasi D-53; data pribadi dan dokumen tanpa izin tidak ditampilkan atau dihitung. Sesi tidak sah diarahkan ke login.

## Cakupan

- Kartu per siklus yang dapat diakses menghitung dokumen berbeda yang dapat ditindaklanjuti, dari himpunan yang sama dengan antrean.
- Antrean menampilkan nomor, jenis, siklus, tahap dan waktu mulai menunggu, tertua dahulu. Nomor menjadi tautan hanya bila halaman tersedia dan pengguna berhak.
- Sumber yang belum diimplementasikan ditandai “Belum tersedia”; sumber gagal menampilkan pesan dan cara mencoba lagi, bukan nol. Antrean kosong menampilkan “Tidak ada tindakan yang menunggu”.
- Integrasi sumber masa depan dilakukan oleh item pemilik alur atau item integrasi; tidak ada data contoh atau status fiktif.
- Pola dashboard dan shell mengikuti `docs/design/`; keterkaitan antarsiklus hanya menampilkan fakta yang sumber dan maknanya tersedia, selain itu menunjukkan keadaan belum tersedia.

## Batas dan status

Layar hanya membaca melalui core/read model yang berwenang, tidak membaca tabel modul lain langsung dan tidak mengubah status atau mengeksekusi tindakan. Notifikasi dan email dimiliki C-012. Ekspor laporan di luar cakupan D-59. Tampilkan loading, kosong, error, dan unauthorized; saat sebagian sumber gagal, kartu terdampak menyatakan gagal dan jumlah total tidak disajikan sebagai lengkap. Angka dan baris diperoleh dari hasil terotorisasi yang sama.

## Dependensi dan prioritas

FND-003 dan FND-004 `done`; gate FND-001–FND-009 terpenuhi. D-59 tetap mendahulukan pengerjaan C-011 dan C-013. C-014 tidak mensyaratkan penyelesaian sumber siklus yang belum tersedia.
