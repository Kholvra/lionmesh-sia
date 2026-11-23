# lionmesh-sia

Sistem Informasi Akuntansi untuk PT Lionmesh Prima Tbk. Satu aplikasi, empat siklus: pendapatan, pengeluaran, produksi, penggajian.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Supabase Postgres + Auth (SSR cookie flow via `@supabase/ssr`)
- pnpm

## Prasyarat

- Node 24
- pnpm 10
- Docker — dibutuhkan Supabase lokal

## Setup lokal

```bash
pnpm install
pnpm db:setup          # nyalakan Supabase lokal + terapkan seluruh migrasi
cp .env.example .env.local
pnpm db:seed:local     # 13 akun uji lokal, sandi bersama
```

`pnpm db:setup` memeriksa penomoran migrasi lebih dulu, lalu menerapkannya berurutan. Tidak ada langkah menempel SQL manual. `pnpm db:seed:local` menjalankan seed dengan sandi uji lokal bersama, jadi tidak perlu mengatur variabel apa pun — perintah ini aman dijalankan oleh agen.

Tanpa langkah seed, database berisi skema tetapi **tanpa akun**, sehingga `/login` selalu menolak. Akun uji dan sandinya ada di bagian [Database](#database).

Isi `.env.local`. Untuk Supabase lokal, ambil nilainya dari:

```bash
pnpm exec supabase status
```

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key dari status>
```

Untuk project hosted, ambil dari **Supabase Dashboard → Project Settings → API Keys**.

Jalankan:

```bash
pnpm dev
```

Buka http://localhost:3000. Halaman `/login` menyediakan alur masuk dan callback PKCE di `/auth/callback`; pendaftaran mandiri tidak tersedia.

## Database

Migrasi ada di `supabase/migrations/` dan diterapkan berurutan.

| Perintah | Efek |
|---|---|
| `pnpm db:setup` | nyalakan Supabase lokal + terapkan migrasi |
| `pnpm db:reset` | kosongkan database, terapkan ulang migrasi (tanpa seed) |
| `pnpm db:seed:local` | isi data dasar + 13 akun uji dengan sandi bersama (satu perintah, tanpa env) |
| `pnpm db:seed` | sama, tetapi sandi diambil dari `FND_TEST_PASSWORD` (untuk sandi sendiri) |
| `pnpm db:stop` | hentikan Supabase lokal |

Seed membuat 13 akun uji lokal (`peran@lionmesh.test`). Sandi disediakan melalui `FND_TEST_PASSWORD`; mekanisme ini bagian dari `FND-008` dan skema tidak menyimpan sandi. Untuk database lokal, `pnpm db:seed:local` sudah mengisi sandi uji bersama:

```bash
pnpm db:seed:local     # sandi: lionmesh-dev-2026
```

Sandi itu hanya untuk 13 akun fiktif di database lokal Docker. Jangan memakainya di project Supabase hosted atau lingkungan lain. Kalau ingin sandi sendiri, pakai `pnpm db:seed` dengan bentuk interaktif:

```bash
read -rs FND_TEST_PASSWORD
export FND_TEST_PASSWORD
pnpm db:seed
unset FND_TEST_PASSWORD
```

Akun uji yang tersedia (sandi sama untuk semuanya):

| Peran | Email |
|---|---|
| Penjualan | `penjualan@lionmesh.test` |
| Pengiriman | `pengiriman@lionmesh.test` |
| Gudang | `gudang@lionmesh.test` |
| Purchasing | `purchasing@lionmesh.test` |
| QC | `qc@lionmesh.test` |
| Produksi | `produksi@lionmesh.test` |
| Accounting | `accounting@lionmesh.test` |
| Finance | `finance@lionmesh.test` |
| Manajemen | `manajemen@lionmesh.test` |
| Direksi | `direksi@lionmesh.test` |
| HR | `hr@lionmesh.test` |
| Supervisor Lapangan | `supervisor-lapangan@lionmesh.test` |
| Karyawan | `karyawan@lionmesh.test` |

Aturan migrasi:

- Nama berkas `NNNN_nama.sql`, nomor unik, tidak pernah dipakai ulang.
- Migrasi yang sudah di-merge ke `main` tidak boleh diubah isinya.
- Hanya tech lead yang menomori dan me-merge migrasi baru. Kelompok mengirim DDL sebagai usulan.
- Pelanggaran aturan ini ditolak oleh `pnpm check:migrations`.

Tambahkan URL berikut di **Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:3000/auth/callback
```

## Gerbang mutu

```bash
pnpm verify
```

Menjalankan lint, pemeriksaan tipe, pemeriksaan batas modul, unit test, dan build. CI menjalankan pemeriksaan yang sama pada setiap pull request.

## Commands

| Perintah | Kegunaan |
|---|---|
| `pnpm dev` | development |
| `pnpm build` | production build |
| `pnpm start` | jalankan hasil build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm arch:check` | batas impor core ↔ modul (dependency-cruiser) |
| `pnpm check:migrations` | validasi nama dan nomor migrasi |
| `pnpm test` | unit test dengan test runner bawaan Node |
| `pnpm verify` | semua pemeriksaan di atas, termasuk test |

## Struktur penting

```text
src/
├── app/                    # route Next.js
├── components/             # komponen UI
├── core/                   # (menyusul) service bersama: dokumen, inventory, ledger, pengadaan
├── modules/                # (menyusul) satu folder per siklus
└── lib/supabase/           # browser, server, proxy client

scripts/
├── check-migrations.mjs    # PRE-02, B-01
├── db-guard.mjs            # PRE-01, PRE-04
└── db-seed.mjs             # PRE-03, B-02

supabase/
├── config.toml
├── migrations/             # NNNN_nama.sql
└── seed.sql

.github/workflows/ci.yml    # gerbang mutu
```

## Aturan arsitektur

Batas antar modul mengikat, bukan saran:

- `src/modules/<x>` tidak boleh mengimpor `src/modules/<y>`.
- `src/core` tidak boleh mengimpor `src/modules`.
- Jurnal hanya lewat `core/ledger`; stok hanya lewat `core/inventory`.
- Modul tidak membaca tabel milik modul lain.

Kontrak lengkap: `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`.

## Troubleshooting

### `/login` selalu menolak, padahal database jalan

Penyebab paling sering: seed belum dijalankan. Skema terpasang, tetapi `auth.users` kosong sehingga tidak ada akun yang bisa masuk. Periksa:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "select count(*) from auth.users;" \
  -c "select version from public._seed_meta;"
```

Kalau hasilnya `0` atau tabel `_seed_meta` tidak ada, jalankan `pnpm db:seed` (lihat [Database](#database)). `pnpm db:reset` mengosongkan database termasuk akun uji, jadi seed harus dijalankan ulang sesudah reset. Studio lokal ada di http://127.0.0.1:54323 bila lebih nyaman memeriksa lewat tabel.

### `pnpm build` gagal karena variabel Supabase

Build membaca `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari `.env.local`. Salin `.env.example`, jangan menanam nilai di kode untuk membuat build lulus.
