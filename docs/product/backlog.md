# Backlog — Lionmesh SIA

Sumber kebenaran tunggal untuk urutan dan status pekerjaan.

## Cara baca

| Kolom | Arti |
|---|---|
| **ID** | identitas permanen. Tidak pernah dipakai ulang |
| **Fitur** | kode fitur di `reference/analisis-sia.md` §5 |
| **Track** | lane kerja di dalam satu siklus. Satu track = satu orang |
| **Level** | panjang jalur dependensi. **Derived**, bukan normatif |
| **Depends on** | prasyarat sebenarnya. Item boleh mulai begitu semua selesai |
| **Status** | `idea` · `discovery` · `specified` · `ready` · `in progress` · `blocked` · `done` |
| **Paket** | bukan kolom: paket item ada di `items/<ID>-<slug>/`, dibuat saat item masuk `specified` |

`level` dipakai untuk melihat **apa yang bisa dikerjakan serentak**. Item dengan level sama tidak saling bergantung, kecuali ditulis eksplisit di `depends on`.

Status `idea` = outcome sudah diketahui, paket requirement belum ditulis. Ini bukan tanda item ditunda.

## Fondasi — serial

Satu pemilik: tech lead. Urutan wajib.

| ID | Outcome | Sequence | Depends on | Status |
|---|---|---|---|---|
| `FND-001` | Lingkungan pengembangan yang dapat diulang + gerbang mutu | 1 | — | `done` |
| `FND-002` | Skema domain inti + migrasi bernomor | 2 | `FND-001` | `done` |
| `FND-003` | Autentikasi & 13 peran (12 staf + Karyawan self-service) dengan RLS | 3 | `FND-002` | `done` |
| `FND-004` | Dokumen: penomoran, status, riwayat, approval berjenjang | 4 | `FND-002`, `FND-003` | `done` |
| `FND-005` | Inventory: mutasi, saldo, valuasi rata-rata bergerak | 5 | `FND-002` | `done` |
| `FND-006` | Ledger: COA, `postJournal()`, periode akuntansi | 6 | `FND-002`, `FND-003` | `done` |
| `FND-007` | UI kit bersama: tabel, form, status badge, dialog | 7 | `FND-002` | `done` |
| `FND-008` | Seed deterministik + reset ke skema `siap` | 8 | `FND-001`, `FND-002` | `done` |
| `FND-009` | AppShell: sidebar 220px + guard rute `(app)` | 9 | `FND-003`, `FND-007` | `done` |

**Gate:** `FND-001`–`FND-009` berstatus `done` sebelum item **modul** (`PD`, `PG`, `PR`, `GJ`, `C`, `INT`) boleh `ready`. Gate ini tidak berlaku untuk item `FND-*` sendiri, yang hanya mengikuti `depends on` (`D-54`). `FND-008` (seed) boleh menyusul paralel dengan gelombang pertama.

## Siklus Pendapatan — 4 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `PD-001` | Pelanggan, termin, batas kredit | PD-A master | 1 | `FND-003` | `ready` |
| `PD-002` | Pesanan penjualan + cek kredit | PD-B transaksi | 2 | `PD-001`, `FND-004` | `specified` |
| `PD-003` | Cek & reservasi stok | PD-B transaksi | 3 | `FND-005`, `C-011`, `PD-002` | `specified` |
| `PD-004` | Pengiriman + surat jalan | PD-B transaksi | 4 | `PD-002`, `PD-003` | `specified` |
| `PD-005` | Faktur penjualan & piutang | PD-C keuangan | 5 | `PD-004`, `FND-006` | `specified` |
| `PD-006` | Penerimaan pembayaran | PD-C keuangan | 6 | `PD-005`, `FND-006` | `specified` |
| `PD-007` | Retur penjualan | PD-C keuangan | 6 | `PD-005`, `FND-005` | `specified` |
| `PD-008` | Jurnal penjualan & HPP | PD-D pelaporan | 7 | `PD-004`…`PD-007`, `FND-006` | `specified` |
| `PD-009` | Laporan penjualan, piutang, aging | PD-D pelaporan | 7 | `PD-005`…`PD-007`, `C-009` | `specified` |

