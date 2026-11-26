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
- tutup buku tahunan membuat jurnal penutup: saldo akun pendapatan dan beban (401, 501, 601, 602, 701; 702 dicadangkan, D-41) dipindah ke 302 Laba ditahan, sehingga saldo akun itu nol. Sisa 601 dan 602 ikut ditutup (`[USULAN-AGEN]`, PT-12). Ini terjadi pada tutup buku akhir tahun, bukan pada setiap penutupan periode (D-44 (5), PT-11). Jan–Nov harus `kunci`; Desember masih `buka` dan dikunci oleh prosedur tutup tahun itu sendiri (D-68);
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
- Tutup buku tahunan: status tahun buku, Desember reserved, dan sisa 601 dan 602 (PT-12, `[USULAN-AGEN]`; D-58, D-68).
- Pembukaan kembali periode tidak termasuk (D-44 (5)).

### Tidak termasuk

- Tabel `periode_akuntansi` dan COA: milik `FND-006`.
- Penguncian payroll: milik `GJ-5` (`GJ-005`). Tutup buku tidak mengunci payroll (analisis §8.3).
- Penguncian dokumen sumber: tidak termasuk (PT-02, `[USULAN-AGEN]`; D-58, D-68).
- Laporan itu sendiri: milik `C-009`.

## Status dan transisi

| Dari | Ke | Pemicu | Siapa | Jejak |
|---|---|---|---|---|
| `buka` | `kunci` | tutup periode bulanan, kecuali Desember (D-68) | Accounting (D-50) | `periode_akuntansi_riwayat_status` (D-32, D-63, PT-05) |
| `kunci` | — | buka kembali tidak ada (D-44 (5)); koreksi lewat jurnal pembalik di periode berjalan | — | — |

Desember tidak ditutup lewat jalur bulanan; Desember hanya dikunci oleh tutup buku tahunan (D-68). UI menampilkan `buka`/`kunci` sebagai "Terbuka"/"Terkunci".

Tahun buku (`[USULAN-AGEN]`, PT-12; D-68):

| Dari | Ke | Pemicu | Syarat |
|---|---|---|---|
| `terbuka` | `ditutup` | tutup buku tahunan | Jan–Nov `kunci`; Desember `buka`/belum ada; prasyarat D-50; prosedur memposting jurnal penutup di Desember lalu mengunci Desember; setelah commit 12/12 `kunci` |

Jalur gagal:

| Kondisi | Perilaku |
|---|---|
| Tutup periode yang sudah `kunci` | ditolak; status tidak berubah |
| Tutup periode yang belum boleh ditutup karena prasyarat gagal (PT-07) | ditolak; pesan menyebut prasyarat yang gagal (neraca saldo tidak balance atau ada dokumen setengah posting); status tetap `buka` |
| Tutup periode yang melompati periode sebelumnya (PT-04) | ditolak; pesan menyebut periode yang belum ditutup |
| Tutup periode Desember lewat jalur bulanan | ditolak; pesan mengarahkan ke tutup buku tahunan (D-68) |
| Tutup periode M dengan bulan < M yang belum punya baris | bulan itu dibuat `buka` lalu dikunci; tidak diabaikan (D-68) |
| Tutup Januari tanpa `tahun_buku` tahun sebelumnya `ditutup` (bila ada aktivitas) | ditolak; pesan menyebut tutup tahun sebelumnya (D-68) |
| Tutup tahun dengan Jan–Nov ada yang `buka` | ditolak; pesan menyebut bulan pemblokir paling awal |
| Tutup tahun dengan Desember sudah `kunci` | ditolak; jurnal penutup tidak bisa masuk ke periode terkunci (D-68) |
| Posting ke periode `kunci` | ditolak; tidak ada baris jurnal tersimpan |

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Posting dengan tanggal di periode `kunci` | ditolak; pesan menyebut periode yang terkunci |
| Penutupan periode yang sudah `kunci` | ditolak; pesan menyatakan periode sudah ditutup |
| Penutupan melompati periode sebelumnya | ditolak; pesan menyebut periode yang belum ditutup (PT-04, `[USULAN-AGEN]`; D-58, D-68) |
| Penutupan Desember lewat jalur bulanan | ditolak; pesan menyatakan Desember ditutup lewat tutup buku tahunan (D-68) |
| Penutupan Januari sebelum tutup tahun sebelumnya | ditolak; pesan menyebut tahun yang belum ditutup (D-68) |
| Dokumen setengah posting (dua arah) | ditolak; pesan menyebut dokumen dan arahnya (D-68) |
| Akun laba ditahan tidak tersedia di COA | ditolak; pesan menyebut akun yang kurang; penutupan tidak sebagian |

Teks final ditentukan implementasi.

## Batasan

- Jurnal penutup hanya lewat `post_journal`/`postJournal()` (`D-07`); RPC tutup tahun memanggil jalur yang sama, bukan insert langsung.
- Penutupan atomik: semua jurnal penutup tersimpan, atau tidak ada yang tersimpan.
- Tutup buku tidak mengubah status dokumen sumber (PT-02, `[USULAN-AGEN]`; D-58, D-68).
- Desember tidak ditutup lewat tutup periode bulanan; Desember hanya dikunci oleh tutup buku tahunan (D-68).
- Tutup periode bulanan materialisasi + mengunci bulan sebelumnya yang belum punya baris; Januari menuntut tahun sebelumnya `ditutup` bila ada aktivitas (D-68).
- Setengah posting didefinisikan simetris: `diposting` vs ada-tidaknya jurnal `sumber_id` dokumen di bulan itu; dua arah diblokir (D-68).
- Jurnal penutup hanya dibuat bila ada saldo nominal; saldo nol berarti tidak ada baris jurnal penutup.
- Pengaturan mata uang dan kurs di luar item ini.

## Dependensi

- `C-009` harus `done`: laporan dipakai untuk memeriksa neraca sebelum penutupan.
- `FND-006` harus `done`. Backlog kini mencantumkannya di `depends_on` (PT-09 terjawab).

## Yang membuka jalan

- `INT-001`: jurnal gabungan memerlukan jurnal penutup dan penolakan posting ke periode tertutup.

## Catatan serah terima

Prasyarat penutupan (PT-07) sudah diputuskan (`D-50`): neraca saldo balance dan tidak ada dokumen setengah posting.

Koreksi periode tertutup dibuat sebagai jurnal pembalik di periode berjalan (D-44 5).

D-68 merinci: Desember reserved; materialisasi bulan kosong; Januari butuh tahun sebelumnya ditutup; setengah posting simetris. DDL proposal ada di `06-ddl-proposal.sql`; migrasi menunggu nomor tech lead.

Nomor urut `sequence: 2` mengikuti urutan baris Core di `backlog.md`, sama seperti `C-009`. Lihat catatan di sana.
