# FND-008 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-008` sebagai "Seed deterministik + reset ke skema `siap`", sequence 8, `depends on` `FND-001` (done) dan `FND-002` (specified, belum done). `D-30` menetapkan bahwa `db:reset` berakhir di `siap`; seed selalu berjalan dari `siap`.

Sebagian mekanisme sudah ada dari `FND-001`: `scripts/db-seed.mjs`, `supabase/seed.sql` (membuat `_seed_meta` dan mencatat versi `0001`), dan `scripts/db-guard.mjs` untuk reset. Bukti `FND-001` (`05-evidence.md`, AC-06, AC-07) menunjukkan seed dua kali menghasilkan nilai yang sama dan seed kedua ditolak. Isi data dasar di `FND-001` hanya `_seed_meta`; belum ada data domain.

## Pembaruan 2026-11-22

Keputusan terkunci: `D-37` (ambang approval adalah data bisnis; placeholder di seed, bertanda belum final), `D-30` (reset ke `siap`), `D-51` (c) dan (g) (seed approval awal dan skenario INT-002), `D-53` (13 akun peran), `D-27` (database lokal). Pertanyaan yang belum ada di keputusan terkunci diberi usulan `[USULAN-AGEN]`.

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
| OQ-08-01 | Isi data dasar: master apa saja, dan apakah transaksi ikut seed? | Menentukan ukuran item dan AC-01, AC-05, AC-06. | user / tech lead | Terjawab — [USULAN-AGEN]: seed hanya master dan saldo nol (satu gudang, satuan dasar, akun dasar `D-41`, 13 akun uji, aturan approval placeholder `D-37`). Transaksi dan jurnal tidak di-seed; dibuat uji item. Skenario kawat `D-51` (g) dibuat uji `INT-002`. Alasan: transaksi di seed membuat uji tidak bisa membuktikan proses. |
| OQ-08-02 | `FND-008` menunggu semua tabel item lain, atau setiap item menambah seed-nya sendiri? | Ketidakcocokan urutan dan dependensi tersembunyi. | tech lead | Terjawab — [USULAN-AGEN]: setiap item menambah berkas seed untuk tabel yang dibuatnya, di bawah mekanisme yang sama dan dengan nomor urut dari tech lead. Alasan: `FND-008` tidak menambah dependensi yang tidak ada di backlog. |
| OQ-08-03 | Akun uji (13 peran) dibuat di Supabase Auth lokal lewat seed, dengan kata sandi uji? Bagaimana menjamin tidak ikut ke lingkungan lain? | Keamanan dan DoR butir 4. | tech lead | Terjawab — [USULAN-AGEN]: 13 akun uji dibuat seed lokal dengan kata sandi uji; seed hanya bisa dijalankan dengan penjaga lingkungan lokal (`OQ-08-07`) dan database lokal (`D-27`). Alasan: kredensial uji tidak boleh berada di lingkungan non-lokal. |
| OQ-08-04 | Skenario uji wajib per siklus? | Menentukan isi seed dan uji. | user / tech lead | Terjawab — D-51 (g) untuk `INT-002` (kawat dan tiga jalur gagal); per siklus [USULAN-AGEN]: setiap alur dokumen punya satu jalur sukses, satu jalur tolak, satu jalur batal, dan satu kasus saldo nol. |
| OQ-08-05 | Versi seed: ketika isi berubah, apakah database yang sudah terisi harus di-reset? | Menentukan kapan seed "sudah pernah" berlaku. | tech lead | Terjawab — [USULAN-AGEN]: versi seed dicatat di `_seed_meta`; perubahan isi berarti reset penuh, tidak ada pembaruan di tempat. Alasan: konsisten dengan `FND-001` (`terisi` → `siap` hanya lewat reset penuh). |
| OQ-08-06 | Kunci deterministik: UUID tetap atau urutan tetap? | Menentukan `POST-04` dan perbandingan AC-01. | tech lead | Terjawab — [USULAN-AGEN]: UUID tetap yang ditulis literal di berkas seed, dengan pola per tabel. Alasan: id yang stabil bisa dirujuk di uji tanpa pencarian. |
| OQ-08-07 | Apakah `db:seed` memakai penjaga lingkungan lokal seperti `db:reset`? | Mencegah seed ke lingkungan non-lokal. | tech lead | Terjawab — [USULAN-AGEN]: ya; `db:seed` memakai penjaga yang sama (`FND-001` `PRE-04`). Alasan: seed membawa kredensial uji (`OQ-08-03`). |
| OQ-08-08 | Tabel `_seed_meta` tanpa RLS: tetap aturan untuk tabel penanda? | Konsistensi penanda. | tech lead | Terjawab — [USULAN-AGEN]: tabel penanda sistem punya RLS aktif tanpa kebijakan untuk role klien; tidak bisa dibaca atau ditulis klien. Alasan: penanda hanya dipakai skrip. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `[USULAN-AGEN]` OQ-08-01, 02 | Seed hanya master; setiap item menambah berkas seed sendiri | 2026-11-22 | tech lead (kunci koordinator) | Urutan seed; AC-05 dan AC-06 direvisi |
| `[USULAN-AGEN]` OQ-08-03, 07 | 13 akun uji lokal; `db:seed` memakai penjaga lingkungan | 2026-11-22 | tech lead (kunci koordinator) | AC-05, AC-07 |
| `[USULAN-AGEN]` OQ-08-05, 06, 08 | Versi di `_seed_meta` dan reset penuh; UUID tetap; RLS penanda | 2026-11-22 | tech lead (kunci koordinator) | AC-04 |

## Assumptions (agent-proposed)

- A1: Mekanisme dasar (`db:reset`, `db:seed`, penjaga versi) dipakai ulang dari `FND-001`; item ini memperluas isi.
- A2: Tipe item `chore`; ukuran `M` `[USULAN]` karena seed master lintas item.
- A3: Perbandingan hasil seed memakai jumlah baris dan nilai kunci, bukan seluruh isi tabel (`FND-001` `POST-04`).

## Rejected alternatives

- Seed dengan data acak tanpa benih: ditolak (`INV-03` `FND-001`).
- Seed dengan `now()` atau `current_date`: ditolak (`INV-03` `FND-001`).
- Menghapus baris seed secara manual: ditolak (`FND-001` status `terisi → siap` hanya lewat reset penuh).
- Seed transaksi dan jurnal: ditolak; transaksi harus lewat layanan supaya uji membuktikan prosesnya.

## Next step

Koordinator mengunci keputusan `[USULAN-AGEN]` di atas. Setelah `FND-002` `done`, item ini dapat menjadi `Ready` sesuai 03. Setiap item pemilik tabel menambah seed-nya sendiri.
