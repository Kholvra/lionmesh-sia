---
id: FND-008
slug: seed-deterministik-reset
title: Seed deterministik dan reset ke skema siap
epic: EPIC-FND
milestone: M0
lane: active
sequence: 8
type: chore
req_status: specified
delivery_status: done
priority: medium
size: M
depends_on:
  - FND-001
  - FND-002
blocks:
  - INT-001
  - INT-002
owner_role: tech lead
package: docs/product/items/FND-008-seed-deterministik-reset
---

# FND-008 — Seed deterministik dan reset ke skema siap

## Masalah

Data uji tiap kelompok berbeda, dan database lokal bisa berisi sisa data dari uji sebelumnya. Akibatnya, hasil uji tidak bisa diulang, dan tidak ada data bersama untuk memeriksa rantai dokumen.

## Outcome

Siapa pun dapat mengembalikan database lokal ke skema `siap`, lalu mengisi data dasar (master) yang sama persis setiap kali. Seed menolak berjalan di atas data yang sudah ada dan menyebut perintah reset. Transaksi tidak di-seed; skenario transaksi dibuat uji masing-masing item.

## Aktor

| Aktor | Peran |
|---|---|
| Anggota kelompok | menjalankan reset dan seed di lingkungan lokal |
| CI | dapat menjalankan reset dan seed di lingkungan uji lokal (`OQ-08-07`) |
| Tech lead | pemilik item; memutuskan mekanisme seed |
| Pemilik tabel (setiap item) | menambah berkas seed untuk tabel yang dibuatnya (`OQ-08-02`) |

## Cakupan

### Termasuk

- Reset ke `siap` (`D-30`), sudah ada dari `FND-001`, dipertahankan.
- Mekanisme seed bernomor: setiap item menambah berkas seed untuk tabel yang dibuatnya; urutan dicatat tech lead (`OQ-08-02`).
- Seed dasar yang dimiliki item ini: satu gudang (`D-52`), satuan dasar, dan penanda versi seed. Tabel dan master milik item lain diisi berkas seed item pemilik.
- Fixture tetap untuk pengembangan lokal: satuan `UNIT` / `Unit` dan gudang `GUDANG-01` / `Gudang Utama`; bukan master operasional resmi.
- Akun uji lokal untuk 13 peran (`D-53`) dibuat melalui berkas seed bernomor; alamat menggunakan domain `lionmesh.test` dan sandi disediakan melalui `FND_TEST_PASSWORD`, sesuai persetujuan tech lead.
- Akun dasar COA (`D-41`) dibuat lewat berkas seed item `FND-006`; aturan approval placeholder (`D-37`, `D-51` c) lewat berkas seed item `FND-004`.
- Penolakan seed kedua tanpa reset (sudah ada, dipertahankan).
- Penanda versi seed (`OQ-08-05`).

### Tidak termasuk

- Migrasi data dari sistem lama.
- Test per item (milik item masing-masing), termasuk skenario `INT-002` (`D-51` g).
- Data produksi.
- Transaksi, mutasi, dan jurnal dalam seed (`OQ-08-01`).

## Status dan transisi

Mengikuti `FND-001` (`kosong` → `siap` → `terisi`):

| Dari | Ke | Lewat |
|---|---|---|
| `kosong` | `siap` | penerapan migrasi |
| `siap` | `terisi` | `db:seed` |
| `terisi` | `siap` | `db:reset` penuh |
| `siap` | `siap` | `db:reset` |

Menghapus sebagian baris seed secara manual dilarang.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Teks |
|---|---|---|
| Seed dijalankan saat sudah `terisi` | ditolak | "Database sudah berisi seed. Jalankan `pnpm db:reset` terlebih dahulu." (sudah berlaku dari `FND-001`) |
| Seed dijalankan di lingkungan non-lokal | ditolak; tidak ada baris tersimpan | "Seed hanya boleh dijalankan di lingkungan lokal." |
| Seed gagal di tengah | status tidak `terisi`; pesan meminta reset | "Seed gagal. Jalankan `pnpm db:reset` lalu ulangi." |
| Data seed memakai tanggal atau acak | pemeriksaan gagal (AC-03) | (pemeriksaan, bukan pesan pengguna) |

## Batasan

- Seed tidak bergantung pada tanggal hari ini, waktu sistem, atau acak tanpa benih (`FND-001` `INV-03`).
- Id seed tetap (UUID literal per tabel) (`OQ-08-06`).
- Berkas seed item memakai prefix nomor empat digit unik; versi dataset empat digit di `supabase/seed-version` dinaikkan setiap kali isi seed berubah.
- Perbandingan hasil memakai jumlah baris dan nilai kunci (`FND-001` `POST-04`).
- Data dasar tidak berisi data nyata. Kredensial uji hanya untuk lingkungan lokal (`OQ-08-03`, `D-27`).

## Menyentuh data pribadi

Akun uji berisi nama login dan kata sandi uji. Hanya lingkungan lokal yang memakainya; tidak ada data pribadi nyata.

## Dependensi

- `FND-001` (done): reset, seed, penjaga.
- `FND-002`: tabel yang diisi item ini (`satuan`, `produk`, `gudang`).

## Yang membuka jalan

- `INT-002`: uji rantai end-to-end dari `db:reset` dan `db:seed`.
- Item modul yang butuh data uji (secara tidak langsung).

## Catatan serah terima

- Berkas seed setiap item memakai nomor urut yang dicatat tech lead.
- Kredensial uji tidak boleh dipakai di lingkungan lain (`OQ-08-03`, `OQ-08-07`).
