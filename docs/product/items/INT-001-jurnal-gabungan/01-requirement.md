---
id: INT-001
slug: jurnal-gabungan
title: Jurnal gabungan konsisten lintas empat siklus
epic: EPIC-INT
milestone: M2
lane: active
sequence: n/a
type: chore
req_status: specified
delivery_status: not_started
priority: P0
size: M
depends_on:
  - C-009
  - C-010
  - FND-008
  - GJ-007
  - PD-008
  - PG-009
  - PG-010
  - PR-007
blocks:
  - INT-002
  - INT-003
owner_role: tech lead
package: docs/product/items/INT-001-jurnal-gabungan
---

# INT-001 — Jurnal gabungan konsisten lintas empat siklus

## Masalah

Empat siklus bisa lolos uji sendiri-sendiri dan tetap menghasilkan sistem yang salah. Jurnal satu siklus bisa benar, tetapi total neraca gabungan tidak balance. Akun bisa menggantung karena dua modul memakai asumsi berbeda.

## Outcome

Setelah seluruh siklus dijalankan dari data uji yang sama, jurnal gabungan konsisten:

- total debit sama dengan total kredit, untuk setiap jurnal dan untuk seluruh jurnal;
- setiap akun yang dipakai dikenal dan aktif;
- setiap baris jurnal punya sumber yang bisa ditelusuri ke dokumen;
- neraca saldo dari `C-009` balance;
- laba rugi dapat ditelusuri ke jurnal per siklus.

## Aktor

| Aktor | Peran |
|---|---|
| Penguji | menjalankan rantai siklus dan membandingkan hasil; tech lead atau yang ditunjuk (PT-08, `[USULAN-AGEN]`) |
| Sistem (core ledger) | menolak jurnal yang tidak balance atau tanpa sumber |
| Pembaca hasil (`C-009`) | menyediakan neraca saldo dan laba rugi |

## Cakupan

### Termasuk

- Jurnal dari `PD-008` (penjualan dan HPP), `PG-009` (pembayaran utang), `PR-007` (PT-01 terjawab: transitif ke `PR-006`), dan `GJ-007` (payroll). Pemetaan jurnal per kejadian: lihat `00` PT-02.
- Pemeriksaan keseimbangan, akun, dan sumber untuk seluruh jurnal.
- Penelusuran laba rugi ke jurnal per siklus.
- Penolakan posting ke periode tertutup, sebagai bagian gate `EPIC-INT`.

### Tidak termasuk

- Logika jurnal setiap siklus: milik masing-masing item siklus.
- Rekonsiliasi stok terhadap jurnal persediaan: milik `INT-003`.
- Rantai end-to-end dari seed: milik `INT-002`.
- Perbaikan asumsi di modul: harus diselesaikan di `core/` (`EPIC-INT`).

## Status dan transisi

Tidak ada state machine. Item ini memeriksa keluaran jurnal.

Status periode yang diperiksa: `terbuka` dan `terkunci`, dari `C-010`.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Jurnal tidak balance | pemeriksaan gagal; menyebut jurnal dan selisih |
| Akun tidak dikenal atau nonaktif | pemeriksaan gagal; menyebut akun (definisi PT-03, `[USULAN-AGEN]`) |
| Baris jurnal tanpa sumber | pemeriksaan gagal; menyebut baris |
| Posting ke periode terkunci | ditolak; tidak ada baris tersimpan |

Teks final ditentukan implementasi.

## Batasan

- Tidak ada modul yang menulis tabel jurnal langsung (`D-07`).
- Pengujian tidak membaca tabel modul lain; baca lewat core (`D-25`).
- Data uji berasal dari `db:reset` dan `db:seed`, tanpa langkah manual (`D-30`).
- Jurnal hanya dari transaksi operasional, langsung diposting tanpa draft, tidak bisa diubah atau dihapus; koreksi lewat jurnal pembalik. Setiap jurnal menyimpan jenis transaksi asal, nomor transaksi asal, dan pemicunya. Header dan baris ditulis dalam satu transaksi database; debit = kredit (`D-43`).

## Dependensi

- Tujuh item di `depends_on` harus `done`: `PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, `C-010`, `PG-010` (dicantumkan di `backlog.md`).
- Data uji lintas siklus: `db:reset` lalu `db:seed` (`D-30`). `FND-008` harus `done` sebelum dijalankan (PT-05, `[USULAN-AGEN]`; usulan koordinasi, bukan `depends_on` backlog).

## Yang membuka jalan

- `INT-002`: rantai end-to-end dari seed.
- `INT-003`: rekonsiliasi stok terhadap jurnal dan laporan.

## Catatan serah terima

`sequence` tidak diisi karena item ini berada di level join (level 9), bukan urutan strict. Level tidak mengikat (aturan 5 gate), dan gate join di `backlog.md` (aturan 4) tetap berlaku.

Pemetaan jurnal per kejadian sudah ditetapkan (PT-02, `D-41`, `D-44`, `D-49`; detail di `00`). Pemetaan analisis §6.7 yang belum disahkan tidak dipakai sebagai fakta.
