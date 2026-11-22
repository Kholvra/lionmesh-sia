# INT-001 — Diskusi

## Konteks

`INT-001` adalah **jurnal gabungan konsisten lintas empat siklus** (`EPIC-INT`, `backlog.md` level 9). Epic ini menguji persimpangan, bukan fitur: empat siklus bisa benar sendiri-sendiri, tetapi total neraca tetap tidak balance bila asumsi antar modul berbeda.

Backlog mencantumkan `depends on`: `PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, dan `C-010` (`C-010` ditambahkan 2026-11-22 agar selaras dengan `EPIC-INT`), serta `PG-010`. Item ini memblokir `INT-002` dan `INT-003`.

Gate mulai `EPIC-INT`: tidak boleh mulai sebelum `PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, dan `C-010` `done`. Gate join di `backlog.md` (aturan 4): `INT-001` tidak boleh mulai sebelum seluruh jurnal siklus ada.

Analisis §6.7 memberi usulan pemetaan jurnal per kejadian. Analisis sendiri menyatakan pemetaan itu "wajib disahkan". Pemetaan yang sudah dikunci ada di `D-44`, `D-49`, dan `D-41`; sisanya diuraikan di PT-02.

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `INT-001`) dan `epics/EPIC-INT.md`.

## Context

- `EPIC-INT` outcome: "Empat siklus berjalan di atas satu jurnal, satu saldo stok, dan satu set laporan yang angkanya saling cocok."
- `EPIC-INT` gate selesai 1: neraca balance setelah seluruh siklus dijalankan berurutan.
- `EPIC-INT` gate selesai 4: tidak ada dokumen yang bisa diposting ke periode tertutup.
- `EPIC-INT` catatan: temuan di epic ini harus diselesaikan di `core/`, bukan ditambal di modul.

## Actor / consumer

- Pemilik epic: tidak ditetapkan di `EPIC-INT` (PT-08, `[USULAN-AGEN]`: tech lead).
- Penguji: tech lead atau pihak yang ditunjuk (PT-08).
- Pembaca hasil: `C-009` (neraca saldo dan laba rugi).

## Problem

Setiap siklus bisa lolos uji sendiri, tetapi jurnal gabungan bisa tidak balance, akun bisa menggantung, atau dokumen yang sama bisa menghasilkan jurnal berbeda di modul yang berbeda.

## Desired outcome

