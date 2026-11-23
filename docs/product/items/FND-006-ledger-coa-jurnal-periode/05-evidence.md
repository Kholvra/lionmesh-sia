# FND-006 — Bukti Verifikasi

Tanggal: 2026-11-23
Lingkungan: Node.js v24.22.2, pnpm 10.18.3, Supabase CLI 3.2.0, PostgreSQL 17.6, Next.js 16.4.6

Perintah utama:

```text
pnpm check:migrations
node scripts/verify-fnd-006.mjs
FND_TEST_PASSWORD=<rahasia-lokal> SUPABASE_DB_URL=<db-uji-lokal> node scripts/db-seed.mjs
node scripts/verify-fnd-006-session.mjs
pnpm verify
```

## Ringkasan Acceptance Criteria

| AC | Hasil | Bukti teramati |
|---|---|---|
| `AC-01` | `PASS` | `post_journal()` menyimpan jurnal `fdcc6ce6-e46c-41d1-85f1-447c9200b85b`; query `detail_jurnal` menghasilkan debit 100.00 dan kredit 100.00. |
| `AC-02` | `PASS` | Debit 100 / kredit 90 ditolak dengan "Jurnal tidak seimbang: debit 100, kredit 90." Jumlah `jurnal` dan `detail_jurnal` tidak berubah. Commit langsung yang tidak balance juga ditolak constraint trigger. |
| `AC-03` | `PASS` | Akun 401 dinonaktifkan: "Akun 401 tidak ditemukan atau tidak aktif." Peran akun yang tidak ada juga ditolak; tidak ada baris jurnal baru. |
| `AC-04` | `PASS` | Periode Januari 2099 dikunci: "Periode Januari 2099 sudah dikunci; posting ditolak." |
| `AC-05` | `PASS` | `UPDATE`/`DELETE` pada `jurnal` dan `detail_jurnal` ditolak: "Jurnal yang sudah diposting tidak bisa diubah atau dihapus. Koreksi dengan jurnal pembalik." |
| `AC-06` | `PASS` | Sumber kosong dan jenis `TIDAK_TERDAFTAR` sama-sama ditolak dengan "Sumber jurnal wajib diisi dan harus jenis yang terdaftar." |
| `AC-07` | `PASS` | DML langsung oleh `anon`, `authenticated`, dan `service_role` ditolak; RPC oleh `authenticated` ditolak; RPC oleh `service_role` berhasil. Uji sesi juga menolak RPC langsung oleh klien. |
| `AC-08` | `PASS` | Jurnal tanpa baris dan satu baris ditolak dengan "Jurnal minimal dua baris." |
| `AC-09` | `PASS` | `DELETE` akun yang dipakai ditolak; `aktif=false` berhasil dan satu baris jurnal lama tetap ada. |
| `AC-10` | `PASS` | Trigger uji memaksa kegagalan pada baris kedua; header dan baris pertama ter-rollback. Header tanpa detail juga ditolak saat commit dengan "Jurnal minimal dua baris." |
| `AC-11` | `PASS` | `post_journal()` dengan `PEMBALIKAN` tanpa `p_jurnal_asal_id` ditolak. Pembalik `2577eb0b-8fc3-4f4c-a300-1275ad07b3dc` membuat saldo jurnal asal + pembalik nol; jurnal asal identik sebelum/sesudah; pembalik kedua ditolak. |
| `AC-12` | `PASS` | Periode September 2026 dikunci; pembalik `83b518ad-6663-4938-878c-2875fec4378a` tersimpan pada November 2026 dan tidak menambah jurnal September. |
| `AC-13` | `PASS` | Akun 110 dinonaktifkan: "Akun 110 tidak ditemukan atau tidak aktif." |
| `AC-14` | `PASS` | Aktor Gudang ditolak untuk sumber yang hanya mengizinkan Accounting: "Anda tidak berwenang memposting transaksi ini." Jalur sesi server menghasilkan pesan yang sama. |
| `AC-15` | `PASS` | Mata uang USD ditolak: "Jurnal hanya boleh dalam mata uang IDR." |
| `AC-16` | `PASS` | COA berisi tepat 14 akun sesuai `D-41`; akun 150, 159, dan 702 tidak ada. |

## Verifikasi database

Database uji dibuat terpisah dari database bersama, memakai stub auth lokal, lalu menerapkan migrasi `0001`–`0008` dan seed COA `0011_fnd_006_coa.sql`. Database uji dihapus setelah pemeriksaan.

```text
$ node scripts/verify-fnd-006.mjs
Database: PostgreSQL 17.6 on x86_64-pc-linux-gnu

[PASS] AC-01: Jurnal balance tersimpan dan id dikembalikan
[PASS] AC-02: Jurnal tidak balance ditolak tanpa baris tersimpan
[PASS] AC-03: Akun tidak aktif ditolak dengan kode akun
[PASS] AC-04: Periode terkunci ditolak dengan nama periode
[PASS] AC-05: Jurnal tersimpan tidak bisa diubah atau dihapus
[PASS] AC-06: Sumber kosong atau tidak terdaftar ditolak
[PASS] AC-07: Tidak ada penulisan tabel jurnal dari luar core
[PASS] AC-08: Jurnal tanpa baris atau satu baris ditolak
[PASS] AC-09: Akun terpakai tidak bisa dihapus dan bisa dinonaktifkan
[PASS] AC-10: Header dan baris ditulis dalam satu transaksi
[PASS] AC-11: Jurnal pembalik membalik tanpa mengubah jurnal asal
[PASS] AC-12: Koreksi periode tertutup dilakukan di periode berjalan
[PASS] AC-13: Akun tidak aktif tidak bisa dipakai di jurnal baru
[PASS] AC-14: Aktor yang tidak berhak atas pemicu ditolak
[PASS] AC-15: Jurnal selain IDR ditolak
[PASS] AC-16: COA dasar D-41 tepat 14 akun tanpa akun cadangan
```

