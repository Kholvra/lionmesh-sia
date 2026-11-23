# FND-004 — Bukti Verifikasi

Tanggal: 2026-11-23
Lingkungan: PostgreSQL 17.12, Node.js v24.22.2, pnpm 10.18.3, Next.js 16.4.6.
Database: proyek Supabase lokal terisolasi pada port `55432`; database bersama tidak disentuh.

## Perintah

```bash
pnpm exec supabase db reset --workdir <tmp-project> --no-seed
FND004_DISPOSABLE=1 \
  SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
  node scripts/verify-fnd-004.mjs

FND_TEST_PASSWORD=<sandi-lokal-sementara> \
  SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
  node scripts/db-seed.mjs

FND004_DISPOSABLE=1 \
  FND004_TEST_API_URL=http://127.0.0.1:55431 \
  FND004_TEST_APP_URL=http://127.0.0.1:3204 \
  FND004_TEST_ANON_KEY=<isolated-anon-key> \
  FND004_TEST_DB_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres \
  FND004_TEST_PASSWORD=<sandi-lokal-sementara> \
  node scripts/verify-fnd-004-session.mjs

pnpm verify
```

## Hasil Acceptance Criteria

`node scripts/verify-fnd-004.mjs` menjalankan 8 pemeriksaan lifecycle/numbering dan 8 pemeriksaan approval/concurrency pada database yang sama.

| AC | Hasil | Bukti teramati |
|---|---|---|
| `AC-01` | `PASS` | Dokumen pertama November 2026 bernomor `UJI/2026/11/0001` |
| `AC-02` | `PASS` | Dua pembuatan paralel menghasilkan `UJI/2026/11/0002` dan `UJI/2026/11/0003`; counter naik dua |
| `AC-03` | `PASS` | Tepat satu riwayat `BUAT`; aktor dari konteks sesi; waktu server terisi. Uji sesi memalsukan `actorId` dan nilai tersimpan tetap ID sesi |
| `AC-04` | `PASS` | `DRAFT → SELESAI` ditolak dengan `Status DRAFT tidak bisa diubah menjadi SELESAI.`; status dan versi tidak berubah |
| `AC-05` | `PASS` | Tiga transisi sah menambah tiga baris; riwayat lama identik |
| `AC-06` | `PASS` | Dua approval paralel: satu berhasil, satu mendapat `Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.`; riwayat hanya +1 |
| `AC-07` | `PASS` | Level 1 menyisakan status `DIPERIKSA`; percobaan `DISETUJUI` ditolak `Persetujuan level 2 belum lengkap.`; level 2 menyelesaikan approval |
| `AC-08` | `PASS` | Pemohon ditolak pada jenis uji dan jenis permintaan pembelian dengan pesan `Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.` |
| `AC-09` | `PASS` | `authenticated` mendapat `permission denied for table dokumen`; hapus oleh service ditolak trigger `Dokumen tidak bisa dihapus. Gunakan pembatalan.`; baris tetap ada |
| `AC-10` | `PASS` | Pembatalan dengan alasan menghasilkan `DIBATALKAN` dan riwayat `BATAL`; tanpa alasan ditolak dengan `Isi alasan untuk membatalkan dokumen.` |
| `AC-11` | `PASS` | Revisi menaikkan siklus `0 → 1`; approval siklus baru nol; level 1 dan 2 harus diulang; riwayat lama utuh |
| `AC-12` | `PASS` | Penolakan tanpa alasan ditolak; dengan alasan menjadi `DITOLAK`; transisi berikutnya ditolak |
| `AC-13` | `PASS` | Dokumen bertanda posting menolak pembatalan dengan `Dokumen sudah diposting. Batalkan lewat jurnal pembalik.` |
| `AC-14` | `PASS` | Status `TERKONFIRMASI_PELANGGAN` ditolak dengan `Status TERKONFIRMASI_PELANGGAN tidak tersedia.` dan tidak tersimpan |
| `AC-15` | `PASS` | `UJI/2026/11/0004` lalu `UJI/2026/12/0001` |
| `AC-16` | `PASS` | Jenis tanpa approval: `PERIKSA` langsung `DISETUJUI`; tidak ada baris `SETUJUI` per level |

## Uji sesi

Fixture route sementara dihapus setelah pengujian. Hasil:

```text
PASS anonymous request denied
PASS session context returns the authenticated actor
PASS document creation through the session boundary succeeds
PASS forged request actor was ignored
```

`getDokumenExecutionContext()` mengambil aktor dari `getSesiUser()` dan membuat client service-role di server. Body permintaan berisi UUID palsu, tetapi `dokumen.pembuat_id` dan `riwayat_status.actor_id` sama dengan ID sesi.

## Seed

`node scripts/db-seed.mjs` menghasilkan `[db:seed] selesai — seed versi 0004 terpasang`.

Seed menambahkan:

| Tipe | Status awal | Approval |
|---|---|---|
| `PERMINTAAN_PEMBELIAN` | `DIAJUKAN` | Level 1 Manajemen, semua nominal |
| `PERIODE_GAJI` | `TERBUKA` | Level 1 Direksi, semua nominal |

`PEMBAYARAN_PEMASOK` tidak mendapat aturan approval, sesuai D-51(c). Kode tipe pada seed adalah placeholder yang dapat diselaraskan pemilik modul.

Dua siklus reset + seed menghasilkan hash data identik:

```text
hash1=d7dc97f97472ebd0b305422804d358a5
hash2=d7dc97f97472ebd0b305422804d358a5
match=yes
```

## Mutu proyek

```text
pnpm lint       lulus
pnpm typecheck  lulus
pnpm arch:check lulus — 56 modules, 100 dependencies
pnpm build      lulus — Next.js 16.4.6
```

`pnpm check:migrations` lulus dengan 7 berkas dan nomor unik. `git diff --check` tidak menghasilkan error.

## Batas

- Pemeriksaan periode sumber menunggu `FND-006`; lihat `docs/tech-debt/fnd-004-periode-dokumen.md`.
- Retry otomatis aksi yang sudah berhasil belum punya idempotency key; pemanggil harus memuat ulang dan tidak mengulang otomatis.
- Verifikasi integrasi UI dan aksi modul nyata dilakukan di item pemilik masing-masing.
