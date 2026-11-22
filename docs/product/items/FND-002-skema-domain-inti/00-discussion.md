# FND-002 — Diskusi

## Konteks

`backlog.md` (tabel Fondasi) mendefinisikan `FND-002` sebagai "Skema domain inti + migrasi bernomor", sequence 2, `depends on` `FND-001` (sudah `done` per 2026-11-22). FND-002 kini `done`; `supabase/migrations/0001_initial.sql` tetap menjadi baseline `profiles`, dan `0002_skema_domain_inti.sql` menyediakan skema domain dasar.

Analisis (`reference/analisis-sia.md` §7.2) mendaftar daftar tabel inti yang panjang. Analisis §11.4 mengusulkan pemecahan migrasi per kelompok (`0002_core.sql` … `0010_*.sql`) — ini `[USULAN]`, bukan keputusan, dan nomor tetap ditetapkan tech lead (`D-09`).

## Pembaruan 2026-11-22

Keputusan terkunci: `D-31` (kepemilikan tabel bersama), `D-32` (audit = kolom), `D-38` (C8 menjadi `C-014`), `D-54` (gate fondasi), `D-55` (tiga tabel dasar di FND-002), `D-56` (konvensi tipe), dan `D-58` (ratifikasi usulan konsisten pada tingkat-item). AC-01–AC-09, `pnpm verify`, dan review akhir lulus; backlog mencatat FND-002 `done`.

Keputusan eksplisit pengguna untuk item ini: `created_by` dan `updated_by` adalah kolom UUID nullable tanpa foreign key. Ini tidak diberi ID keputusan global. Kebijakan ini memungkinkan seed FND-008 sebelum akun FND-003 tersedia dan tidak menetapkan aturan penghapusan profil.

## Historis proposal agen (2026-11-22)

Log pertanyaan dan proposal di bawah dipertahankan sebagai riwayat. Proposal yang konsisten dengan keputusan terkunci diratifikasi oleh `D-58`; untuk cakupan tabel dan tipe data, `D-55` dan `D-56` adalah acuan langsung. Status proposal historis bukan keputusan tambahan.

## Kenapa item ini

`EPIC-FND` menyatakan tanpa skema bersama, empat kelompok akan membuat tabel dengan nama dan kolom sendiri. `FND-003` sampai `FND-008`, `C-011`, `C-013`, `PR-001`, dan `GJ-004` membutuhkan tabel yang didefinisikan di sini atau di item pemilik lain.

## Pemetaan tabel ke item (keputusan pass ini, lihat OQ-02-01)

| Tabel | Pemilik fitur | Dibuat oleh (DDL) | Dasar |
|---|---|---|---|
| `satuan`, `produk`, `gudang` | `C-011` | `FND-002` | OQ-02-03; `D-38`; `D-52` |
| `profiles` (dari `0001`) + kolom peran | `FND-003` | `FND-003` (migrasi tambahan) | OQ-03-11 |
| `riwayat_status`, `dokumen_counter`, `aturan_approval` | `FND-004` | `FND-004` | `D-08`, `D-37` |
| `mutasi_stok`, `saldo_stok` | `FND-005` | `FND-005` | `D-06`, `D-10` |
| `akun`, `jurnal`, `detail_jurnal`, `periode_akuntansi` | `FND-006` | `FND-006` | `D-07`, `D-41`, `D-43` |
| `permintaan_pembelian`, `po`, `penerimaan`, tabel QC | `C-013` | `C-013` | `D-31` |
| `invoice_supplier`, `utang` | `core/`, dibuat `PG-008` dan `PG-009` | item tersebut | `D-31`, `D-49` |
| `pelanggan`, `pemasok`, `karyawan`, `produk_komponen` | `core/` | item pertama yang membutuhkan | `D-31` |
| `alokasi_stok` | `core/` | `PD-003` | OQ-05-05 |
| `konfigurasi_pajak` | `core/` | `PD-005` | `D-17`, `D-51` |
| `tarif_*`, `gaji_pokok_histori` | `core/` atau `GJ-*` | `GJ-001`, `GJ-002`, `GJ-004` | `D-19` |
| `mata_uang`, `kurs` | `C-011` | `C-011` | `D-38` |
| `notifikasi` | `C-012` | `C-012` | `D-50` |
| `lampiran` | `core/` | item pertama yang membutuhkan | `D-31` |

