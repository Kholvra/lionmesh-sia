# INT-003 — Diskusi

## Konteks

`INT-003` adalah **rekonsiliasi stok terhadap jurnal dan laporan** (`EPIC-INT`, `backlog.md` level 10). Epic menyatakan bahwa stok fisik, mutasi, saldo, dan jurnal persediaan harus cocok.

Backlog mencantumkan `depends on` `INT-001` saja. Item ini tidak bergantung langsung pada `INT-002`. Karena `INT-001` bergantung pada seluruh siklus, `FND-005` dan `C-009` sudah `done` saat item ini dimulai.

Gate selesai `EPIC-INT` nomor 3: nilai persediaan di neraca sama dengan `saldo_stok`. Aturan terkait di `ARCH-001`: `INV-02` (`nilai = qty × harga_rata`) dan `INV-03` (qty saldo = jumlah mutasi).

Keputusan `D-06`: qty stok diturunkan dari `mutasi_stok`, nilai disimpan di `saldo_stok`, dan keduanya diperbarui dalam transaksi yang sama. `D-10` (Q1): valuasi rata-rata bergerak.

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `INT-003`) dan `epics/EPIC-INT.md`.

## Context

- Analisis §7.1 poin 1: "Jumlah = `SUM(mutasi.qty)`. Nilai ... butuh `saldo_stok` yang di-update dalam transaksi yang sama dengan mutasinya."
- Analisis §7.2: `pemeriksaan_stok` adalah stock opname. Analisis §7.3 `[ANALISIS]` menyebutnya "log, bukan sumber saldo".
- `D-52`: stock opname dan transfer antar gudang tetap dalam cakupan penuh, dikerjakan paling akhir di `FND-005`.
- `D-41`: akun persediaan 120, 121, dan 122 (per tipe); nilai persediaan neraca = jumlah ketiganya.
- `D-44` (1) dan `D-36`: bahan masuk saat QC lulus, Dr `persediaan_bahan` / Cr `gr_ir`.

## Actor / consumer

- Penguji: tech lead atau pihak yang ditunjuk (PT-08, `[USULAN-AGEN]`).
- Pengelola stok opname: `FND-005` (`D-52`).
- Pembaca hasil: pengguna Accounting dan Gudang.

## Problem

Stok bisa benar di gudang tetapi tidak cocok dengan jurnal persediaan, atau sebaliknya. Tanpa rekonsiliasi, selisih baru terlihat ketika laporan tidak cocok.

## Desired outcome

