# FND-008 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-008` sebagai "Seed deterministik + reset ke skema `siap`", sequence 8, `depends on` `FND-001` dan `FND-002`, keduanya done pada branch kerja. `D-30` menetapkan bahwa `db:reset` berakhir di `siap`; seed selalu berjalan dari `siap`.

Sebagian mekanisme sudah ada dari `FND-001`: `scripts/db-seed.mjs`, `supabase/seed.sql` (membuat `_seed_meta` dengan RLS), dan `scripts/db-guard.mjs` untuk reset. FND-008 menambah versi dataset, guard untuk seed, dan berkas seed bernomor. Isi data domain di FND-001 hanya penanda.

## Pembaruan 2026-11-22

Keputusan berlaku: `D-37`, `D-30`, `D-51`, `D-53`, `D-27`, dan ratifikasi usulan tingkat-item oleh `D-58`. Atas instruksi pengguna pada 2026-11-22, fixture dasar memakai satuan generik `UNIT` / `Unit` dan gudang `GUDANG-01` / `Gudang Utama`; nilai ini bukan data operasional perusahaan.

## Kenapa item ini

Tanpa data dasar yang sama, setiap kelompok mengisi database dengan data karangan sendiri dan tidak bisa saling menguji (analisis §10.8). `INT-002` menguji rantai end-to-end dari `db:reset` dan `db:seed`.

## Actor / consumer

- Anggota kelompok: menjalankan reset dan seed di lingkungan lokal.
- CI: dapat menjalankan reset dan seed pada lingkungan uji (`OQ-08-07`).
- Tech lead: pemilik item; memutuskan mekanisme seed dan isi master dasar.

## Problem

Seed yang berbeda setiap kali menjalankan atau yang bergantung pada tanggal membuat uji tidak bisa diulang. Seed yang tidak mengenali data sisa membuat hasil uji tercampur.

## Desired outcome

`db:reset` lalu `db:seed` menghasilkan data dasar yang sama persis setiap kali. Seed menolak berjalan di atas data yang sudah ada. Data dasar berisi master, bukan transaksi; skenario transaksi dibuat uji item.

## Known constraints

