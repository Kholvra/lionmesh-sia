---
id: FND-006
slug: ledger-coa-jurnal-periode
title: Ledger: COA, postJournal(), dan periode akuntansi
epic: EPIC-FND
milestone: M0
lane: active
sequence: 6
type: feature
req_status: specified
delivery_status: not_started
priority: unset
size: unset
depends_on:
  - FND-002
  - FND-003
blocks:
  - C-009
  - C-010
  - GJ-006
  - GJ-007
  - PD-005
  - PD-006
  - PD-008
  - PG-008
  - PG-009
  - PG-010
  - PR-006
owner_role: tech lead
package: docs/product/items/FND-006-ledger-coa-jurnal-periode
---

# FND-006 — Ledger: COA, postJournal(), dan periode akuntansi

## Masalah

Setiap siklus menghasilkan jurnal. Jika tiap modul menyusun jurnalnya sendiri, formatnya berbeda, jurnal bisa tidak balance, dan laporan keuangan tidak bisa digabung. Periode yang sudah ditutup juga bisa menerima posting baru.

## Outcome

Modul yang menghasilkan transaksi keuangan memposting jurnal lewat satu fungsi. Jurnal yang tidak balance, sumbernya kosong, memakai akun tidak aktif, atau masuk periode terkunci ditolak, dan tidak ada baris yang tersimpan. Jurnal yang sudah diposting tidak diubah; koreksi dilakukan dengan jurnal pembalik.

## Aktor

| Aktor | Peran |
|---|---|
| Modul penghasil transaksi | memanggil fungsi posting; tidak menulis tabel jurnal |
| Accounting | memverifikasi transaksi keuangan; menutup periode (`D-50`); jurnal tidak dibuat manual (`D-43`) |
| Tech lead | pemilik item; mengelola COA lewat seed (`D-33`) |

## Cakupan

### Termasuk

- Bagan akun (COA) dengan status aktif dan tidak aktif. Isi awal mengikuti `D-41`; akun baru mengikuti mekanisme berversi (`D-51`).
- Peran akun: setiap akun punya kunci peran (mis. `kas_bank`, `piutang_usaha`, `persediaan_bahan`, `gr_ir`, `utang_usaha`, `utang_gaji`) yang dipanggil modul (`D-35`). Modul tidak memakai nomor akun.
- Jurnal dan baris debit serta kredit.
- Jurnal langsung diposting tanpa draft; tidak bisa diubah atau dihapus; koreksi lewat jurnal pembalik (`D-43`, `D-35`).
- Fungsi posting tunggal yang menolak jurnal tidak balance, akun tidak aktif, sumber kosong, dan periode terkunci.
- Periode akuntansi bulanan kalender dengan status buka atau kunci (`D-50`).
- Sumber jurnal wajib: jenis transaksi asal, nomor transaksi asal, dan pemicu (`D-43`).
- Jurnal pembalik untuk dokumen batal setelah posting dan koreksi periode tertutup (`D-35`, `D-44` (5)).

### Tidak termasuk

- Laporan buku besar, neraca saldo, laba rugi, dan neraca (`C-009`).
- Tutup buku dan jurnal penutup (`C-010`). Mekanisme buka dan kunci periode berada di `C-010` (`D-33`).
- Jurnal penjualan, pembelian, produksi, dan payroll (item modul).
- Kunci periode penggajian (`GJ-5`, terpisah dari tutup buku, analisis §8.3).
- Master mata uang dan kurs: transaksi IDR (`D-38`), master di `C-011`.
- Aset tetap dan penyusutan (`D-45`).

## Bagan akun dasar

Sumber: `D-41`. Akun aset, kewajiban, ekuitas, pendapatan, HPP, beban, dan akun perantara dipakai sesuai rancangan.

| Nomor | Nama | Peran (kunci) |
|---|---|---|
| 102 | Bank | `kas_bank` |
| 110 | Piutang usaha | `piutang_usaha` |
| 120 | Persediaan bahan baku | `persediaan_bahan` |
| 121 | Barang dalam proses | `barang_dalam_proses` |
| 122 | Persediaan barang jadi | `persediaan_barang_jadi` |
| 201 | Utang usaha | `utang_usaha` |
| 202 | Utang belum difakturkan (GR/IR) | `gr_ir` |
| 210 | Utang gaji | `utang_gaji` |
| 302 | Laba ditahan | `laba_ditahan` |
| 401 | Penjualan | `penjualan` |
| 501 | Harga pokok penjualan | `hpp` |
| 601 | Tenaga kerja langsung (perantara) | `tenaga_kerja_langsung` |
| 602 | Overhead pabrik (perantara) | `overhead_pabrik` |
| 701 | Beban gaji administrasi | `beban_gaji_admin` |

Akun yang belum ada di `D-41` (PPN keluaran, PPN masukan, utang BPJS, utang PPh 21, kerugian produksi abnormal, selisih pembulatan, modal): nomor dan nilai mengikuti mekanisme berversi `D-51`, diverifikasi dan dikutip sumbernya saat implementasi. Tidak ditulis di paket ini.

