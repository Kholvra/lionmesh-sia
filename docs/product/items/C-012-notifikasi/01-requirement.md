---
id: C-012
slug: notifikasi
title: Notifikasi in-app dan email
epic: EPIC-CORE
milestone: M1–M2
lane: active
sequence: 4
type: feature
req_status: specified
delivery_status: not_started
priority: P2
size: M
depends_on:
  - FND-004
blocks: []
owner_role: tech lead
package: docs/product/items/C-012-notifikasi
---

# C-012 — Notifikasi in-app dan email

## Masalah

Staf harus membuka modul satu per satu untuk mengetahui ada dokumen atau keputusan yang menunggu mereka. Tidak ada cara terpusat untuk mengetahuinya.

## Outcome

Pengguna yang berhak menerima notifikasi:

- melihat notifikasi di dalam aplikasi;
- menerima email untuk notifikasi yang memang dikirim lewat email;
- dapat melihat status setiap pengiriman, apakah `menunggu`, `terkirim`, `gagal`, atau `perlu_pemeriksaan`.

Pengguna yang tidak berhak tidak melihat notifikasi itu.

## Aktor

| Aktor | Peran |
|---|---|
| Penerima | staf yang berhak; peran per jenis notifikasi (PT-02, `[USULAN-AGEN]`) |
| Pemicu | modul atau core yang mengalami kejadian; daftar kejadian (PT-01, `[USULAN-AGEN]`) |
| Sistem (core) | menyimpan notifikasi, mengirim email, dan mencatat status |

## Cakupan

### Termasuk

- Notifikasi in-app untuk penerima yang berhak.
- Email untuk kejadian yang ditandai kanal email (PT-01 dan PT-02, `[USULAN-AGEN]`).
- Antrean kirim email dengan status.
- Kejadian (PT-01, `[USULAN-AGEN]`, dari makalah): PR disetujui atau ditolak (kirim ke Purchasing); payroll diverifikasi (ke Direksi), disetujui (ke Finance), dibayar (ke HR untuk slip). Sumber: Makalah_Siklus_Produksi.txt dan makalah_siklus_penggajian.txt.

### Tidak termasuk

- WhatsApp: di luar cakupan (`D-52`). Sumber lama bertentangan (analisis §5.6 "masuk" vs §8.2 #12 "menyusul"; D-01 tidak memberi ruang untuk item menyusul). Keputusan: PT-04 (`D-52`).
- Dashboard "menunggu tindakan saya" (C8): belum punya item.
- Preferensi pengguna: ditunda (`D-50`, PT-08).
- Penyedia email dan kredensial: satu adaptor di core, dipilih saat implementasi (PT-03, `[USULAN-AGEN]`).

## Status dan transisi

| Entitas | Dari | Ke | Pemicu |
|---|---|---|---|
| Notifikasi in-app | `belum dibaca` | `sudah dibaca` | penerima membuka notifikasi `[USULAN]` |
| Pengiriman email | `menunggu` | `perlu_pemeriksaan` | diklaim sebelum permintaan ke penyedia; hasil belum pasti |
| Pengiriman email | `perlu_pemeriksaan` | `terkirim` | penyedia menyatakan berhasil dan hasil tercatat |
| Pengiriman email | `menunggu` | `gagal` | alamat penerima kosong |
| Pengiriman email | `gagal` | — | tidak ada transisi keluar; tidak ada kirim ulang manual di versi awal (PT-07) |

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Alamat email penerima kosong | pengiriman email ditandai `gagal` dengan alasan yang bisa dibaca; notifikasi in-app tetap ada |
| Penyedia email tidak bisa dijangkau atau hasil tidak pasti | status `perlu_pemeriksaan`, tanpa retry otomatis; transaksi pemicu tidak gagal |
| Penerima tidak berhak | notifikasi tidak muncul di daftarnya |

Teks final ditentukan implementasi.

## Batasan

- Notifikasi tidak boleh membuka data yang tidak boleh dilihat penerima.
- Isi email tidak memuat angka keuangan. Isinya judul kejadian, nomor dokumen, dan tautan (PT-05, `[USULAN-AGEN]`).
- Kanal email tidak boleh dipanggil langsung dari modul (`D-25`, lewat core).
- Slip gaji ke karyawan tetap dicetak (`D-18`). Email slip karyawan dari makalah_siklus_penggajian.txt tidak masuk C-012 kecuali D-18 diubah.

## Dependensi

- `FND-004` harus `done`: dokumen, status, dan approval, yang menjadi sumber kejadian.
- `FND-007` (UI kit) sebagai dependensi koordinasi (PT-06, `[USULAN-AGEN]`). Bukan `depends_on` backlog.

## Yang membuka jalan

- Belum ada item di backlog yang `depends on` `C-012`. Lihat PT-09 dan `C-013` untuk kemungkinan kejadian pengadaan.

## Catatan serah terima

Prioritas di analisis (P2) berbeda dari level di backlog (1). Urutan sudah ditulis di `D-34` (gelombang 2); prioritas P2 disahkan `D-50`.

Nomor urut `sequence: 4` mengikuti urutan baris Core di `backlog.md`. Lihat catatan di `C-009`.

## Klarifikasi tech lead 2026-11-24

Kebijakan tiga retry PT-07 diganti untuk hasil pengiriman tidak pasti: status `perlu_pemeriksaan` disimpan sebelum memanggil penyedia dan tidak dicoba ulang otomatis, termasuk setelah timeout, crash atau kegagalan menyimpan hasil. Pengiriman ulang atau rekonsiliasi manual melalui UI belum tersedia; verifikasi dilakukan di penyedia oleh operator. Alamat kosong tetap `gagal`.
