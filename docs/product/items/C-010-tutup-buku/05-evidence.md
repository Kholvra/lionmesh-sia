# C-010 — Bukti Verifikasi

Tanggal: 2026-11-27
Lingkungan: Supabase lokal Docker (`127.0.0.1:54322`), Next.js 16.4.6 dev
(`http://127.0.0.1:3009`), Node 24.22.2, Chromium (screenshot).
Status: **PASS** — AC-01–AC-13 PASS; screenshot 1280px tersedia. PR belum
dibuka; branch masih menunggu commit docs + rebase (lihat risiko).

## Perintah yang dijalankan

```bash
pnpm check:migrations                 # 15 berkas, nomor unik
pnpm db:reset
pnpm db:seed:local
pnpm dev --port 3009
C010_BASE_URL=http://127.0.0.1:3009 node scripts/verify-c-010.mjs
pnpm verify
```

Hasil gerbang terakhir:

```text
pnpm verify → exit 0
lint          ok
typecheck     ok
arch:check    ok (218 modul, 667 dependensi)
test          105 lulus + 4 pemeriksaan worker C-012
build         ok (rute /laporan/periode dan /laporan/periode/[periode]/tutup terbangun)
pnpm check:migrations → ok, 15 berkas, nomor unik
scripts/verify-c-010.mjs → 39 pemeriksaan lulus
impeccable detect → [] (exit 0)
git diff --check → bersih
```

`scripts/verify-c-010.mjs` menyiapkan fixture deterministik lewat `postJournal()`
dan `public.reverse_journal()` (bukan menulis jurnal operasional langsung),
lalu menjalankan RPC dan halaman sebagai sesi Accounting. Script menolak
berjalan dua kali pada database yang sama; reset + seed dulu untuk mengulang.

## Data uji tangan (tahun 2026)

| Akun | Nilai 2026 sebelum tutup tahun | Jurnal penutup | Saldo setelah |
|---|---:|---:|---:|
| 401 Penjualan | kredit 5.000.000,00 | debit 5.000.000,00 | 0,00 |
| 501 HPP | debit 2.400.000,00 | kredit 2.400.000,00 | 0,00 |
| 601 Tenaga kerja langsung | debit 400.000,00 | kredit 400.000,00 | 0,00 |
| 602 Overhead pabrik | debit 100.000,00 | kredit 100.000,00 | 0,00 |
| 701 Beban gaji administrasi | debit 500.000,00 | kredit 500.000,00 | 0,00 |
| 302 Laba ditahan | 0,00 | kredit 1.600.000,00 | -1.600.000,00 |

Laba bersih 2026 = 5.000.000 − 2.400.000 − 400.000 − 100.000 − 500.000 =
**1.600.000,00**. Jurnal penutup: debit **5.000.000,00**, kredit
**5.000.000,00**. Saldo 302 naik **1.600.000,00**.

Catatan: 501 mencakup HPP Oktober 600.000,00 yang dibalik di November
600.000,00, ditambah HPP Desember 2.400.000,00. 601 dan 602 ikut ditutup.

## Hasil per kriteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | PASS | Oktober 2026 `kunci`; September `kunci`; November/Desember tetap `buka`; periode lain tidak berubah. `verify-c-010` AC-01. |
| `AC-02` | PASS | Posting ke Oktober `kunci` ditolak (`Periode Oktober 2026 sudah dikunci`); jumlah `jurnal`/`detail_jurnal` tidak berubah. |
| `AC-03` | PASS | Setelah tutup tahun 2026: 401/501/601/602/701 = 0; 302 = -1.600.000,00; 601 dan 602 ikut ditutup. |
| `AC-04` | PASS | Jurnal penutup 2026 debit 5.000.000,00 = kredit 5.000.000,00; `sumber_id` = `tahun_buku.id`; `sumber_tipe = TUTUP_BUKU`. |
| `AC-05` | PASS | Tutup Oktober dua kali ditolak (`sudah ditutup`); status tetap `kunci`; riwayat `TUTUP_PERIODE` tetap 1. |
| `AC-06` | PASS | Akun 302 dinonaktifkan: tutup tahun 2037 ditolak (`Akun 302 tidak ditemukan atau tidak aktif`); tidak ada jurnal penutup; tahun tidak `ditutup`; transaksi rollback. |
| `AC-07` | PASS | Tidak ada route/aksi buka; update langsung `periode_akuntansi` sebagai `authenticated` ditolak; status tetap `kunci`. |
| `AC-08` | PASS (bulanan) | Laporan laba rugi Oktober 2026 memberi 4 angka yang sama sebelum/sesudah tutup periode. Pengecualian tutup tahun: laporan Desember memuat baris `TUTUP_BUKU`; lihat risiko. |
| `AC-09` | PASS | Dokumen payroll `PERIODE_GAJI` berstatus `TERBUKA` tetap `TERBUKA` setelah tutup November; tutup buku tidak mengubah status dokumen sumber. |
| `AC-10` | PASS | Jurnal pembalik HPP Oktober dibuat di November; jumlah jurnal Oktober tidak berubah; November +1; tidak ada jurnal baru di Oktober `kunci`. |
| `AC-11` | PASS | Tutup Maret 2028 saat Januari `buka` ditolak dan menyebut Januari 2028. Tutup Februari 2030 membuat + mengunci Januari 2030 yang belum punya baris. Januari 2031 ditolak selama 2030 belum `ditutup`, lalu berhasil setelah 2030 ditutup. |
| `AC-12` | PASS | `diposting=true` tanpa jurnal ditolak; `diposting=false` dengan jurnal `sumber_id` ditolak; neraca tidak seimbang (debit 9.802.100 vs kredit 9.802.090) ditolak dan fixture di-rollback. |
| `AC-13` | PASS | Tutup tahun 2026 dengan November terbuka ditolak dan menyebut November; setelah Jan–Nov `kunci`, tutup tahun 2026 berhasil, Desember `kunci`, 12/12 `kunci`, posting ke tahun itu ditolak. Tahun 2030 tanpa jurnal: 12/12 `kunci`, tanpa jurnal penutup. Tutup ganda 2038 tidak menambah riwayat `TUTUP_PERIODE`. |