Skrip menolak database non-lokal atau nama database yang tidak diawali `fnd006_test_`, sehingga tidak dapat diarahkan ke database bersama.

## Verifikasi jalur sesi server

Proyek Supabase sementara berjalan pada port non-default, menerapkan migrasi `0001`–`0008`, lalu `pnpm db:seed`. Next.js berjalan terpisah dengan URL, publishable key, dan service-role key proyek uji. Route fixture hanya dipasang sementara dan dihapus setelah pengujian; proyek uji dihentikan.

```text
PASS tanpa sesi ditolak — Sesi Anda sudah berakhir. Silakan masuk lagi.
PASS Accounting dapat memposting lewat sesi
PASS satu jurnal tersimpan — 0 -> 1
PASS aktor diambil dari sesi
PASS actorId dari payload ditolak — Data jurnal tidak valid.
PASS peran tidak berhak ditolak oleh core — Anda tidak berwenang memposting transaksi ini.
PASS jurnal pembalik dapat dibuat lewat sesi
PASS pembalik merujuk jurnal asal dengan aktor sesi
PASS RPC langsung oleh klien ditolak — permission denied for function post_journal
```

Ini membuktikan `postJournalUntukSesi()` mengambil aktor dari sesi, menolak identitas dari payload, dan menegakkan peran melalui konfigurasi jenis sumber di core.

## Integrasi seed

```text
$ FND_TEST_PASSWORD=<rahasia-lokal> SUPABASE_DB_URL=<db-uji-lokal> node scripts/db-seed.mjs
[db-guard] target seed lokal
[db:seed] selesai — seed versi 0004 terpasang

akun_count | peran_count
         14 |          14

version
-------
0004

profiles
--------
      13
```

Seed deterministik FND-008 tetap berjalan dengan tambahan berkas `0011_fnd_006_coa.sql`. Tidak ada waktu sistem atau UUID acak baru di berkas seed FND-006.

## Gate proyek

```text
$ pnpm check:migrations
[check:migrations] ok — 7 berkas, nomor unik

$ pnpm verify
eslint: lulus
tsc --noEmit: lulus
depcruise: no dependency violations found (58 modules, 105 dependencies cruised)
next build: compiled successfully; 7/7 static pages generated

$ git diff --check
(tanpa keluaran)
```

## Verifikasi ulang 2026-11-23

Persetelan nomor integrasi diubah menjadi migrasi `0008_ledger_coa_jurnal_periode.sql` dan seed `0011_fnd_006_coa.sql`. Verifikasi diulang pada database lokal sekali pakai `fnd006_test_*` dengan migrasi `0001`–`0008`.

```text
$ SUPABASE_DB_URL=<database-uji-lokal> node scripts/verify-fnd-006.mjs
16/16 PASS — termasuk AC-11: "Jurnal PEMBALIKAN tanpa jurnal asal ditolak"

$ SUPABASE_DB_URL=<database-uji-lokal> node scripts/verify-fnd-005.mjs
15/15 PASS — perhitungan qty, nilai, harga rata, transaksi, RLS, dan penolakan stok tidak valid tetap terjaga

$ node scripts/verify-fnd-005-decimal.mjs
PASS invalid prices rejected before RPC; exact valuation, rounding, and overflow boundaries

$ pnpm verify
PASS lint, typecheck, arch:check, dan next build
```

`node scripts/verify-fnd-006-session.mjs` diulang pada proyek Supabase sekali pakai di port non-default dengan fixture route Next.js: 10/10 pemeriksaan lulus, termasuk penolakan tanpa sesi, aktor dari sesi, penolakan `actorId` dari payload, penolakan peran tidak berhak, penolakan `PEMBALIKAN` tanpa jurnal asal, dan penolakan RPC langsung oleh klien.

Proyek uji sekali pakai memerlukan `grant select on public.profiles to authenticated`; tanpa grant itu, query profil pada boundary sesi ditolak. Grant tersebut belum ada di migrasi repo dan merupakan gap `FND-003`, bukan perubahan pada item ini. `node scripts/verify-fnd-005-session.mjs` tidak diulang karena membutuhkan fixture route terpisah; uji database dan desimal FND-005 sudah diulang di atas.

## Batas dan risiko tersisa

- Item ini tidak menambah layar; konsumennya adalah service modul. Bukti perilaku memakai `postJournal()`/`reverseJournal()` dan jalur server yang diekspor `src/core/ledger`.
- Pembukaan periode bersifat lazy: posting pertama pada suatu bulan membuat baris `buka`; penutupan dan pembukaan kembali tetap milik `C-010`. Uji AC-04/AC-12 mengubah status langsung pada database uji, belum melalui alur tutup buku yang belum ada.
- `PEMBALIKAN` memakai `peran_berhak = null` karena otorisasi pembatalan dimiliki aksi dokumen pemanggil. Core tetap mewajibkan sesi staf aktif non-Karyawan; jenis sumber lain wajib mendaftarkan peran yang berhak.
- Nilai akun baru di luar 14 akun `D-41` tidak dikarang; item pemilik wajib menambahkannya melalui mekanisme `D-51`.
- Tidak ada test runner atau dependency baru. Verifikasi memakai `pg`, Supabase CLI, dan Node yang sudah ada.
