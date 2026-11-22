---
id: C-010
slug: tutup-buku
title: Tutup buku dan jurnal penutup
epic: EPIC-CORE
milestone: M1–M2
lane: active
sequence: 2
type: feature
req_status: specified
delivery_status: not_started
priority: P1
size: M
depends_on:
  - C-009
  - FND-006
blocks:
  - INT-001
owner_role: tech lead
package: docs/product/items/C-010-tutup-buku
---

# C-010 — Tutup buku dan jurnal penutup

## Masalah

Setelah laporan keuangan ada, jurnal periode yang sudah selesai masih bisa berubah. Laporan periode lalu jadi tidak stabil, dan tidak ada cara menyatakan bahwa sebuah periode sudah final.

## Outcome

Pengguna yang berwenang dapat menutup sebuah periode akuntansi. Setelah ditutup:

- jurnal baru dengan tanggal di periode itu ditolak, dengan pesan yang menyebut periode yang terkunci;
- penutupan periode bulanan hanya mengunci jurnal periode itu (D-50);
- tutup buku tahunan membuat jurnal penutup: saldo akun pendapatan dan beban (401, 501, 601, 602, 701; 702 dicadangkan, D-41) dipindah ke 302 Laba ditahan, sehingga saldo akun itu nol. Sisa 601 dan 602 ikut ditutup (`[USULAN-AGEN]`, PT-12). Ini terjadi pada tutup buku akhir tahun, bukan pada setiap penutupan periode (D-44 (5), PT-11);
- laporan `C-009` untuk periode itu tetap sama.

## Aktor

| Aktor | Peran |
|---|---|
| Accounting | menutup periode bulanan dan tutup buku tahunan (D-50). Buka kembali tidak ada (D-44 (5)) |
| Sistem (`postJournal()`, `FND-006`) | menolak posting ke periode terkunci |
| Pembaca laporan (`C-009`) | membaca periode yang sudah ditutup |

## Cakupan

### Termasuk

- Penutupan periode akuntansi menjadi terkunci.
- Jurnal penutup untuk periode yang ditutup.
- Penolakan posting ke periode terkunci sebagai perilaku yang terlihat.
- Tutup buku tahunan: status tahun buku dan sisa 601 dan 602 (PT-12, `[USULAN-AGEN]`).
- Pembukaan kembali periode tidak termasuk (D-44 (5)).

### Tidak termasuk

- Tabel `periode_akuntansi` dan COA: milik `FND-006`.
- Penguncian payroll: milik `GJ-5` (`GJ-005`). Tutup buku tidak mengunci payroll (analisis §8.3).
- Penguncian dokumen sumber: tidak termasuk (PT-02, `[USULAN-AGEN]`).
- Laporan itu sendiri: milik `C-009`.

## Status dan transisi

| Dari | Ke | Pemicu | Siapa | Jejak |
|---|---|---|---|---|
| `terbuka` | `terkunci` | tutup periode bulanan | Accounting (D-50) | tercatat di `riwayat_status` (D-32, PT-05) |
| `terkunci` | — | buka kembali tidak ada (D-44 (5)); koreksi lewat jurnal pembalik di periode berjalan | — | — |

Tahun buku (`[USULAN-AGEN]`, PT-12):

| Dari | Ke | Pemicu | Syarat |
|---|---|---|---|
| `terbuka` | `ditutup` | tutup buku tahunan | semua 12 periode bulanan `terkunci`; prasyarat D-50 terpenuhi |

Jalur gagal:

| Kondisi | Perilaku |
|---|---|
| Tutup periode yang sudah `terkunci` | ditolak; status tidak berubah |
| Tutup periode yang belum boleh ditutup karena prasyarat gagal (PT-07) | ditolak; pesan menyebut prasyarat yang gagal (neraca saldo tidak balance atau ada dokumen setengah posting); status tetap `terbuka` |
| Tutup periode yang melompati periode sebelumnya (PT-04) | ditolak; pesan menyebut periode yang belum ditutup |
| Posting ke periode `terkunci` | ditolak; tidak ada baris jurnal tersimpan |

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Posting dengan tanggal di periode terkunci | ditolak; pesan menyebut periode yang terkunci |
| Penutupan periode yang sudah terkunci | ditolak; pesan menyatakan periode sudah ditutup |
| Penutupan melompati periode sebelumnya | ditolak; pesan menyebut periode yang belum ditutup (PT-04, `[USULAN-AGEN]`) |
| Akun laba ditahan tidak tersedia di COA | ditolak; pesan menyebut akun yang kurang; penutupan tidak sebagian |

Teks final ditentukan implementasi.

## Batasan

- Jurnal penutup hanya lewat `postJournal()` (`D-07`).
- Penutupan atomik: semua jurnal penutup tersimpan, atau tidak ada yang tersimpan.
- Tutup buku tidak mengubah status dokumen sumber (PT-02, `[USULAN-AGEN]`).
- Pengaturan mata uang dan kurs di luar item ini.

## Dependensi

- `C-009` harus `done`: laporan dipakai untuk memeriksa neraca sebelum penutupan.
- `FND-006` harus `done`. Backlog kini mencantumkannya di `depends_on` (PT-09 terjawab).

## Yang membuka jalan

- `INT-001`: jurnal gabungan memerlukan jurnal penutup dan penolakan posting ke periode tertutup.

## Catatan serah terima

Prasyarat penutupan (PT-07) sudah diputuskan (`D-50`): neraca saldo balance dan tidak ada dokumen setengah posting.

Koreksi periode tertutup dibuat sebagai jurnal pembalik di periode berjalan (D-44 5).

Nomor urut `sequence: 2` mengikuti urutan baris Core di `backlog.md`, sama seperti `C-009`. Lihat catatan di sana.
