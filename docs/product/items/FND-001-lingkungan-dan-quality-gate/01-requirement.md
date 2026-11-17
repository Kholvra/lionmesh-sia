---
id: FND-001
slug: lingkungan-dan-quality-gate
title: Lingkungan pengembangan yang dapat diulang dan gerbang mutu
epic: EPIC-FND
milestone: M0
lane: active
sequence: 1
type: chore
req_status: specified
delivery_status: planned
priority: high
size: M
depends_on: []
blocks:
  - FND-002
  - FND-008
owner_role: tech lead
package: docs/product/items/FND-001-lingkungan-dan-quality-gate
---

# FND-001 — Lingkungan pengembangan yang dapat diulang dan gerbang mutu

## Masalah

Seorang pengembang baru tidak bisa menyiapkan lingkungan kerja hanya dari isi repo. Langkah database masih manual, tidak ada pemeriksaan otomatis, dan tidak ada cara mengembalikan data ke kondisi awal.

Akibatnya, setiap bug yang muncul tidak bisa dibedakan antara kesalahan kode dan kesalahan lingkungan.

## Outcome

Siapa pun yang meng-clone repo dapat menjalankan aplikasi dengan database yang skemanya berasal dari migrasi, mengembalikannya ke kosong, mengisinya dengan data dasar yang sama setiap kali, dan mengetahui apakah perubahannya lolos pemeriksaan — tanpa satu pun langkah manual di dashboard.

## Aktor

| Aktor | Peran |
|---|---|
| Tech lead | pemilik item, menetapkan konvensi migrasi |
| Anggota kelompok | pengguna lingkungan; tidak menulis mekanisme |
| CI | menjalankan pemeriksaan yang sama tanpa manusia |

## Cakupan

### Termasuk

- Perintah tunggal untuk menyiapkan database lokal dari migrasi.
- Perintah tunggal untuk mengosongkan dan mengisi ulang data dasar.
- Pemeriksaan: lint, tipe, build.
- CI yang menjalankan pemeriksaan yang sama pada setiap pull request.
- Dokumentasi langkah-langkah tersebut di `README.md`.
- Konvensi penomoran migrasi yang mencegah tabrakan antar-branch.

### Tidak termasuk

- Skema domain (itu `FND-002`).
- Peran dan RLS (itu `FND-003`).
- Test perilaku (dibuat bersama item pertama yang punya perilaku).
- Deployment produksi.
- Migrasi data dari sistem lama.

## Status dan transisi

Tidak ada state machine. Item ini bersifat infrastruktur.

Satu kondisi yang harus dibedakan secara eksplisit:

| Kondisi | Arti |
|---|---|
| `schema kosong` | tidak ada tabel aplikasi; migrasi belum dijalankan |
| `schema siap` | seluruh migrasi sudah diterapkan |
| `seed terpasang` | data dasar ada, deterministik |

Ketiganya harus bisa dicapai dan dibedakan lewat perintah, bukan tebakan.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Database belum siap saat aplikasi dijalankan | pesan menyebut perintah yang harus dijalankan |
| Migrasi mencoba diterapkan dua kali | tidak error, tidak menduplikasi objek |
| Dua migrasi memakai nomor sama | gagal sebelum menyentuh database, sebut nama file |
| Pemeriksaan tipe gagal | CI merah, menyebut file dan baris |
| Seed dijalankan tanpa reset | menolak, minta reset dulu |

## Batasan

- Tidak boleh ada langkah manual di dashboard untuk lingkungan lokal.
- Penomoran migrasi tidak boleh diubah setelah di-merge.
- Seed tidak boleh bergantung pada tanggal hari ini.
- Pemeriksaan harus berjalan tanpa kredensial produksi.

## Dependensi

Tidak ada. Item ini adalah akar graph.

## Yang membuka jalan

- `FND-002` — skema domain butuh cara menerapkan migrasi.
- `FND-008` — seed butuh reset yang benar.

## Catatan serah terima

Mekanisme konkret dipilih oleh domain implementasi. Requirement ini mengikat **outcome** dan **bukti**, bukan alat.