Akun 150 (aset tetap), 159 (akumulasi penyusutan), dan 702 (beban penyusutan kantor) dicadangkan dan tidak dibuat baris di seed (`D-41`, `D-45`).

## Status dan transisi

| Status periode | Arti | Transisi |
|---|---|---|
| `buka` | menerima posting | → `kunci` (Accounting, `D-50`; mekanisme di `C-010`) |
| `kunci` | menolak posting baru | → `buka` hanya lewat prosedur yang disahkan (`C-010`) |

| Status akun | Arti | Transisi |
|---|---|---|
| `aktif` | bisa dipakai di jurnal | → `tidak aktif` (tech lead, `D-33`) |
| `tidak aktif` | tidak bisa dipakai di jurnal baru; riwayat tetap | → `aktif` (tech lead) |

Akun yang sudah punya baris jurnal tidak dihapus (`D-50`: nonaktifkan, bukan hapus). Jurnal yang sudah diposting tidak berubah statusnya.

## Aturan posting

- Setiap jurnal minimal dua baris; total debit = total kredit; mata uang IDR (`D-38`).
- Setiap jurnal punya sumber: jenis transaksi asal, nomor transaksi asal, dan pemicu (`D-43`).
- Pemanggil adalah layanan modul pemilik transaksi; aktor yang dicatat adalah pengguna sesi pemicu, yang harus berhak atas transaksi pemicu menurut matriks (`[USULAN-AGEN]`, OQ-06-09).
- Jenis sumber adalah daftar tertutup di `core/ledger`; item yang menambah jenis transaksi mendaftarkannya (`[USULAN-AGEN]`, OQ-06-08).
- Header dan baris ditulis dalam satu transaksi database (`D-43`). Debit = kredit diperiksa di database saat commit dan di layanan (`[USULAN-AGEN]`, OQ-06-10).
- Jurnal pembalik: jurnal baru dengan sumber dokumen batal, kolom referensi ke jurnal asal, dan selisih nol terhadap jurnal asal; jurnal asal tidak diubah (`[USULAN-AGEN]`).
- Koreksi periode tertutup: jurnal pembalik di periode berjalan (`D-44` (5)).

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Teks |
|---|---|---|
| Total debit tidak sama dengan total kredit | ditolak; tidak ada baris tersimpan | "Jurnal tidak seimbang: debit {d}, kredit {k}." |
| Akun tidak aktif atau tidak ada | ditolak; pesan menyebut kode akun | "Akun {kode} tidak ditemukan atau tidak aktif." |
| Periode terkunci | ditolak; pesan menyebut periode | "Periode {bulan} {tahun} sudah dikunci; posting ditolak." (`[USULAN-AGEN]`) |
| Sumber jurnal kosong atau jenis tidak terdaftar | ditolak | "Sumber jurnal wajib diisi dan harus jenis yang terdaftar." |
| Jurnal tanpa baris atau satu baris | ditolak | "Jurnal minimal dua baris." |
| Percobaan ubah atau hapus jurnal yang sudah diposting | ditolak; jurnal tetap | "Jurnal yang sudah diposting tidak bisa diubah atau dihapus. Koreksi dengan jurnal pembalik." |
| Aktor tidak berhak atas transaksi pemicu | ditolak | "Anda tidak berwenang memposting transaksi ini." |

## Batasan

- Satu-satunya jalur tulis jurnal adalah fungsi posting.
- Jurnal tidak direvaluasi otomatis; transaksi IDR (`D-38`).
- Uang disimpan `numeric(18,2)` dengan pembulatan dua desimal (`[USULAN-AGEN]`, OQ-06-11).
- Tutup buku mengunci jurnal, bukan dokumen sumber (analisis §8.3 `[USULAN]`).
- Akun dan peran akun dikelola tech lead lewat seed (`D-33`).

## Menyentuh uang

- Setiap jurnal menyebut akun debit dan kredit lewat peran akun, dan sumber angkanya (dokumen dan kolom) lewat sumber jurnal (`D-43`).
- Contoh sumber terkunci: masuk bahan Dr 120 / Cr 202 senilai qty lolos × harga PO (`D-44` (1)); faktur Dr 110 / Cr 401 (`D-44` (3)); bukti invoice cocok Dr 202 / Cr 201 (`D-44` (2)). Jurnal pemicu ditulis item pemicu, bukan item ini.
- Saat payroll disetujui: Dr beban / Cr utang gaji, pembayaran Dr utang gaji / Cr bank (`D-49`).

## Dependensi

- `FND-002`: tabel dasar.
- `FND-003`: identitas aktor sesi untuk posting.

## Yang membuka jalan

- `C-009`, `PD-005`, `PD-006`, `PD-008`, `PG-008`, `PG-009`, `PG-010`, `PR-006`, `GJ-006`, `GJ-007`.

## Data pribadi

Tidak ada. Aktor jurnal adalah identitas sesi dan tercatat di kolom audit.

## Catatan serah terima

- Bukti `ARCH-001` `INV-01` (jurnal balance) dicatat saat item ini dibangun. Lihat AC-01.
- Bagan akun dasar sudah dikunci (`D-41`); akun baru diberi nomor dan nilai lewat mekanisme `D-51` dan disahkan Accounting sebelum seed.