## Actor / consumer

- Tech lead: pemilik item, menulis dan menomori migrasi (`D-09`).
- Anggota kelompok: memakai skema di lingkungan lokal; tidak menomori migrasi.
- CI: menjalankan `check:migrations` yang sudah ada.

## Problem

Tanpa skema bersama, tiap kelompok menulis DDL sendiri. Akibatnya tabel bertabrakan, kolom tidak konsisten, dan ada risiko dua tabel untuk satu fakta (misalnya dua saldo stok).

## Desired outcome

Setelah `pnpm db:reset`, skema `siap` berisi tiga tabel dasar bersama dengan relasi dan constraint dasar. Setiap tabel punya satu pemilik yang tercatat. Migrasi tambahan tetap lewat tech lead.

## Known constraints

- `D-04`: satu aplikasi, `src/core/` dan `src/modules/<siklus>/`.
- `D-06`: qty stok diturunkan dari `mutasi_stok`; tidak ada kolom `stok` di tabel produk.
- `D-07`: jurnal hanya ditulis lewat `postJournal()` (berlaku untuk penulisan, bukan definisi tabel).
- `D-08`: `riwayat_status` polimorfik, satu tabel untuk semua dokumen.
- `D-09`: migrasi dinomori dan di-merge hanya oleh tech lead.
- `D-27`: database lokal memakai Supabase CLI.
- `D-30`: `db:reset` berakhir di skema `siap`, bukan `kosong`.
- `ARCH-001` `ARCH-07`/`ARCH-08` dan `INV-06`: migrasi merged tidak berubah; modul tidak membaca tabel modul lain.
- `FND-001` `INV-01`: berkas migrasi lama tidak disunting.
- `D-31`: tabel domain bersama dimiliki `core/`; DDL dibuat item pertama yang membutuhkannya.
- `D-32`: audit = kolom `created_by`, `created_at`, `updated_by`, `updated_at` di setiap tabel.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-02-01 | Tabel apa saja yang masuk `FND-002`? | Menentukan ukuran item, daftar AC-01, dan gate. | tech lead | Terjawab — `D-55`: `FND-002` membuat `satuan`, `produk`, `gudang`, tanpa kolom stok. Tabel lain dibuat pemiliknya (`D-31`). |
| OQ-02-02 | Apakah tabel pengadaan didefinisikan di `FND-002` atau `C-013`? | `D-05` dan backlog bisa bertabrakan. | tech lead | Terjawab — D-31: permintaan, PO, penerimaan, QC di `C-013`; invoice dan utang di `PG-008` dan `PG-009`. |
| OQ-02-03 | `produk`, `gudang`, dan `satuan` dimiliki `C-011`. Apakah tabel itu masuk `FND-002` atau `FND-005` harus menunggu `C-011`? | Jika `C-011` harus selesai dulu, `FND-005` punya dependensi tersembunyi. | tech lead | Terjawab — `D-55`: tabel `satuan`, `produk`, `gudang` didefinisikan di `FND-002`; kepemilikan fitur tetap `C-011`. |
| OQ-02-04 | Kolom audit masuk konvensi `FND-002`, `C6`, atau item lain? | Menentukan kepemilikan kolom audit. | tech lead / user | Terjawab — D-32: kolom di setiap tabel; tidak ada tabel audit terpisah. |
| OQ-02-05 | Fitur `C6` audit belum punya item. | `D-01` melarang pemotongan. | user / tech lead | Terjawab — D-32 (catatan pemetaan `D-01`: `C6` = kolom audit di `FND-002`). |
| OQ-02-06 | Fitur `C8` dashboard belum punya item. | Kepemilikan dashboard. | user / tech lead | Terjawab — D-38: `C8` = `C-014`. |
| OQ-02-07 | Konvensi tipe angka dan waktu disahkan sebagai aturan? | Mengunci tipe kolom sebelum DDL. | tech lead | Terjawab — `D-56`: uang total `numeric(18,2)`; harga satuan, harga rata, dan qty `numeric(18,4)`; waktu `timestamptz` disimpan UTC dan ditampilkan `Asia/Jakarta`. |
| OQ-02-08 | Kolom dari keputusan terkunci yang menyentuh tabel modul masuk migrasi `FND-002` atau item pemilik? | Menentukan siapa menyentuh tabel apa. | tech lead | Terjawab — `D-31`: kolom modul masuk migrasi item pemilik tabel. |
| OQ-02-09 | Constraint dasar apa yang wajib di `FND-002`, dan mana milik item pemilik? | Constraint harus cocok dengan tabel yang dibuat. | tech lead | Terjawab — `D-58` meratifikasi proposal konsisten: unique `kode` pada tiga tabel, FK `produk.satuan_dasar_id`, dan check nama tidak kosong di FND-002; constraint lain oleh pemilik tabelnya. |
| OQ-02-10 | Migrasi dipecah per kelompok atau per item? Siapa menomori? | Mengubah jumlah file dan urutan merge. | tech lead | Terjawab — satu berkas per item pemilik DDL; nomor ditetapkan tech lead (`D-09`), proposal konsisten disahkan `D-58`. |
| OQ-02-11 | Test runner belum ada. Apakah `FND-002` memperkenalkannya atau cukup perintah SQL? | Menentukan cara membuktikan AC-01..AC-08. | tech lead | Terjawab — proposal bukti SQL/dump dan runner di FND-003 disahkan `D-58`. |
| OQ-02-12 | Apakah DoR butir 8 (gate `FND-001`–`FND-006`) berlaku literal untuk item fondasi? | Menentukan verdict item fondasi. | user / tech lead | Terjawab — proposal bahwa gate fondasi dibaca sebagai urutan disahkan `D-58`; gate berlaku sesuai `D-54`. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-55` | Tiga tabel dasar `satuan`, `produk`, `gudang` di `FND-002`; tanpa kolom stok | 2026-11-22 | Koordinator | AC-01, AC-04..AC-08 dan kontrak mengikuti |
| `D-56` | Konvensi tipe angka dan waktu untuk tabel domain | 2026-11-22 | Koordinator | Tabel ini tidak memiliki kolom numeric; timestamp audit memakai `timestamptz` |
| `D-58` | Proposal tingkat-item konsisten diratifikasi | 2026-11-22 | Koordinator | Constraint, bukti SQL, dan aturan item sesuai jawaban historis di atas |
| — | `created_by` dan `updated_by` nullable UUID tanpa FK | 2026-11-22 | User | Kolom aktor audit tidak mengikat ke profil |

## Assumptions

- Tipe item `chore` dan ukuran `S`–`M` adalah metadata klasifikasi item, bukan aturan skema.
- Pemetaan tabel di atas merangkum kepemilikan item sesuai keputusan yang tercatat.

## Rejected alternatives

- Menyunting `0001_initial.sql` untuk menambah tabel: ditolak, melanggar `FND-001` `INV-01` dan `ARCH-001` `INV-06`.
- Satu berkas migrasi besar untuk semua tabel: ditolak di `FND-001` (konflik merge di empat branch).
- Membuat `pelanggan`, `pemasok`, `karyawan` di `FND-002` tanpa pemakai: ditolak, melanggar `D-31` (DDL oleh item pertama yang membutuhkan).

## Next step

AC-01–AC-09, gerbang proyek, dan review akhir telah selesai. Item bergantung dapat maju sesuai backlog dan gate `D-54`.