## Siklus Pengeluaran — 6 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `PG-001` | Pemasok, termin, toleransi match | PG-A master | 1 | `FND-003` | `in progress` |
| `PG-002` | Permintaan pembelian | PG-B pengadaan | 2 | `C-013`, `C-011` | `specified` |
| `PG-003` | Approval berjenjang | PG-B pengadaan | 3 | `PG-002`, `FND-004` | `specified` |
| `PG-004` | Pemilihan pemasok & perbandingan harga | PG-B pengadaan | 4 | `PG-002`, `PG-001`, `PG-003` | `specified` |
| `PG-005` | Purchase order | PG-B pengadaan | 5 | `PG-003`, `PG-004` | `specified` |
| `PG-006` | Penerimaan barang | PG-C penerimaan | 6 | `PG-005`, `FND-005` | `specified` |
| `PG-007` | QC bahan & retur ke pemasok | PG-C penerimaan | 7 | `PG-006`, `FND-005` | `specified` |
| `PG-008` | Three-way match & utang usaha | PG-D utang | 8 | `PG-007`, `FND-006` | `specified` |
| `PG-009` | Pembayaran utang | PG-D utang | 9 | `PG-008`, `FND-006` | `specified` |
| `PG-010` | Rekonsiliasi bank | PG-E bank | 1 | `FND-006` | `ready` |
| `PG-011` | Laporan pembelian, utang, dan pengeluaran kas | PG-F pelaporan | 10 | `PG-008`, `PG-009`, `C-009` | `idea` |

`PG-010` sengaja berdiri sendiri. Ia tidak menunggu rantai PO selesai — hanya butuh ledger; format mutasi bank diisi pengguna lewat pemetaan kolom (`D-60`e).

`PG-011` memiliki laporan **operasional** siklus ini (daftar pembelian per pemasok/periode, daftar pembayaran dan pengeluaran kas, sisa utang per invoice). Saldo utang di neraca dan aging sebagai lampiran laporan keuangan tetap milik `C-009`; tanpa `PG-011`, rujukan `C-009` ↔ `PG-009` tidak punya pemilik.

## Siklus Produksi — 4 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `PR-001` | BOM berversi & toleransi (master produk di `C-011`) | PR-A master | 2 | `C-011`, `FND-002` | `specified` |
| `PR-002` | Perintah produksi | PR-B eksekusi | 3 | `PR-001`, `FND-004` | `specified` |
| `PR-003` | Kebutuhan & permintaan bahan | PR-B eksekusi | 4 | `PR-002`, `C-013` | `specified` |
| `PR-004` | Pemakaian bahan & WIP | PR-B eksekusi | 5 | `PR-003`, `FND-005` | `specified` |
| `PR-005` | Hasil produksi & QC (rework/reject) | PR-C mutu | 6 | `PR-002`, `PR-004`, `FND-005` | `specified` |
| `PR-006` | Biaya produksi & HPP | PR-D biaya | 7 | `PR-004`, `PR-005`, `FND-006` | `specified` |
| `PR-007` | Laporan produksi & efisiensi | PR-D biaya | 8 | `PR-006` | `specified` |

`PR-003` bergantung pada `C-013` (domain pengadaan di core), bukan pada seluruh siklus Pengeluaran. Jadi Produksi tidak ikut menunggu `PG-005`.

`PR-001` tidak membuat tabel produk sendiri. Master produk ada di `C-011`; track Produksi hanya memiliki BOM, versinya, dan toleransinya.

## Siklus Penggajian — 4 track

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `GJ-001` | Karyawan, gaji pokok, PTKP | GJ-A master | 1 | `FND-003` | `ready` |
| `GJ-002` | Presensi & pengajuan lembur | GJ-B presensi | 2 | `GJ-001`, `FND-004` | `specified` |
| `GJ-003` | Rekap & validasi presensi | GJ-B presensi | 3 | `GJ-002` | `specified` |
| `GJ-004` | Hitung payroll | GJ-C payroll | 4 | `GJ-003`, `FND-002` | `specified` |
| `GJ-005` | Periksa & setujui payroll | GJ-C payroll | 5 | `GJ-004`, `FND-004` | `specified` |
| `GJ-006` | Pembayaran gaji & slip | GJ-D bayar | 6 | `GJ-005`, `FND-006` | `specified` |
| `GJ-007` | Jurnal & laporan payroll | GJ-D bayar | 7 | `GJ-006`, `FND-006` | `specified` |
| `GJ-008` | Impor presensi dari mesin | GJ-B presensi | 3 | `GJ-002` | `specified` |

## Core bersama — 4 track

Sebagian tidak memblokir siklus mana pun. Dua di antaranya (`C-011`, `C-013`) memblokir item lintas siklus.

