# PG-009 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database**. Pencatatan pembayaran, alokasi otomatis, verifikasi Accounting, hasil transfer, jurnal, dan pembalikan selesai; seluruh AC yang butuh database belum dijalankan. Pelacakan: `docs/tech-debt/pg-009-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`, pnpm `10.18.3`, Next.js `16.4.6`
- Branch dibuat dari `main` `0c2eb68` (PG-003…PG-008 sudah merge)
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0029_pg009_pembayaran_utang.sql` |
| Seed | `supabase/seeds/0017_pg009_rekening_bank.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul | `src/modules/pengeluaran/pembayaran/{screen,actions,schema,queries,format,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/pembayaran/components/*` |
| Route | `src/app/(app)/pengeluaran/pembayaran-pemasok/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/pembayaran/schema.test.ts` |

Rancangan singkat:

- Master `rekening_bank` baru (bank, nomor, nama pemilik, aktif) dengan seed satu rekening **placeholder** yang harus diganti tech lead.
- Dokumen `PEMBAYARAN_PEMASOK` berstatus `DIAJUKAN → DIPOSTING`, `GAGAL_TRANSFER`, atau `DIBATALKAN`.
- `catat_pembayaran_pemasok` (Finance) mengunci invoice terbuka, menghitung sisa lewat `invoice_pemasok_sisa`, menolak nominal nol/pecahan/melebihi total sisa, menolak pemohon PR yang membayar invoice dari PR-nya, lalu mengalokasikan otomatis ke invoice tertua (`tanggal`, `nomor`).
- Alokasi pembayaran `DIAJUKAN` dan `DIPOSTING` sama-sama mengurangi sisa yang bisa dialokasikan, sehingga dua pembayaran tidak bisa membukukan sisa yang sama.
- `verifikasi_pembayaran_pemasok` (Accounting) mengisi `diverifikasi_oleh/pada` dan menolak pencatat yang sama.
- `catat_hasil_transfer_pemasok` (Finance) mewajibkan verifikasi. Berhasil: bukti wajib, jurnal Dr `utang_usaha` / Cr `kas_bank` senilai nominal, status `DIPOSTING`, lalu status invoice dihitung ulang (`DIBAYAR_SEBAGIAN`/`LUNAS`). Gagal: alasan wajib, status `GAGAL_TRANSFER`, tanpa jurnal dan tanpa perubahan utang.
- `batalkan_pembayaran_pemasok` (Finance) membalik jurnal, status `DIBATALKAN`, dan status invoice dihitung ulang dari sisa.
- Bukti transfer diunggah ke Supabase Storage bucket privat `bukti-transfer` (PDF/JPG/PNG, maks 5 MB); layar menampilkan signed URL 5 menit.
- Migrasi menambah tepi balik status invoice (`LUNAS → DIBAYAR_SEBAGIAN → TERCATAT`) agar pembalikan bisa mengembalikan status.

## Keputusan yang diambil (2026-11-28, disetujui pemilik track)

