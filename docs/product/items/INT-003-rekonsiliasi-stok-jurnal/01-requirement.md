---
id: INT-003
slug: rekonsiliasi-stok-jurnal
title: Rekonsiliasi stok terhadap jurnal dan laporan
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
  - INT-001
blocks: []
owner_role: tech lead
package: docs/product/items/INT-003-rekonsiliasi-stok-jurnal
---

# INT-003 — Rekonsiliasi stok terhadap jurnal dan laporan

## Masalah

Stok di gudang, mutasi stok, saldo stok, dan jurnal persediaan bisa berbeda tanpa ada yang tahu. Selisih baru terlihat saat laporan tidak cocok, dan tidak ada cara menunjuk produk atau gudang mana yang salah.

## Outcome

Pengguna yang berwenang dapat menjalankan rekonsiliasi yang membandingkan:

- stok fisik (hasil stock opname, `D-52`);
- qty dari mutasi stok dengan qty di saldo stok;
- nilai saldo stok dengan jurnal persediaan di neraca.

Ketika ketiganya cocok, rekonsiliasi lulus. Ketika tidak, selisih tampil per produk dan gudang, dan tidak ada yang disembunyikan.

## Aktor

| Aktor | Peran |
|---|---|
| Accounting | menjalankan dan membaca rekonsiliasi nilai. Penguji item: tech lead (PT-08, `[USULAN-AGEN]`) |
| Gudang | membaca selisih qty; stok fisik dari stock opname (`D-52`) |
| Sistem (core inventory dan ledger) | menghitung dan membandingkan |

## Cakupan

### Termasuk

- Pembandingan qty mutasi dengan qty saldo, per produk dan gudang.
- Pembandingan nilai saldo dengan jurnal persediaan di neraca (akun 120, 121, 122; `D-41`).
- Pembandingan stok fisik (hasil stock opname, `D-52`) dengan saldo.
- Tampilan selisih per produk dan gudang.

### Tidak termasuk

- Penyesuaian saldo otomatis: rekonsiliasi hanya membaca (`[USULAN]`).
- Stock opname itu sendiri: milik `FND-005` (`D-52`, dikerjakan paling akhir).
- Akun GR/IR dan aturan penerimaan: milik `C-013` (`D-36`, `D-44` (1)).
- Pemeriksaan jurnal gabungan: milik `INT-001`.

## Status dan transisi

Tidak ada state machine. Hasil rekonsiliasi adalah lulus atau gagal, dengan daftar selisih.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Qty saldo tidak sama dengan jumlah mutasi | gagal; menyebut produk dan gudang |
| Nilai saldo tidak sama dengan `qty × harga_rata` | gagal; menyebut produk dan gudang |
| Nilai persediaan neraca tidak sama dengan total `saldo_stok` | gagal; menyebut akun dan selisih |
| Stok fisik (hasil opname) tidak sama dengan saldo | gagal; menyebut produk, gudang, dan selisih |
| Akun persediaan belum ditetapkan | rekonsiliasi tidak jalan; sebut akun yang kurang (PT-04) |

Teks final ditentukan implementasi. Saat ada selisih: daftar selisih tampil dan tidak memblokir transaksi (PT-02, `[USULAN-AGEN]`).

## Batasan

- Rekonsiliasi tidak mengubah saldo, mutasi, atau jurnal (`[USULAN]`).
- Toleransi nol untuk qty dan nilai (PT-03, `[USULAN-AGEN]`; sejalan `D-43`).
- Valuasi rata-rata bergerak (`D-10`, locked). Catatan: `D-10` ditandai "Perlu konfirmasi" karena kebijakan perusahaan dan rancangan lain memakai FIFO. Keputusan terkunci berlaku sampai ada keputusan baru.
- Uang `numeric(18,2)`, qty `numeric(18,4)`; pembulatan saat tampil (`[USULAN]`, analisis §10.6).

## Dependensi

- `INT-001` harus `done`.
- `FND-005` harus `done`: mutasi dan saldo stok.
- `C-009` harus `done`: neraca untuk perbandingan nilai.
- Akun persediaan untuk perbandingan: 120, 121, 122 (`D-41`). Akun GR/IR 202 untuk penerimaan (`D-41`, `D-44` 1).

## Yang membuka jalan

- Tidak ada item di backlog yang `depends on` `INT-003`.

## Catatan serah terima

`sequence` tidak diisi karena item ini berada di level join (level 10). Lihat `INT-001`.

Gate `EPIC-INT` nomor 3 menyatakan nilai persediaan di neraca sama dengan `saldo_stok`. Item ini memeriksa gate itu. Akun persediaan per tipe sudah ada di `D-41` (PT-04 terjawab).