Ada pemeriksaan yang membandingkan tiga sumber: stok fisik (hasil stock opname), mutasi dan saldo stok, dan jurnal persediaan di neraca. Ketika ketiganya cocok, pemeriksaan lulus. Ketika tidak, selisihnya tampil per produk dan gudang.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-06` | Qty dari `mutasi_stok`. Nilai di `saldo_stok`. Diperbarui dalam transaksi yang sama. |
| `D-10` | Valuasi rata-rata bergerak. Tidak ada lapisan stok. Catatan konfirmasi FIFO tetap terbuka (lihat `03`). |
| `D-07` | Jurnal persediaan hanya lewat `postJournal()`. |
| `D-25`, `ARCH-08` | Pemeriksaan lintas siklus membaca lewat core. |
| `D-41` | Persediaan per tipe: 120, 121, 122. Nilai neraca = jumlah ketiganya. |
| `D-43` | Debit = kredit tanpa toleransi. Prinsip yang sama dipakai untuk qty dan nilai (PT-03). |
| `D-50` | Master nonaktif tidak dihapus; saldonya tetap terhitung. |
| `D-52` | Stock opname dikerjakan paling akhir di `FND-005`. Multi-gudang: saldo per produk per gudang. |
| `ARCH-001` `INV-02`, `INV-03` | Nilai = qty × harga_rata; qty saldo = jumlah mutasi. |
| Analisis §10.6 `[USULAN]` | Uang `numeric(18,2)`, qty `numeric(18,4)`. Pembulatan saat tampil. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 10 pertanyaan — 4 terjawab dari keputusan terkunci (PT-01, PT-04, PT-06, PT-10), 6 terjawab `[USULAN-AGEN]` (PT-02, PT-03, PT-05, PT-07, PT-08, PT-09), 0 terbuka.

- PT-01 — Stok fisik: apakah sumber stok fisik adalah stock opname, dan masuk `INT-003`? Owner: pengguna. **Status: Terjawab — D-52.** Stock opname tetap dalam cakupan penuh dan dikerjakan paling akhir di `FND-005`. Hasil opname menjadi sumber stok fisik. Karena `INT-001` bergantung pada `FND-005`, hasil itu sudah tersedia saat `INT-003` dimulai.
- PT-02 — Bentuk keluaran: laporan selisih, pemeriksaan yang gagal, atau keduanya? Apa yang terjadi bila ada selisih? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: keluaran berupa daftar selisih per produk dan gudang, plus status lulus atau gagal. Selisih tidak memblokir transaksi dan tidak mengubah saldo. Koreksi dilakukan lewat mutasi penyesuaian dari stock opname (`FND-005`) atau jurnal pembalik. Alasan: `D-06` melarang penyesuaian diam-diam, dan rekonsiliasi harus menunjuk selisih.
- PT-03 — Toleransi: nol, atau selisih pembulatan? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: toleransi nol untuk qty (unit terkecil numerik, `numeric(18,4)`) dan nilai (`numeric(18,2)`). Pembulatan nilai dari `qty × harga_rata` memakai aturan tetap yang ditulis di kontrak, lalu dibandingkan persis. Alasan: `D-43` mengunci debit = kredit tanpa toleransi, dan prinsip yang sama berlaku untuk stok.
- PT-04 — Akun persediaan: satu akun untuk semua, atau per tipe? Owner: pemilik `FND-006`. **Status: Terjawab — D-41.** Tiga akun per tipe: 120, 121, 122. Nilai persediaan neraca = jumlah ketiganya.
- PT-05 — Waktu rekonsiliasi: setiap mutasi, setiap periode, atau saat diminta? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: saat diminta oleh Accounting, dan sebagai langkah rantai `INT-002`. Tidak berjalan otomatis di setiap mutasi. Alasan: rekonsiliasi hanya membaca dan tidak mengubah saldo.
- PT-06 — Penerimaan dan GR/IR: stok masuk saat penerimaan atau setelah QC? Owner: pengguna. **Status: Terjawab — D-36, D-44 (1), D-41.** Stok masuk saat QC lulus dengan Dr `persediaan_bahan` / Cr `gr_ir` (akun 202).
- PT-07 — Stok negatif: apakah `INT-003` hanya memeriksanya, atau juga mengujinya? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: `INT-003` memeriksa dan menampilkan saldo negatif sebagai selisih. Penegakan larangan stok negatif ada di `FND-005` (usulan koordinasi). Alasan: pemeriksa tidak mengubah saldo (`D-06`).
- PT-08 — Pemilik item dan penguji. Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: `owner_role` tech lead; penguji tech lead atau yang ditunjuk. Pembaca hasil Accounting dan Gudang (lihat `01`).
- PT-09 — Prioritas dan ukuran. Owner: pengguna dan tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: prioritas P0 (gate `EPIC-INT` nomor 3). Analisis tidak punya prioritas untuk `INT-*` (`D-50`). Ukuran M.
- PT-10 — Cakupan per gudang: apakah rekonsiliasi mencakup saldo per gudang? Gudang nonaktif dengan saldo? Owner: pengguna. **Status: Terjawab — D-50 dan D-52.** Rekonsiliasi per produk dan per gudang (`D-52`). Gudang nonaktif tetap dihitung dan tampil sebagai baris. Nonaktif hanya berarti tidak bisa dipilih untuk dokumen baru (`D-50`).

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-06` | Qty dari mutasi; nilai di saldo; transaksi sama | 2026-11-17 | pengguna | Dasar pemeriksaan |
| `D-10` | Rata-rata bergerak (Q1) | 2026-11-17 | pengguna | Tidak ada lapisan stok |
| `D-07` | Jurnal hanya lewat `postJournal()` | 2026-11-17 | pengguna | Jurnal persediaan dari core |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk INT-003 |
|---|---|---|
| `D-06` | Qty dari mutasi; nilai di saldo | dasar pemeriksaan |
| `D-10` | Rata-rata bergerak (locked); catatan "Perlu konfirmasi" | valuasi; lihat catatan di `01` |
| `D-36` | Stok masuk setelah QC lulus | PT-06 |
| `D-41` | Akun 120, 121, 122 persediaan; 202 GR/IR | PT-04, PT-06 |
| `D-43` | Debit = kredit tanpa toleransi | PT-03 |
| `D-44` (1) | Bahan masuk Dr `persediaan_bahan` / Cr `gr_ir` | PT-06 |
| `D-50` | Master nonaktif tidak dihapus | PT-10 |
| `D-52` | Stock opname di FND-005; multi-gudang | PT-01, PT-10 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-02: keluaran berupa daftar selisih dan status; selisih tidak memblokir transaksi.
- PT-03: toleransi nol; pembulatan nilai dengan aturan tetap.
- PT-05: rekonsiliasi saat diminta atau sebagai langkah `INT-002`.
- PT-07: saldo negatif tampil sebagai selisih; penegakan di `FND-005`.
- PT-08: owner tech lead.
- PT-09: prioritas P0, ukuran M.
- `[USULAN]` Rekonsiliasi hanya membaca, tidak mengubah saldo atau jurnal.
- `[USULAN]` Selisih ditampilkan per produk dan gudang, bukan hanya total.
- `[USULAN]` Pemeriksaan dapat dijalankan dua kali dengan hasil identik.

## Rejected alternatives (optional)

- Menyesuaikan saldo otomatis agar cocok dengan jurnal. Ditolak: `D-06`, dan rekonsiliasi harus menemukan selisih, bukan menyembunyikannya.
- Menggunakan `pemeriksaan_stok` sebagai sumber saldo. Ditolak: analisis §7.3 menyebutnya log.

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `INT-001` berstatus `done` (dan transitif `FND-005`, `C-009`), lalu siap menjadi `Ready` (lihat `03`). Usulan `PT-02`, `PT-03`, `PT-05`, `PT-07`, `PT-08`, dan `PT-09` perlu dikunci koordinator.
