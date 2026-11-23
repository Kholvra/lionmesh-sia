# PG-001 — Bukti Verifikasi

Implementasi dimulai 2026-11-23 pada branch `feat/pg-001-pemasok`, di-rebase ke `origin/main` (`b372edb`) setelah `FND-001`–`FND-007` selesai. Status item **belum selesai**: acceptance criteria yang membutuhkan database belum dijalankan karena Docker/Supabase lokal tidak tersedia di mesin ini.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- Supabase CLI terpasang sebagai dependency, tetapi `docker` tidak ditemukan (`docker: command not found`)
- Build dijalankan dengan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` placeholder

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0009_pg001_pemasok.sql` |
| Core service | `src/core/pemasok/{types,queries,service,index}.ts` |
| Modul | `src/modules/pengeluaran/pemasok/{schema,actions,queries,screen,format}.ts(x)` |
| Komponen | `src/modules/pengeluaran/pemasok/components/*` |
| Route | `src/app/(app)/pengeluaran/pemasok/{page,loading,error}.tsx` |

Catatan kepatuhan:

- `D-09` mewajibkan migrasi dinomori dan di-merge tech lead. Migrasi `0009` disiapkan di branch ini dan tetap perlu direview tech lead sebelum merge.
- `D-31` menempatkan tabel `pemasok` di core. Implementasi mengikuti aturan itu: tabel, RPC, dan query ada di `src/core/pemasok`.
- `FND-004` menyediakan `public.riwayat_status`, tetapi tabel itu terikat ke `public.dokumen` melalui foreign key `(dokumen_id, tipe_dokumen)`. Pemasok adalah master, bukan dokumen, sehingga PG-001 memakai tabel append-only `public.pemasok_riwayat_status`. Penyimpangan dari `D-08`/`D-32` ini perlu keputusan tech lead.
- Kontak PIC dibatasi lewat view `pemasok_aman`; peran selain Purchasing dan Accounting menerima nilai `null`.
- Tabel dasar `pemasok` dan `pemasok_riwayat_status` tidak dapat ditulis langsung oleh `authenticated`; semua tulisan lewat RPC `security definer`.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm check:migrations` | lolos — 9 berkas, nomor unik |
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm arch:check` | lolos — 82 modul, 176 dependensi |
| `pnpm build` | lolos dengan env placeholder |

`pnpm db:reset` **belum dijalankan** karena Docker tidak tersedia.

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | belum dijalankan | butuh database; route `/pengeluaran/pemasok` sudah ada |
| `AC-02` | belum dijalankan | default `toleransi_persen = 0`, `toleransi_nominal = 0` ada di skema |
| `AC-03` | belum dijalankan | validasi server `Nama pemasok wajib diisi` ada di `schema.ts` dan RPC |
| `AC-04` | belum dijalankan | validasi server `Toleransi nominal tidak boleh negatif` ada di `schema.ts` dan RPC |
| `AC-05` | belum dijalankan | validasi server `Termin pembayaran wajib diisi` ada di `schema.ts` dan RPC |
| `AC-06` | belum dijalankan | RPC `set_status_pemasok` menulis `pemasok_riwayat_status` |
| `AC-07` | belum dijalankan | query `listPemasok({ aktif: true })` tersedia untuk item pemakai |
| `AC-08` | belum dijalankan | action memeriksa `buat_ubah_pemasok`; RPC memeriksa peran Purchasing |
| `AC-09` | belum dijalankan | snapshot dokumen baru; tidak ada dokumen di PG-001 |
| `AC-10` | belum dijalankan | butuh `pnpm db:reset` |
| `AC-11` | belum dijalankan | dua kolom toleransi terpisah di tabel dan form |
| `AC-12` | belum dijalankan | RPC `set_status_pemasok` mendukung aktivasi ulang dan menulis riwayat |
| `AC-13` | belum dijalankan | view `pemasok_aman` menyembunyikan PIC dari peran lain |

## Langkah verifikasi berikutnya

1. Jalankan `pnpm db:setup` di mesin dengan Docker.
2. Jalankan `FND_TEST_PASSWORD=... pnpm db:seed`.
3. Login sebagai `purchasing@lionmesh.test`, buka `/pengeluaran/pemasok`, lalu jalankan AC-01–AC-13.
4. Simpan screenshot 1280 px dan perbarui tabel di atas.
5. Setelah semua AC lolos, ubah status `backlog.md` menjadi `done`.