| Hal | Keputusan |
|---|---|
| Master rekening | Tabel `rekening_bank` + satu seed placeholder ("Bank Uji", nomor `0000000000`) — belum data nyata |
| Status transfer berhasil | `DIPOSTING` (sudah ada di daftar status D-46) |
| Bukti transfer | Supabase Storage bucket privat `bukti-transfer`, validasi tipe dan batas 5 MB sebagai konstanta terdokumentasi |
| Status awal pembayaran | `DIAJUKAN` (menunggu verifikasi/hasil); verifikasi tetap berupa kolom, bukan status |

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 159 test (149 sebelumnya + 10 test PG-009) |
| `pnpm arch:check` | lolos — 499 modul, 1824 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/pembayaran-pemasok` terdaftar |
| `pnpm check:migrations` | lolos — 29 berkas, nomor unik |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | Posting + jurnal + status invoice; butuh uji DB |
| `AC-02` | ⚠️ belum | Sisa dihitung dari alokasi aktif; butuh uji DB |
| `AC-03` | ⚠️ belum | Alokasi greedy tertua dulu; butuh uji tiga invoice |
| `AC-04` | ⚠️ belum | RPC menolak nominal > total sisa dengan pesan nilainya |
| `AC-05` | ✅ sebagian terbukti | Zod menolak 0, negatif, pecahan, bukan angka; RPC juga memeriksa `nominal = trunc(nominal)` |
| `AC-06` | ⚠️ belum | `post_journal` Dr utang / Cr bank; butuh uji jurnal |
| `AC-07` | ⚠️ belum | Read model `listUtangPemasok` + `invoice_pemasok_sisa`; butuh uji tiga angka |
| `AC-08` | ⚠️ belum | Gagal wajib alasan, tanpa jurnal; retry membuat pembayaran baru |
| `AC-09` | ⚠️ belum | Status invoice dihitung ulang tiap posting/pembatalan |
| `AC-10` | ✅ sebagian terbukti | Aksi menolak tanpa berkas dan memvalidasi tipe/ukuran; upload + signed URL ada. Butuh uji UI |
| `AC-11` | ⚠️ belum | Periode terkunci ditolak `post_journal` |
| `AC-12` | ⚠️ belum | Alokasi hanya mengambil invoice `TERCATAT`/`DIBAYAR_SEBAGIAN` |
| `AC-13` | ⚠️ belum | Riwayat ditulis core untuk setiap transisi |
| `AC-14` | ⚠️ belum | Alur tersedia di layar; butuh uji UI |
| `AC-15` | ⚠️ belum | RPC menolak hasil transfer sebelum `diverifikasi_oleh` terisi |
| `AC-16` | ⚠️ belum | Verifikasi hanya Accounting dan bukan pencatat; butuh uji dua akun |
| `AC-17` | ✅ sebagian terbukti | Zod mewajibkan alasan batal; RPC membalik jurnal + menghitung ulang invoice |
| `AC-18` | ⚠️ belum | Tanggal pembayaran dipakai sebagai tanggal jurnal; periode dinilai `post_journal` |
| `AC-19` | ⚠️ belum | RPC menelusuri invoice → penerimaan → PO → PR dan menolak bila pemohonnya pencatat |

## Penyimpangan

- **Status awal `DIAJUKAN`.** Requirement hanya menamai status gagal/batal/sukses; status "menunggu verifikasi" memakai `DIAJUKAN` yang sudah ada.
- **Rekening placeholder.** Seed `0017` memakai "Bank Uji" dengan nomor `0000000000`; wajib diganti sebelum produksi.
- **Migrasi `0029`** menambah tepi balik status invoice (`LUNAS → DIBAYAR_SEBAGIAN`, → `TERCATAT`) untuk pembalikan; menyentuh state machine terkunci D-46.
- **Bucket storage.** Migrasi membuat bucket privat `bukti-transfer`; kebijakan baca hanya lewat signed URL yang dibuat server (service role). Belum ada pengelolaan retensi/penghapusan berkas.
- **Alokasi mengunci invoice.** `pembayaran_pemasok_aktif` dipanggil dua kali (hitung total lalu alokasi) dalam transaksi yang sama; baris invoice dikunci `for update` sehingga dua pembayaran bersamaan tidak membukukan sisa yang sama.
- **Master rekening belum punya layar.** Pengelolaan rekening menunggu item master berikutnya; sekarang hanya lewat seed.

## Yang belum / risiko

- Belum ada bukti UI 1280px.
- Tarif PPN masih kosong di `konfigurasi_pajak`, sehingga invoice (PG-008) belum bisa dibuat, dan pembayaran belum punya utang untuk diuji end-to-end.
- `AC-07` juga menuntut saldo akun 201 per pemasok; jurnal belum menyimpan dimensi pemasok, jadi pembandingan per pemasok diuji lewat total, bukan per akun pemasok.
