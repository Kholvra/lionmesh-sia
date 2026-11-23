---
id: FND-004
slug: dokumen-nomor-status-approval
title: Dokumen: penomoran, status, riwayat, dan approval berjenjang
epic: EPIC-FND
milestone: M0
lane: active
sequence: 4
type: feature
req_status: done
delivery_status: done
priority: unset
size: unset
depends_on:
  - FND-002
  - FND-003
blocks:
  - C-012
  - C-013
  - C-014
  - GJ-002
  - GJ-005
  - PD-002
  - PG-003
  - PR-002
owner_role: tech lead
package: docs/product/items/FND-004-dokumen-nomor-status-approval
---

# FND-004 — Dokumen: penomoran, status, riwayat, dan approval berjenjang

## Masalah

Setiap modul yang membuat dokumen akan menentukan nomornya sendiri, mencatat status dengan caranya sendiri, dan menyetujui dengan aturannya sendiri. Hasilnya nomor ganda, status yang tidak konsisten, dan tidak ada jawaban atas "siapa yang menyetujui ini?".

## Outcome

Setiap dokumen baru mendapat nomor unik yang dibuat sistem dengan format `{TIPE}/{TAHUN}/{BULAN}/{URUT}`. Setiap perubahan status tercatat dengan aktor dan waktu, dan riwayat lama tidak berubah. Dokumen yang butuh persetujuan berjenjang tidak selesai sebelum semua level menyetujui. Dokumen tidak dihapus; yang dibatalkan tetap terlihat dengan statusnya.

## Aktor

| Aktor | Peran |
|---|---|
| Pembuat dokumen (pemohon) | membuat dokumen, mengajukan, merevisi, dan membatalkan sebelum posting |
| Pemroses dokumen | memeriksa, menyetujui per level, menolak, atau meminta revisi sesuai peran (`D-33`, `D-51` c) |
| Pemilik modul | mendaftarkan jenis dokumen, kode `TIPE`, dan status per jenis (`D-46`, `D-47`) |
| Tech lead | pemilik item; mengelola seed aturan approval (`D-51` c) |

## Cakupan

### Termasuk

- Penomoran per jenis dokumen dengan format `D-50`, dibuat saat dokumen dibuat.
- Riwayat status untuk semua jenis dokumen dalam satu tabel `riwayat_status` (`D-08`), append-only.
- Mesin status generik dengan daftar transisi yang sah (tabel di bawah) dan penambalan `D-47`.
- Approval berjenjang satu mesin (`D-37`) dengan aturan per jenis dan ambang nominal opsional.
- Pembatalan sebelum posting dengan alasan wajib; revisi yang menggugurkan approval; penolakan dengan alasan wajib (`D-48`).
- Pemisahan tugas: pemohon tidak menyetujui dokumen apa pun miliknya (`D-48`, memperluas `D-42`).
- Penanganan konkurensi saat dua orang memproses dokumen yang sama.
- Larangan hapus dokumen.

### Tidak termasuk

- Daftar jenis dokumen dan layar setiap siklus (milik modul).
- Notifikasi approval (`C-012`).
- Dashboard "menunggu tindakan saya" (`C8` = `C-014`, `D-38`).
- Jurnal pembalik saat pembatalan setelah posting (`FND-006`; `D-35`).
- Tabel `lampiran` (`D-31`, dibuat item pertama yang membutuhkan).

## Penomoran

- Format: `{TIPE}/{TAHUN}/{BULAN}/{URUT}` (`D-50`), contoh bentuk `PO/2026/11/0001` untuk jenis PO. Kode `TIPE` didaftarkan pemilik modul per jenis dokumen.
- `URUT` empat digit, dihitung per tipe per tahun dan bulan kalender dari tabel `dokumen_counter` dengan `UPDATE ... RETURNING` dalam transaksi yang sama dengan pembuatan dokumen.
- Nomor tidak pernah dipakai ulang dan tidak dibuat dari hitungan baris.
- Nomor dibuat sekali saat dokumen dibuat (status `DRAFT`) dan tidak berubah.

## Status dan transisi

Daftar status mengikuti state machine di `diagram-sia-lengkap.md` §5 (`D-46`). Penambalan `D-47` hanya dari sumber yang ada. Tidak ada status di luar daftar ini tanpa keputusan baru.

| Dari | Ke | Oleh | Syarat | Jejak (`riwayat_status`) |
|---|---|---|---|---|
| (baru) | `DRAFT` | pembuat | nomor dibuat | `BUAT` |
| `DRAFT` | `DIAJUKAN` | pembuat | — | `AJUKAN` |
| `DIAJUKAN` | `DIPERIKSA` | pemroses level 1 | pemroses bukan pembuat (`D-48`) | `PERIKSA` |
| `DIPERIKSA` | `DIPERIKSA` (level berikutnya) | pemroses level n | level n-1 sudah `SETUJUI` | `SETUJUI` level n |
| `DIPERIKSA` | `DISETUJUI` | pemroses level terakhir | semua level sudah `SETUJUI` | `SETUJUI` terakhir |
| `DIPERIKSA` | `DITOLAK` (final) | pemroses | alasan wajib (`D-48`) | `TOLAK` |
| `DIAJUKAN`, `DIPERIKSA` | `REVISI` | pemroses | — | `REVISI`; approval sebelumnya gugur (`D-48`) |
| `REVISI` | `DRAFT` | pembuat | — | `REVISI_SELESAI` |
| `DISETUJUI` | `DIPROSES` | pemroses | — | `PROSES` |
| `DIPROSES` | `SELESAI` | pemroses | — | `SELESAI` |
| `DRAFT`, `DIAJUKAN`, `REVISI`, `DIPERIKSA`, `DISETUJUI` | `DIBATALKAN` (final) | pembuat (pemohon) | alasan wajib; belum diposting (`D-48`) | `BATAL` |