Pemeriksaan UI (`verify-c-010.mjs`):

| ID | Hasil | Bukti |
|---|---|---|
| `UI-01` | PASS | `/laporan/periode?tahun=2026` menampilkan tahun 2026 `Ditutup` dan “Tidak ada yang terbuka”. |
| `UI-02` | PASS | `/laporan/periode/2026-10/tutup` menampilkan “Periode Oktober 2026 sudah ditutup”, “Tidak bisa dibuka kembali”, dan tombol Batal. |
| `UI-03` | PASS | `/laporan/periode/2026-12/tutup` menampilkan alasan Desember ditutup lewat tutup buku tahunan. |
| `UI-04` | PASS | Sesi Penjualan mendapat “Akses ditolak”; item nav “Periode akuntansi” tidak tampil. |
| `UI-05` | PASS | `/laporan/periode/2038-02/tutup` menampilkan Pemeriksaan, Januari 2038 `Terkunci`, neraca seimbang, setengah posting tidak ada, tombol Tutup periode dan Batal. |

## Screenshot

`docs/product/items/C-010-tutup-buku/screenshots/tutup-periode-1280.png` —
1280×1000, halaman `/laporan/periode/2038-02/tutup` sebagai Accounting.
Tampilan mengikuti `docs/design/screenshots/v2-samples/10-tutup-periode.png`:
kartu Pemeriksaan 2×2, banner peringatan, tombol Tutup periode/Batal, dan
sidebar dengan “Laporan” tetap aktif pada halaman anak.

Akun uji: `accounting@lionmesh.test` / `lionmesh-dev-2026` (database lokal).

## Risiko / penyimpangan

- **C-009 dan jurnal penutup.** Laporan `laba-rugi` dan `neraca` membaca semua
  baris jurnal, termasuk `TUTUP_BUKU`. Tutup periode bulanan tidak mengubah
  laporan (AC-08 terbukti); tutup tahun menambahkan baris penutup sehingga
  laporan Desember/tahun berubah. AC-08 menyebut pengecualian ini. Laporan
  Desember sebelum/sesudah tutup tahun belum ditangkap sebagai pasangan
  pembanding terpisah; perilakunya dibaca dari query laporan dan jurnal
  penutup. Filter `TUTUP_BUKU` di C-009 adalah keputusan lintas item berikutnya.
- **Annual close loss/net-zero.** Logika 302 sudah memisahkan debit (rugi),
  kredit (laba), dan tanpa baris 302 saat neto nol. Fixture yang terbukti:
  laba (2026), tanpa jurnal/zero-nominal (2030, 2031), dan laba kecil (2036,
  2037). Fixture rugi dan laba = beban dengan saldo bruto belum dijalankan
  terpisah.
- **Konvensi `PEMBALIKAN`.** `reverse_journal` menerima `sumber_id` dari
  pemanggil dan tidak menyalinnya dari jurnal asal. D-68 mencatat ini sebagai
  kewajiban pemanggil, bukan invariant DB. Cek setengah posting memakai jurnal
  asli, sehingga tidak terpengaruh.
- **Lock close-vs-posting.** RPC tutup tahun mengunci baris Desember sebelum
  membaca saldo; `post_journal` memakai lock baris periode yang sama. Uji
  otomatis mencakup tutup ganda dan riwayat, tetapi belum menjalankan dua sesi
  paralel close-vs-post.
- **Migrasi 0015.** Perbaikan `make_timestamptz` dilakukan sebelum reset final;
  `0015` diterapkan dari nol lewat `pnpm db:reset`. Tidak ada environment
  bersama yang dimigrasikan. Tech lead tetap pemilik review/merge.
- **Branch.** `backlog.md` masih `specified` dan D-67 masih uncommitted di
  `main`; rebase/commit docs sebelum PR. Tidak diubah di branch ini.
  `docs/product/decisions.md` di branch hanya menambah D-68; D-67 tetap milik
  `main` dan tidak disalin. Tidak ada commit/PR dari sesi ini.

## Tidak dikerjakan

- Filter `TUTUP_BUKU` di laporan C-009 (keputusan lintas item).
- Uji dua sesi paralel close-vs-post (desain lock sudah ada; uji otomatis
  terbatas pada tutup ganda).
- Fixture tutup tahun rugi dan laba = beban dengan saldo bruto; pasangan
  laporan Desember sebelum/sesudah tutup tahun.
- Perubahan `backlog.md`/D-67 (menunggu commit docs dan rebase).