| ID | Fitur | Track | Level | Depends on | Status |
|---|---|---|---|---|---|
| `C-009` | Laporan keuangan | CORE-A laporan | 1 | `FND-006` | `done` |
| `C-010` | Tutup buku & jurnal penutup | CORE-B tutup | 2 | `C-009`, `FND-006` | `specified` |
| `C-011` | Master data terpadu: produk, gudang, satuan | CORE-C master | 1 | `FND-002` | `done` |
| `C-012` | Notifikasi in-app + email | CORE-C master | 1 | `FND-004` | `ready` |
| `C-013` | Domain pengadaan: tabel + aturan status (permintaan, PO, penerimaan) | CORE-D pengadaan | 1 | `FND-002`, `FND-004`, `FND-005`, `FND-006` | `done` |
| `C-014` | Dashboard: ringkasan + antrean "menunggu tindakan saya" (fitur `C8`) | CORE-E dashboard | 1 | `FND-003`, `FND-004` | `done` |

`C-013` adalah penerapan `D-05`. Ia **memblokir** `PG-002` dan `PR-003`, tapi bukan seluruh siklus: layar dan alur approval tetap milik track Pengeluaran. Karena itu ia ada di core, bukan di `PG-*` — supaya Produksi tidak ikut menunggu siklus Pengeluaran selesai.

`C-011` hanya memiliki master yang dipakai lintas siklus: produk, gudang, dan satuan. `akun` (COA) lahir di `FND-006`; `C-011` membacanya, bukan membuatnya.

## Discovery — pemblokir eksternal

Spike untuk fakta yang hanya bisa dikonfirmasi dari luar tim. Output-nya keputusan tertulis, bukan kode.

| ID | Outcome | Level | Depends on | Status |
|---|---|---|---|---|
| `DISC-001` | Merek/tipe mesin absensi dan format ekspornya terkonfirmasi | 1 | — | `idea` |
| `DISC-002` | Format mutasi bank (API atau berkas) dan jumlah rekening terkonfirmasi | 1 | — | `idea` |

`DISC-001` dan `DISC-002` **tidak memblokir** `GJ-008` dan `PG-010` (`D-60`e): impor memakai CSV generik dengan pemetaan kolom oleh pengguna; hasil spike hanya mengisi profil pemetaan.

## Integrasi — join