Penambalan dari `D-47` (dicatat oleh pemilik modul, bukan item ini):

- Pesanan (`PD-002`): `VERIFIED` → `MENUNGGU_PERSETUJUAN_KREDIT` bila exposure melebihi batas; kembali ke `VERIFIED` lewat override dengan alasan, atau ke `DIBATALKAN`.
- Pengiriman (`PD-004`): `DIKIRIM` → `DITERIMA` (bukti terima); tidak memakai `TERKONFIRMASI_PELANGGAN`.
- Periode payroll (`GJ-005`): `REKAP` → `TERBUKA` (rekap dikembalikan ke HR).
- Pembatalan PR dan PO tidak menambah status; memakai `DIBATALKAN` (`D-48`). `D-47` (d) dan `D-48` diselaraskan koordinator.

Aturan umum:

- `DITOLAK` dan `DIBATALKAN` bersifat final. Status tidak pernah mundur setelah posting (`D-48`).
- Dokumen dianggap **diposting** ketika modul pemilik menulis efek stok atau jurnal pada transaksi yang sama dengan perubahan status (`[USULAN-AGEN]` di 00). Setelah diposting, `DIBATALKAN` ditolak dan koreksi lewat jurnal pembalik (`D-35`).

## Approval berjenjang

- Satu mesin (`D-37`). Aturan per jenis dokumen di tabel `aturan_approval`: jenis, level, peran pemroses, ambang nominal (opsional), aktif.
- Seed awal (`D-51` c, placeholder bertanda belum final): permintaan pembelian satu level peran Manajemen untuk semua nominal; payroll satu level peran Direksi; pembayaran pemasok tanpa aturan (tidak berjenjang).
- Ambang nominal dapat diubah lewat data tanpa mengubah kode (analisis §8.2 #10 `[USULAN]`).
- Level berikutnya hanya bisa menyetujui setelah level sebelumnya menyetujui.
- Setiap persetujuan per level menulis satu baris `riwayat_status` (aksi `SETUJUI`, nomor level, aktor, waktu). Tidak ada tabel approval terpisah.
- Pemohon tidak boleh menyetujui dokumen apa pun miliknya (`D-48`). Untuk PR berlaku juga `D-42`.
- Revisi menggugurkan approval yang sudah ada. Dokumen harus diajukan dan diperiksa ulang dari level 1; riwayat lama tetap ada.
- Menolak wajib alasan; membatalkan wajib alasan (`D-48`).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Teks |
|---|---|---|
| Transisi yang tidak ada di tabel status | ditolak; status tidak berubah | "Status {asal} tidak bisa diubah menjadi {tujuan}." |
| Dua pemroses atau dua pengguna memproses dokumen sama | yang kedua ditolak; tidak ada perubahan ganda | "Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru." |
| Pemohon mencoba menyetujui dokumennya | ditolak | "Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri." |
| Dokumen di atas level belum lengkap ingin `DISETUJUI` atau `DIPROSES` | ditolak | "Persetujuan level {n} belum lengkap." |
| Penolakan atau pembatalan tanpa alasan | ditolak | "Isi alasan untuk menolak atau membatalkan dokumen." |
| Pembatalan setelah posting | ditolak | "Dokumen sudah diposting. Batalkan lewat jurnal pembalik." |
| Percobaan hapus dokumen | ditolak; dokumen tetap ada | "Dokumen tidak bisa dihapus. Gunakan pembatalan." |
| Status dari modul di luar daftar `D-46`/`D-47` | ditolak | pesan teknis, menyebut status |

## Batasan

- Nomor tidak pernah dipakai ulang atau dibuat dari hitungan baris.
- Riwayat bersifat tambah-saja (append-only): tidak ada `UPDATE` atau `DELETE` pada `riwayat_status`.
- Dokumen yang diposting tidak diedit (`D-43`, `D-48`).
- Master nonaktif tidak bisa dipilih untuk dokumen baru (`D-50`); pemeriksaan dilakukan item pemilik master.

## Data pribadi

Tidak ada data pribadi baru. Aktor yang tercatat di `riwayat_status` adalah identitas sesi (`FND-003`).

## Dependensi

- `FND-002`: tabel dasar.
- `FND-003`: identitas dan peran pemroses; pembatasan pemohon tidak menyetujui.

## Yang membuka jalan

- `PD-002`, `PG-003`, `PR-002`, `GJ-002`, `GJ-005`, `C-012`, `C-013`, `C-014`.

## Catatan serah terima

- Ambang nominal dan level approval (`D-37`, `D-51` c) adalah data bisnis; seed awal bertanda belum final. Agen tidak mengisi angka ambang.
- Daftar kode `TIPE` disepakati pemilik modul saat jenis dokumen didaftarkan.
