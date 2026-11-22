---
id: FND-002
slug: skema-domain-inti
title: Skema domain inti dan migrasi bernomor
epic: EPIC-FND
milestone: M0
lane: active
sequence: 2
type: chore
req_status: specified
delivery_status: not_started
priority: high
size: M
depends_on:
  - FND-001
blocks:
  - C-011
  - C-013
  - FND-003
  - FND-004
  - FND-005
  - FND-006
  - FND-007
  - FND-008
  - GJ-004
  - PR-001
owner_role: tech lead
package: docs/product/items/FND-002-skema-domain-inti
---

# FND-002 — Skema domain inti dan migrasi bernomor

## Masalah

Belum ada tabel domain. Jika setiap kelompok mulai membuat tabelnya sendiri, nama dan kolom akan berbeda, dan dua tabel bisa menyimpan fakta yang sama (misalnya dua saldo stok). Migrasi yang menumpuk di satu berkas juga akan bertabrakan saat merge.

## Outcome

Siapa pun yang menjalankan `pnpm db:reset` mendapat skema `siap` yang berisi tiga tabel dasar bersama (`satuan`, `produk`, `gudang`) dengan relasi, constraint dasar, index, dan kolom audit. Setiap tabel domain lain dibuat oleh item pemiliknya (`D-31`). Migrasi tambahan hanya masuk sebagai usulan DDL; nomor dan merge dilakukan tech lead.

## Aktor

| Aktor | Peran |
|---|---|
| Tech lead | pemilik item; menomori dan me-merge migrasi (`D-09`) |
| Anggota kelompok | memakai skema di lingkungan lokal; tidak menomori migrasi |
| CI | menjalankan `pnpm check:migrations` dan pemeriksaan lain dari `FND-001` |

## Cakupan

### Termasuk

- Tabel `satuan`, `produk`, `gudang` (`OQ-02-01`, `OQ-02-03`). Fitur pemiliknya `C-011`; DDL dibuat di item ini agar `FND-005` tidak punya dependensi tersembunyi.
  - `satuan`: `id`, `kode` (unik), `nama`, `aktif`, kolom audit.
  - `produk`: `id`, `kode` (unik), `nama`, `satuan_dasar_id` (FK ke `satuan`), `aktif`, kolom audit. Tidak ada kolom stok (`D-06`).
  - `gudang`: `id`, `kode` (unik), `nama`, `aktif`, kolom audit. Struktur siap banyak gudang (`D-52`); seed memakai satu gudang.
- Kolom audit `created_by`, `created_at`, `updated_by`, `updated_at` di setiap tabel (`D-32`).
- Relasi (foreign key), constraint dasar, dan index untuk kolom relasi (lihat bagian Constraint).
- Konvensi tipe (`OQ-02-07`): uang total `numeric(18,2)`; harga satuan dan harga rata `numeric(18,4)`; qty `numeric(18,4)`; waktu `timestamptz` disimpan UTC dan tampil `Asia/Jakarta`. Berlaku untuk seluruh tabel domain; tabel di item ini tidak punya kolom uang.
- Migrasi bernomor satu berkas (`OQ-02-10`); `0001_initial.sql` tidak diubah.
- Daftar pemilik setiap tabel tercatat di `04-design-contract.md`.

### Tidak termasuk

- Peran, login, dan RLS (`FND-003`). `profiles` dari `0001` tetap; penambahan peran dilakukan `FND-003` (`OQ-03-11`).
- Nomor dokumen, status, riwayat, dan approval (`FND-004`).
- Mutasi dan saldo stok (`FND-005`); COA, jurnal, dan periode (`FND-006`).
- Tabel pengadaan `permintaan_pembelian`, `po`, `penerimaan`, QC (`C-013`); `invoice_supplier`, `utang` (`PG-008`, `PG-009`).
- Tabel domain lain yang belum punya pemakai (`pelanggan`, `pemasok`, `karyawan`, `produk_komponen`, `lampiran`, `konfigurasi_pajak`, `tarif_*`, `notifikasi`, `alokasi_stok`, `mata_uang`, `kurs`): dibuat item pertama yang membutuhkannya (`D-31`).
- Fitur `C8` dashboard: `C-014` (`D-38`).
- Migrasi data dari sistem lama.

## Status dan transisi

Tidak ada state machine dokumen. Kondisi lingkungan mengikuti `FND-001`:

| Kondisi | Arti |
|---|---|
| `kosong` | tidak ada tabel aplikasi; hanya sesaat di dalam reset (`D-30`) |
| `siap` | seluruh migrasi terpasang, termasuk migrasi domain dari item ini; tanpa data dasar |
| `terisi` | data dasar dari `FND-008` terpasang |

Setelah item ini, `db:reset` menghasilkan `siap` dengan skema domain dasar. Migrasi baru tidak mengubah kondisi di atas, hanya isi skema.

## Constraint

| Tabel | Constraint | Catatan |
|---|---|---|
| `satuan`, `produk`, `gudang` | unique `kode` | kode duplikat ditolak database |
| `satuan`, `produk`, `gudang` | check `nama` tidak kosong setelah trim | |
| `produk` | FK `satuan_dasar_id` → `satuan.id` | index pada kolom FK |

Constraint milik item pemilik tabel (bukan item ini): `UNIQUE(tipe, nomor)` di `FND-004`; `CHECK qty ≠ 0` dan tak-ubah di `FND-005`; `UNIQUE(penerimaan_id)` untuk invoice di `PG-008` (`D-49`).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Dua migrasi bernomor sama | ditolak sebelum menyentuh database, menyebut kedua berkas (sudah berlaku dari `FND-001`) |
| Migrasi domain gagal di tengah | versi tidak tercatat naik; reset berikutnya memulihkan (`FND-001` `INV-04`) |
| Insert dengan nilai parent yang tidak ada (FK) | ditolak database; pesan menyebut nama constraint |
| Kode duplikat pada `satuan`, `produk`, `gudang` | ditolak database; pesan menyebut nama constraint unique |
| Nama kosong | ditolak database; pesan menyebut nama constraint check |
| Kolom stok ditambahkan ke tabel produk | tidak lolos review (`INV-03` di kontrak) |

Pesan yang dibaca pengguna akhir ditentukan oleh item pemilik tabel (mis. layar `C-011`), bukan item ini. Pesan teknis untuk tim cukup menyebut nama constraint.

## Batasan

- Migrasi yang sudah di-merge ke `main` tidak diubah isinya.
- Nomor migrasi tidak dipakai ulang. Penomoran oleh tech lead (`D-09`).
- Setiap tabel hanya punya satu pemilik. Tabel yang dibutuhkan dua item sekaligus pindah ke `core/` dan dibuat oleh item pertama yang membutuhkannya.
- Tabel `produk` tidak memiliki kolom stok (`D-06`).

## Dependensi

- `FND-001` (done): runner migrasi, `check:migrations`, `db:reset`.

## Yang membuka jalan

- `FND-003`, `FND-004`, `FND-005`, `FND-006`, `FND-007`, `FND-008`.
- `C-011`, `C-013`, `PR-001`, `GJ-004`.

## Catatan serah terima

- Mekanisme penulisan DDL (SQL langsung atau generator) belum ditetapkan. Item ini mengikat hasil dan bukti, bukan alat.
- Tabel yang sudah dimiliki item lain (`D-31`) tidak dibuat ulang di item ini.
- `C-011` menambah kolom dan fitur master lewat migrasi berikutnya dengan nomor dari tech lead; tidak mengubah migrasi item ini.