| ID | Outcome | Level | Depends on | Status |
|---|---|---|---|---|
| `INT-001` | Jurnal gabungan konsisten lintas empat siklus | 10 | `PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, `C-010`, `PG-010`, `FND-008` | `specified` |
| `INT-002` | Uji rantai end-to-end dari `db:reset` + `db:seed` | 11 | `INT-001`, `FND-008` | `specified` |
| `INT-003` | Rekonsiliasi stok vs jurnal vs laporan | 11 | `INT-001` | `specified` |

## Matriks paralel

Terbaca per level. Semua item dalam satu baris boleh dikerjakan serentak. `DISC-*` adalah spike konfirmasi, bukan pekerjaan kode.

| Level | Pendapatan | Pengeluaran | Produksi | Penggajian | Core | Discovery | Integrasi | Jumlah |
|---|---|---|---|---|---|---|---|---|
| 1 | `PD-001` | `PG-001` `PG-010` | — | `GJ-001` | `C-009` `C-011` `C-012` `C-013` `C-014` | `DISC-001` `DISC-002` | — | 11 |
| 2 | `PD-002` | `PG-002` | `PR-001` | `GJ-002` | `C-010` | — | — | 5 |
| 3 | `PD-003` | `PG-003` | `PR-002` | `GJ-003` `GJ-008` | — | — | — | 5 |
| 4 | `PD-004` | `PG-004` | `PR-003` | `GJ-004` | — | — | — | 4 |
| 5 | `PD-005` | `PG-005` | `PR-004` | `GJ-005` | — | — | — | 4 |
| 6 | `PD-006` `PD-007` | `PG-006` | `PR-005` | `GJ-006` | — | — | — | 5 |
| 7 | `PD-008` `PD-009` | `PG-007` | `PR-006` | `GJ-007` | — | — | — | 5 |
| 8 | — | `PG-008` | `PR-007` | — | — | — | — | 2 |
| 9 | — | `PG-009` | — | — | — | — | — | 1 |
| 10 | — | `PG-011` | — | — | — | — | `INT-001` | 2 |
| 11 | — | — | — | — | — | — | `INT-002` `INT-003` | 2 |

**Puncak paralel: 11 item serentak di level 1, dan baru terbuka setelah gate `FND-001`–`FND-007` selesai.** Setelah itu turun karena rantai dokumen memang berurutan.

**Titik kritis awal: `C-013`.** Dua siklus menunggunya. Ia harus selesai di gelombang pertama, bukan menyusul.

## Aturan gate

1. **Gate fondasi** — tidak ada item modul `ready` sebelum `FND-001`–`FND-007` `done`. `FND-008` boleh menyusul paralel. Item `FND-*` tidak terkena gate ini (`D-54`).
2. **Gate per item** — `depends on` harus `done`, bukan sekadar "hampir".
3. **Gate migrasi** — DDL dari kelompok berupa usulan; tech lead yang menomori dan merge.
4. **Gate join** — `INT-001` tidak boleh mulai sebelum seluruh jurnal siklus ada.
5. **`level` tidak mengikat** — kalau `depends on` sudah `done`, item boleh mulai walau level lebih tinggi. Pengecualian: gate fondasi (aturan 1) tetap berlaku lebih dulu.

## Changelog

| Tanggal | Perubahan |
|---|---|
| 2026-11-17 | Inisialisasi. 50 item: 8 fondasi, 34 modul, 5 core bersama, 3 integrasi |
| 2026-11-17 | Tambah `C-013` domain pengadaan (level 1, memblokir `PG-002` dan `PR-003`) |
| 2026-11-19 | Gate fondasi dipersempit ke `FND-001`–`FND-006`; `FND-007`/`FND-008` boleh paralel |
| 2026-11-19 | `C-011` tidak lagi memiliki `akun` (COA milik `FND-006`); `PR-001` bergantung `C-011`, level rantai Produksi bergeser +1 |
| 2026-11-19 | `FND-001` diselaraskan ke `in progress` di semua dokumen |
| 2026-11-22 | `FND-001` → `done`: CI merah lalu hijau terbukti di PR #3; branch `fnd-001-lingkungan` di-merge ke `main` |
| 2026-11-22 | `INT-001` menambah `C-010` ke `depends on` (selaras `EPIC-INT`); gate fondasi ditegaskan menang atas aturan 5; `README` level 1 dikoreksi ke 9 item; `FND-001` diselaraskan (D-30) |
| 2026-11-22 | Catatan pemetaan `D-01` (FND-001/002/008 infrastruktur; `C6`/`C8` belum punya item); bukti `INV-01` dikoreksi ke riwayat git; istilah "seed kosong" diganti `db:reset` + `db:seed` |
| 2026-11-22 | Paket requirement (6 file) dibuat untuk 49 item; status `idea` → `specified`. Semua verdict DoR `Blocked` + `Needs decision`; tidak ada `ready`. Pertanyaan terbuka dicatat per item di `00-discussion.md` |
| 2026-11-22 | Gate fondasi diperluas ke `FND-001`–`FND-007` dan hanya untuk item modul (`D-54`); `FND-002` → `ready`; `PG-004` + `PG-003`, `PG-002` − `PG-001`, `PR-005` + `PR-004` (`D-57`); level dan matriks paralel dihitung ulang (jalur kritis Pengeluaran level 9); `C-014`, `DISC-001`, `DISC-002` ditambahkan |
| 2026-11-22 | `FND-002` mulai dikerjakan setelah `FND-001` done; migrasi dan kontrak item sedang diselaraskan |
| 2026-11-22 | `FND-002` → `done`: migrasi `0002_skema_domain_inti.sql`; AC-01–AC-09, `pnpm check:migrations`, `pnpm verify`, dan review akhir lulus |
| 2026-11-22 | `FND-007` → `in progress` setelah `FND-002` `done` pada branch kerja; readiness review diperbarui |
| 2026-11-22 | `FND-007` → `done`: AC-01–AC-08 dibuktikan, screenshot 1280px disimpan, dan `pnpm verify` lulus |
| 2026-11-22 | `FND-008` mulai dikerjakan setelah `FND-001` dan `FND-002` done; `D-54` mengecualikan item fondasi dari gate item modul |
| 2026-11-22 | Implementasi seed dasar diverifikasi; seed akun FND-003 dan AC-05 masih tertunda |
| 2026-11-22 | `FND-008` → `done`: AC-01–AC-09 dibuktikan pada Supabase lokal terisolasi; akun uji 13 peran ditambahkan; `pnpm verify` dan pemeriksaan finalisasi lulus |
| 2026-11-23 | `FND-003` → `done`: implementasi login, guard, RLS, dan Auth hook selesai; tech lead mengonfirmasi hasil pengujian manual, sisa risiko deployment dicatat di `docs/tech-debt/fnd-003-auth-deployment.md` |
| 2026-11-23 | `FND-005` → `done`: implementasi mutasi, saldo, valuasi, presisi desimal, dan integrasi sintetis selesai; tech lead mengonfirmasi hasil pengujian manual, sisa integrasi dokumen sumber dicatat di `docs/tech-debt/fnd-005-integrasi-dokumen.md` |
| 2026-11-23 | `FND-004` → `done`: migrasi `0007`, `core/dokumen`, registry status/tipe, approval berjenjang, seed versi `0004`, AC-01–AC-16, uji sesi, dan `pnpm verify` lulus. Pemeriksaan periode sumber dicatat menunggu `FND-006` |
| 2026-11-23 | `FND-006` → `done`: migrasi `0008`, seed COA `D-41`, `postJournal()`/`reverseJournal()`, periode, RLS, dan immutability selesai; AC-01–AC-16 serta jalur sesi server dibuktikan, `pnpm verify` lulus |
| 2026-11-23 | `FND-009` → `done`: AppShell 220px (`D-62`) di `src/app/(app)/layout.tsx`, sidebar bersama, guard sesi, dan route `/pengaturan` dipindah ke dalam shell; gate fondasi jadi `FND-001`–`FND-009` |
| 2026-11-23 | Tambah `PG-011` laporan pembelian/utang/pengeluaran kas (track `PG-F`, level 10) untuk menutup rujukan melingkar `C-009` ↔ `PG-009`; `EPIC-PG` dan `PG-009` diperbaiki di PR yang sama |
| 2026-11-23 | Gelombang 1 → `ready`: `PD-001`, `PG-001`, `PG-010`, `GJ-001`, `C-009`, `C-011`, `C-012`. Readiness review disegarkan setelah `FND-009` `done`; DDL tetap lewat usulan dan nomor tech lead (`D-09`) |
| 2026-11-23 | `PG-001` mulai dikerjakan setelah fondasi `FND-001`–`FND-007` selesai; migrasi `0009`, core service, UI, dan validasi server ditambahkan. Verifikasi database tertunda karena Docker tidak tersedia |
| 2026-11-24 | `C-013` dan `C-014` → `ready` setelah keputusan tech lead D-64; lima track core boleh paralel sesuai D-65 |
| 2026-11-24 | `C-011` → `in progress`: migrasi `0011`, `core/master`, empat layar master di `/pengaturan`, seed mata uang IDR versi `0005`, dan bukti AC-01–AC-11. Sisa bukti lintas item (pemilihan di dokumen dan dokumen lama) menunggu `PD-002`/`PG-002` |
| 2026-11-24 | `C-013` → `in progress`: implementasi pengadaan dan bukti awal tersedia; pemeriksaan D-64 dan AC tambahan sedang diselesaikan |

| 2026-11-24 | `C-013` tetap `in progress`: aturan D-64 dan uji atomisitas diperbaiki; bukti yang masih parsial perlu dituntaskan |
| 2026-11-26 | `C-011` → `done`: PR #35 merge; migrasi `0011`, `core/master`, empat layar master, seed IDR `0005`. Sisa bukti lintas item (pemilihan di dokumen, dokumen lama) menunggu `PD-002`/`PG-002` |
| 2026-11-26 | `C-013` → `done`: PR #37 merge; domain pengadaan, aturan status, harness 17/17 lulus. AC-18 menunggu `PR-002`; read model TS menyusul di `PG-002` |
| 2026-11-26 | `C-014` → `done`: PR #34 merge; read model `src/core/dashboard`, layar `/`, dan bukti AC-01–AC-08 di `05-evidence.md`; urutan prioritas mengikuti D-65 |
| 2026-11-24 | `C-009` → `in progress`: tujuh laporan, filter satu bulan, hak PT-02, dan bukti AC-01–AC-11 ditulis; `pnpm verify` lulus. Menunggu review tech lead sebelum `done` |
| 2026-11-26 | `C-009` → `done`: PR #36 merge; tujuh laporan, rekonsiliasi kartu vs buku besar (D-57), bukti dokumen batal end-to-end, AC-01–AC-11 PASS, screenshot 1280px berisi data |