Setelah seluruh siklus dijalankan dari data uji yang sama, jurnal dari semua siklus membentuk satu jurnal yang konsisten: setiap jurnal balance, setiap akun dikenal, setiap baris punya sumber, dan neraca saldo balance.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-07` | Jurnal hanya lewat `postJournal()`. Tidak ada modul yang menulis tabel jurnal langsung. |
| `D-25`, `ARCH-08` | Pengujian lintas siklus membaca lewat core (`C-009`), bukan tabel modul. |
| `D-28` | Gerbang PR di GitHub Actions berisi lima pemeriksaan. Penambahan INT-001 ke CI: usulan PT-07 (`[USULAN-AGEN]`, di luar gerbang PR). |
| `D-30` | Data uji berasal dari `db:reset` lalu `db:seed`. Seed berjalan dari skema `siap`. |
| `D-35`, `D-41` | Jurnal memanggil akun lewat peran akun. Nomor akun di konfigurasi `FND-006`. |
| `D-43` | Jurnal balance tanpa toleransi. Setiap jurnal punya jenis transaksi asal, nomor transaksi asal, dan pemicu. Koreksi lewat jurnal pembalik. |
| `D-44` | Saat pengakuan per kejadian (1 sampai 5). |
| `D-45` | Aset tetap dan penyusutan di luar cakupan; jurnal 11 dan 12 di proses-bisnis.md tidak berlaku. |
| `D-49` | Aturan jurnal pembayaran pemasok, gaji akrual, dan pembayaran gaji. |
| `D-51` (b) | Payroll: parameter berversi; nilai dari regulasi yang berlaku, tidak dari ingatan. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 10 pertanyaan — 5 terjawab dari keputusan terkunci (PT-01, PT-02, PT-04, PT-06, PT-10), 5 terjawab `[USULAN-AGEN]` (PT-03, PT-05, PT-07, PT-08, PT-09), 0 terbuka.

- PT-01 — Predecessor PR: `depends on` mencantumkan `PR-007`, bukan `PR-006` yang memegang HPP. Owner: tech lead. **Status: Terjawab — backlog.md.** `PR-007` depends on `PR-006` (transitif), sehingga HPP produksi sudah `done` saat `PR-007` `done`. Tidak perlu tambahan `depends_on`.
- PT-02 — Pemetaan jurnal per kejadian. Owner: pengguna dengan pemilik `FND-006`. **Status: Terjawab — D-41, D-44, D-49.** Peta lengkap: (1) bahan masuk saat QC lulus: Dr `persediaan_bahan` / Cr `gr_ir` (`D-44` (1)). (2) invoice cocok: Dr `gr_ir` / Cr `utang_usaha` (`D-44` (2)). (3) HPP saat kirim: Dr 501 (peran HPP) / Cr `persediaan_barang_jadi`; faktur: Dr `piutang_usaha` / Cr penjualan (`D-44` (3)). (4) tenaga kerja langsung ke perintah produksi dari kartu jam (`D-44` (4)). (5) pembayaran pemasok: Dr `utang_usaha` / Cr `kas_bank` (`D-41` dan `D-35`, alokasi tertua dulu `D-49`). (6) gaji akrual saat payroll disetujui Direksi: Dr beban gaji / Cr `utang_gaji` (`D-49`). (7) pembayaran gaji: Dr `utang_gaji` / Cr `kas_bank` (`D-49`). (8) utang BPJS dan utang PPh 21 adalah peran akun dengan nomor ditetapkan saat `FND-006` ditulis (`D-41`); tarif berversi (`D-51` (b)). Tidak ada jurnal aset tetap dan penyusutan (`D-45`).
- PT-03 — Definisi akun menggantung. Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: akun menggantung adalah akun di baris jurnal yang tidak ada di konfigurasi COA, atau berstatus nonaktif. Akun yang ada tapi tanpa mutasi bukan akun menggantung. Alasan: `FND-006` menentukan status akun; mutasi nol adalah kondisi sah.
- PT-04 — Akun GR/IR: ada di COA atau tidak? Owner: pengguna. **Status: Terjawab — D-41, D-35, D-44 (1).** Akun 202 "Utang belum difakturkan" adalah akun GR/IR, diakses lewat peran `gr_ir`.
- PT-05 — Data uji lintas siklus: `FND-008` (seed) tidak ada di `depends on` `INT-001`. Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: `INT-001` memakai seed dari `FND-008` (`D-30`) dan tidak mendaftarkan `FND-008` di `depends_on`. Karena semua siklus membutuhkan master dari seed, `FND-008` harus `done` sebelum `INT-001` dijalankan. Ini usulan koordinasi, bukan perubahan backlog.
- PT-06 — Toleransi pembulatan: nol atau selisih per jurnal? Owner: pengguna. **Status: Terjawab — D-43.** Debit = kredit tanpa toleransi.
- PT-07 — Apakah INT-001 masuk CI (`D-28`) atau hanya manual? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: INT-001 tidak masuk gerbang PR (`D-28` mengunci lima gerbang). Pemeriksaan dijalankan manual dan terjadwal, dan wajib hijau sebelum item `done`. Alasan: pemeriksaan butuh `db:reset` + `db:seed` penuh yang terlalu berat untuk setiap PR.
- PT-08 — Pemilik item dan penguji. Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: `owner_role` tech lead; penguji tech lead atau yang ditunjuk tech lead. Alasan: `EPIC-INT` tidak menetapkan pemilik, dan `INT-001` menyentuh semua siklus.
- PT-09 — Prioritas dan ukuran. Owner: pengguna dan tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: prioritas P0 (gate join). Analisis tidak punya prioritas untuk `INT-*` (`D-50`), sehingga usulan ini tidak berasal dari analisis. Ukuran M.
- PT-10 — Konflik urutan `D-20` untuk item core dan `C-009` / `C-010`. Owner: pengguna. **Status: Terjawab — D-34.** `C-009` menyusul dan `C-010` terakhir; keduanya selesai sebelum join.

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-07` | Jurnal hanya lewat `postJournal()` | 2026-11-17 | pengguna | Pengujian memeriksa jalur tunggal |
| `D-25` | Laporan lintas siklus milik core | 2026-11-17 | pengguna | Pengujian memakai `C-009` |
| `D-30` | Reset ke `siap`, seed dari `siap` | 2026-11-22 | pengguna | Data uji berasal dari perintah, bukan tangan |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk INT-001 |
|---|---|---|
| `D-34` | Urutan core: C-009 menyusul, C-010 terakhir | PT-10 |
| `D-35` | Peran akun; dokumen batal = jurnal pembalik | pemetaan akun dengan peran |
| `D-41` | COA dasar; 202 = GR/IR; nomor baru di `FND-006` | PT-02, PT-04 |
| `D-43` | Aturan jurnal: debit = kredit, tidak bisa diubah, ada sumber | PT-06, kriteria sumber |
| `D-44` | Saat pengakuan per kejadian (1 sampai 5) | PT-02 |
| `D-45` | Aset tetap dan penyusutan di luar cakupan | jurnal 11 dan 12 tidak diuji |
| `D-49` | Pembayaran pemasok, gaji akrual, pembayaran gaji | PT-02 |
| `D-51` (b) | Parameter payroll berversi; tidak dari ingatan | PT-02 (BPJS, PPh 21) |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-03: definisi akun menggantung.
- PT-05: `FND-008` harus `done` sebelum `INT-001` dijalankan (usulan koordinasi).
- PT-07: pemeriksaan di luar gerbang PR, terjadwal atau manual.
- PT-08: owner tech lead.
- PT-09: prioritas P0.
- `[USULAN]` Pengujian dijalankan setelah `db:reset` + `db:seed`, lalu seluruh rantai siklus dijalankan berurutan.
- `[USULAN]` Hasil dibandingkan dengan nilai yang dihitung tangan, bukan hanya dengan konsistensi internal.

## Rejected alternatives (optional)

- Menguji jurnal per modul saja. Ditolak: `EPIC-INT` menyatakan bahwa kegagalan ada di persimpangan.
- Menambal jurnal yang tidak balance di modul. Ditolak: `EPIC-INT` menyatakan temuan harus diselesaikan di `core/`.

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu tujuh dependensi di `depends_on` berstatus `done`, lalu siap menjadi `Ready` (lihat `03`). Usulan `PT-03`, `PT-05`, `PT-07`, `PT-08`, dan `PT-09` perlu dikunci koordinator.