- `D-30`: reset berakhir di `siap`; `kosong` hanya sesaat.
- `FND-001` `INV-03`: seed tidak bergantung pada tanggal hari ini, waktu sistem, atau acak tanpa benih tetap.
- `FND-001` `PRE-03`: seed dijalankan dari kondisi `siap`.
- `FND-001` `PRE-04`: reset menolak bila penanda lingkungan tidak lokal.
- `EPIC-FND` DoD per siklus: rantai dokumen bisa dijalankan dari `db:reset` dan `db:seed` tanpa menyentuh database manual.
- `D-22`: skrip demo dihapus dari dokumen analisis; "selesai" didefinisikan lewat DoD.
- `D-37`: ambang approval diisi placeholder di seed dan ditandai belum final.
- `D-51` (g): skenario uji `INT-002` memakai skenario kawat sebagai data ilustratif, plus tiga jalur gagal.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-08-01 | Isi data dasar: master apa saja, dan apakah transaksi ikut seed? | Menentukan ukuran item dan AC-01, AC-05, AC-06. | user / tech lead | Terjawab — `D-58` meratifikasi seed master per pemilik tabel; item ini mengisi satuan dan gudang. Transaksi, mutasi, saldo, dan jurnal tidak di-seed. Skenario kawat `D-51` (g) dibuat uji `INT-002`. |
| OQ-08-02 | `FND-008` menunggu semua tabel item lain, atau setiap item menambah seed-nya sendiri? | Ketidakcocokan urutan dan dependensi tersembunyi. | tech lead | Terjawab — `D-58` meratifikasi berkas seed bernomor per pemilik tabel; `db:seed` menjalankan berkas menurut urutan angka. |
| OQ-08-03 | Akun uji (13 peran) dibuat di Supabase Auth lokal lewat seed, dengan kata sandi uji? Bagaimana menjamin tidak ikut ke lingkungan lain? | Keamanan dan DoR butir 4. | tech lead | Terjawab — `D-53` dan `D-58`: akun uji dibuat oleh FND-003 dan `db:seed` hanya dapat menulis ke target lokal. |
| OQ-08-04 | Skenario uji wajib per siklus? | Menentukan isi seed dan uji. | user / tech lead | Terjawab — `D-51` (g) untuk `INT-002`; skenario per item berlaku lewat ratifikasi usulan tingkat-item `D-58`. |
| OQ-08-05 | Versi seed: ketika isi berubah, apakah database yang sudah terisi harus di-reset? | Menentukan kapan seed "sudah pernah" berlaku. | tech lead | Terjawab — `D-58`: versi tersimpan di `_seed_meta`; perubahan versi menolak seed sampai reset penuh. |
| OQ-08-06 | Kunci deterministik: UUID tetap atau urutan tetap? | Menentukan `POST-04` dan perbandingan AC-01. | tech lead | Terjawab — `D-58`: UUID tetap ditulis literal di berkas seed agar dapat dirujuk langsung. |
| OQ-08-07 | Apakah `db:seed` memakai penjaga lingkungan lokal seperti `db:reset`? | Mencegah seed ke lingkungan non-lokal. | tech lead | Terjawab — `D-58`: ya, `db:seed` memakai penjaga lingkungan yang sama dengan reset. |
| OQ-08-08 | Tabel `_seed_meta` tanpa RLS: tetap aturan untuk tabel penanda? | Konsistensi penanda. | tech lead | Terjawab — `D-58`: RLS aktif tanpa policy untuk role klien; penanda hanya digunakan skrip. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-58` OQ-08-01, 02 | Seed hanya master; setiap item menambah berkas seed bernomor sendiri | 2026-11-22 | Koordinator | Urutan seed; AC-05 dan AC-06 direvisi |
| `D-58` OQ-08-03, 07 | Akun uji dikelola FND-003; `db:seed` memakai penjaga lokal | 2026-11-22 | Koordinator | AC-05, AC-07 |
| `D-58` OQ-08-05, 06, 08 | Versi di `_seed_meta` dan reset penuh; UUID tetap; RLS penanda | 2026-11-22 | Koordinator | AC-04 |
| Fixture dasar | Satuan `UNIT` / `Unit`; gudang `GUDANG-01` / `Gudang Utama` | 2026-11-22 | Pengguna | Data generik lokal; tidak merepresentasikan master operasional |
| Versi dataset | Nomor berkas mengatur urutan; `supabase/seed-version` mengatur versi data dan naik saat isi berubah | 2026-11-22 | Pengguna | Perubahan data lama ditolak sampai reset penuh |

## Assumptions (agent-proposed)

- A1: Mekanisme dasar (`db:reset`, `db:seed`, penjaga lokal) dipakai ulang dari `FND-001`; item ini menambah penjaga versi dan urutan berkas.
- A2: Tipe item `chore`; ukuran `M` karena item memperluas seed master lintas item.
- A3: Perbandingan hasil seed memakai jumlah baris dan nilai kunci, bukan seluruh isi tabel (`FND-001` `POST-04`).

## Rejected alternatives

- Seed dengan data acak tanpa benih: ditolak (`INV-03` `FND-001`).
- Seed dengan `now()` atau `current_date`: ditolak (`INV-03` `FND-001`).
- Menghapus baris seed secara manual: ditolak (`FND-001` status `terisi → siap` hanya lewat reset penuh).
- Seed transaksi dan jurnal: ditolak; transaksi harus lewat layanan supaya uji membuktikan prosesnya.

## Next step

`D-58` telah meratifikasi usulan tingkat-item dan `FND-001` serta `FND-002` sudah `done` pada branch ini. Implementasi FND-008 selesai di branch dan menunggu review/merge; setiap item pemilik tabel dapat menambah berkas seed bernomor melalui mekanisme yang sama.
