# PG-009 — Diskusi

## Konteks

PG-009 mencatat pembayaran kepada pemasok atas utang yang sudah diakui (PG-008), termasuk pembayaran sebagian dan pembayaran yang menutup beberapa invoice. Item ini berada di track PG-D utang, level 8 (derived dari backlog). Ini adalah simpul terakhir jalur kritis Pengeluaran dan menjadi dependensi `INT-001`.

Sumber: `[SUMBER]` "Pembayaran parsial menyisakan saldo" (`reference/analisis-sia.md` §8.1). `[SUMBER]` "Finance menyimpan bukti transfer" dan "Transfer gagal/parsial harus ditandai" (§8.1). `[USULAN]` alokasi ke beberapa faktur (§7.4, §8.2 #8), kini dikunci D-49.

## Actor / consumer

- Finance: mencatat dan mengeksekusi pembayaran (D-33: Bayar pemasok = Finance).
- Accounting: memverifikasi pembayaran pemasok (baris matriks ditambahkan D-47 (e)); pemilik jurnal dan saldo utang.

## Problem

Tanpa pencatatan pembayaran, saldo utang tidak bisa dibandingkan dengan kas, dan laporan utang tidak sama dengan jurnal (EPIC-PG gate 4).

## Desired outcome

- Finance mencatat pembayaran kepada satu atau beberapa invoice.
- Saldo utang berkurang sesuai alokasi.
- Pembayaran gagal atau parsial ditandai.
- Bukti transfer tersimpan.
- Saldo utang di laporan sama dengan jurnal.

## Known constraints

- Pembayaran parsial menyisakan saldo (§8.1).
- Pembayaran tidak boleh melebihi utang (D-49, usulan §7.5).
- Jurnal hanya lewat `postJournal()` (D-07, D-43).
- Periode akuntansi terkunci menolak transaksi baru (FND-006, DoD #9).
- Akun 102 Bank dan 201 Utang usaha sudah ditetapkan (D-41). Akun kas terpisah tidak ada di D-41.

## Keputusan yang sudah terkunci

| Sumber | Isi | Konsekuensi |
|---|---|---|
| `EPIC-PG` gate 4 | Saldo utang di laporan sama dengan jurnal | Saldo dan jurnal diuji bersama |
| `EPIC-PG` gate 1 | Satu permintaan mengalir sampai pembayaran | Pembayaran adalah titik akhir alur |
| `D-07`, `D-43` | Jurnal lewat `postJournal()`; langsung diposting; tanpa jurnal manual | Jurnal pembayaran lewat service ledger saat transfer berhasil |
| `D-08` | Riwayat polimorfik | Setiap perubahan status pembayaran dan utang masuk riwayat |
| `D-25`, `D-50` | Laporan lintas siklus milik core; laporan tampil di layar dulu | Laporan utang milik core (C-009) |
| `D-33`, `D-47` (e) | Bayar pemasok = Finance; verifikasi pembayaran pemasok = Accounting; Accounting tidak mengeksekusi | Pemisahan Finance dan Accounting |
| `D-35`, `D-41` | Peran `kas_bank` = akun 102; 201 Utang usaha | Jurnal memakai peran dan nomor dari konfigurasi |
| `D-42` | Pemohon PR tidak boleh membayar invoice dari PR-nya (telusur invoice → PO → PR) | Pemisahan tugas ditegakkan sistem |
| `D-44` (5) | Koreksi periode tertutup lewat jurnal pembalik di periode berjalan | Tanggal pembayaran dan koreksi |
| `D-46` | Status `TERCATAT`, `DIBAYAR_SEBAGIAN`, `LUNAS` | Nama status invoice |
| `D-48` | Pembalikan setelah diposting hanya lewat jurnal pembalik; alasan wajib | Pembatalan pembayaran |
| `D-49` | Kelebihan bayar ditolak; alokasi tertua dulu; transfer gaji gagal boleh diulang dengan alasan | Aturan alokasi dan kegagalan |
| `D-51` (c) | Pembayaran pemasok tidak berjenjang | Tidak ada approval berjenjang |

## Open questions

| ID | Pertanyaan | Kenapa penting | Pemilik | Status |
|---|---|---|---|---|
| Q-01 | Daftar status utang dan pembayaran final. Sumber hanya memberi `LUNAS` dan `DIBAYAR_SEBAGIAN` untuk pelanggan (§6.8). | Menentukan transisi | Pengguna | Terjawab — D-46: `TERCATAT` → `DIBAYAR_SEBAGIAN` → `LUNAS` (status invoice). Status gagal [USULAN-AGEN]: `GAGAL_TRANSFER`, nama dari `diagram-sia-lengkap.md` §5.4 (transfer gagal pada payroll), dipakai juga untuk pemasok. Parsial tidak punya status terpisah. |
| Q-02 | Kelebihan bayar ke pemasok: ditolak, atau menjadi saldo debit pemasok? | Menyentuh uang | Pengguna | Terjawab — D-49: kelebihan bayar ditolak di versi awal, tanpa saldo kredit. |
| Q-03 | Urutan alokasi ke beberapa invoice (misalnya jatuh tempo terdekat dulu, atau urutan input)? | Menentukan sisa per invoice | Pengguna | Terjawab — D-49: alokasi ke invoice tertua dulu. "Tertua" memakai tanggal invoice, dengan nomor invoice sebagai urutan kedua. |
| Q-04 | Akun kas atau bank yang dikreditkan: rekening bank mana, dan akun kas di COA belum ditetapkan. | Syarat wajib item menyentuh uang | Pengguna (Accounting) + FND-006 | Terjawab — D-41 (102 Bank) dan D-35 (peran `kas_bank`). Rekening dipilih dari master rekening aktif; semua rekening dipetakan ke peran `kas_bank`. Jumlah rekening riil dari DISC-002 hanya mengisi data seed. [USULAN-AGEN] untuk pemetaan ini. |
| Q-05 | Pembayaran gagal atau parsial: nama status, siapa yang menandai, dan jejak apa. | Sumber mewajibkan penandaan; statusnya belum ada | Pengguna | Terjawab — [USULAN-AGEN]: pembayaran parsial ditandai `DIBAYAR_SEBAGIAN` pada invoice (D-46). Transfer gagal ditandai `GAGAL_TRANSFER` oleh Finance, tanpa jurnal dan tanpa mengubah utang. Jejak di riwayat (D-08). Dasar: LAPORAN UC-PG11 ("sistem menampilkan status gagal dan tidak mencatatnya sebagai pembayaran berhasil") dan diagram §5.4. |
| Q-06 | Bukti transfer: format lampiran, dan apakah wajib sebelum status lunas? | Sumber mewajibkan penyimpanan; aturan wajibnya belum ada | Pengguna | Terjawab — [USULAN-AGEN]: format PDF, JPG, atau PNG. Lampiran wajib saat hasil transfer berhasil dicatat (sehingga juga wajib sebelum `LUNAS`). Batas ukuran adalah parameter konfigurasi, bukan angka dari item ini. |
| Q-07 | Verifikasi pembayaran pemasok oleh Accounting: tidak ada di matriks pengeluaran, tetapi ada untuk pelanggan. | Menentukan pemisahan tugas | Pengguna | Terjawab — D-47 (e) menambah baris "Verifikasi pembayaran pemasok = Accounting". Pelaksanaan [USULAN-AGEN]: verifikasi berupa kolom `diverifikasi_oleh` dan `diverifikasi_pada` pada pembayaran, bukan status baru (D-47 melarang status di luar daftar). Hasil transfer hanya boleh dicatat setelah verifikasi. Verifikator tidak boleh sama dengan pencatat (D-48). |
| Q-08 | Laporan yang termasuk PG-009: laporan pembelian (matriks, Purchasing/Accounting/Manajemen) atau laporan keuangan (C-009, D-25)? | Menentukan batas item dan pemilik laporan | Pengguna + tech lead | Terjawab — [USULAN-AGEN]: laporan utang dan laporan pembelian milik core (C-009) sesuai D-25 dan D-50. PG-009 menyediakan daftar pembayaran, sisa per invoice, dan read model saldo utang lewat service core. |
| Q-09 | Pembayaran perlu approval berjenjang dan ambangnya? | Menentukan alur status | Pengguna | Terjawab — D-51 (c): pembayaran pemasok tidak berjenjang. Verifikasi Accounting (Q-07) bukan approval berjenjang. |
| Q-10 | Pembulatan selisih pembayaran: aturan dan akun. | Menyentuh uang | Pengguna | Terjawab — [USULAN-AGEN]: nominal dan alokasi harus bilangan bulat rupiah, dan pembayaran tidak membulatkan apa pun, sehingga tidak ada selisih pembulatan pada pembayaran. Pembulatan PPN terjadi per dokumen invoice (PG-008 R-03), pola D-51 (b). |
| Q-11 | Tanggal pembayaran: boleh mundur (backdate)? Pembayaran ke periode terkunci ditolak (FND-006), apakah ini cukup? | Menentukan validasi tanggal | Pengguna + tech lead | Terjawab — D-44 (5) dan D-50 (periode terkunci) + [USULAN-AGEN]: tanggal boleh mundur hanya ke periode yang terbuka; tanggal di periode terkunci ditolak. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-25 | Laporan lintas siklus milik core (C-009) | 2026-11-22 | Pengguna | Q-08 terjawab |
| D-33 | Matriks izin v0 disahkan; Bayar pemasok = Finance | 2026-11-22 | Pengguna | Q-04, Q-07 |
| D-35 | Peran `kas_bank` | 2026-11-22 | Pengguna | Q-04 |
| D-41 | 102 Bank, 201 Utang usaha | 2026-11-22 | Pengguna | Q-04 |
| D-42 | Pemohon PR tidak boleh membayar invoice dari PR-nya | 2026-11-22 | Pengguna | R-11 |
| D-44 (5) | Koreksi periode tertutup lewat jurnal pembalik | 2026-11-22 | Pengguna | Q-11 |
| D-46 | Status `TERCATAT`, `DIBAYAR_SEBAGIAN`, `LUNAS` | 2026-11-22 | Pengguna | Q-01 |
| D-47 (e) | Baris verifikasi pembayaran pemasok = Accounting | 2026-11-22 | Pengguna | Q-07 |
| D-48 | Pembalikan lewat jurnal pembalik; alasan wajib | 2026-11-22 | Pengguna | Q-05, R-09 |
| D-49 | Kelebihan bayar ditolak; alokasi tertua dulu | 2026-11-22 | Pengguna | Q-02, Q-03 |
| D-51 (c) | Pembayaran pemasok tidak berjenjang | 2026-11-22 | Pengguna | Q-09 |
| [USULAN-AGEN] | Q-01 (`GAGAL_TRANSFER`), Q-04 (pemetaan rekening), Q-05, Q-06, Q-07 (kolom verifikasi), Q-08, Q-10, Q-11 (tanggal mundur) | 2026-11-22 | Agen | Menunggu penguncian koordinator |

## Assumptions (agent-proposed)

- Jurnal pembayaran: Dr 201 Utang usaha / Cr 102 Bank (peran `kas_bank`), senilai nominal (`proses-bisnis.md` jurnal 3, akun dari D-41).
- Alokasi otomatis mengikuti D-49 (tanpa input alokasi manual) pada versi awal.
- Dokumen tidak dihapus, hanya dibatalkan lewat jurnal pembalik (D-48).

## Rejected alternatives (optional)

- Menghapus pembayaran yang salah: ditolak oleh aturan audit (D-48).
- Pembayaran tanpa alokasi ke invoice: ditolak karena saldo per invoice tidak bisa dibedakan.
- Status pembayaran `PARSIAL` terpisah: ditolak oleh D-47 (tidak ada status di luar daftar); parsial memakai `DIBAYAR_SEBAGIAN`.
- Verifikasi sebagai status baris `DIVERIFIKASI`: ditolak oleh D-47; memakai kolom verifikasi.

## Next step

Tidak ada pertanyaan terbuka. Item siap menjadi `Ready` begitu dependensi backlog (`PG-008`, `FND-006`) berstatus `done` dan gate fondasi terpenuhi. Usulan [USULAN-AGEN] menunggu penguncian koordinator. Pertentangan D-48 (status tidak mundur) dan pembalikan pembayaran perlu diputuskan koordinator (lihat `03-readiness-review.md`).

## Pembaruan 2026-11-22

- Ringkasan klasifikasi (lanjutan, setelah D-47 sampai D-53): 11 pertanyaan. Terjawab dengan keputusan terkunci 5 (Q-02, Q-03, Q-09, Q-11 sebagian, Q-04 sebagian); terjawab dengan keputusan terkunci dan [USULAN-AGEN] 2 (Q-01, Q-07); terjawab dengan [USULAN-AGEN] 4 (Q-05, Q-06, Q-08, Q-10). Terbuka 0.
- Akun pembayaran: 102 Bank (D-41) dan 201 Utang usaha. Pasangan `Dr 201 / Cr 102` dari `proses-bisnis.md` jurnal 3 dipakai.
- Pertentangan sumber dan keputusan terkunci:
  - D-48 menyatakan status tidak mundur setelah posting, sedangkan pembalikan pembayaran menurunkan status invoice dari `LUNAS` atau `DIBAYAR_SEBAGIAN`. Dipilih status invoice dihitung ulang dari sisa dan dicatat di riwayat. Perlu konfirmasi koordinator.
  - D-43 menyatakan jurnal langsung diposting, sedangkan verifikasi Accounting ada sebelum transfer. Diselesaikan dengan kolom verifikasi, bukan status, sehingga tidak ada jurnal sebelum transfer berhasil.
  - `diagram-sia-lengkap.md` PG11 memuat validasi "nominal ≤ sisa + dana". Kata "dana" tidak didefinisikan di sumber dan tidak diadopsi.
- Dependensi `PG-008` dan `FND-006` berstatus `specified` di `backlog.md`.
