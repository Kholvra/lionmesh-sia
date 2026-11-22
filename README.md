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
```

`pnpm db:setup` memeriksa penomoran migrasi lebih dulu, lalu menerapkannya berurutan. Tidak ada langkah menempel SQL manual.

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
| `pnpm db:seed` | isi data dasar; menolak bila sudah pernah di-seed |
| `pnpm db:stop` | hentikan Supabase lokal |

Seed membuat 13 akun uji lokal (`peran@lionmesh.test`). Sebelum menjalankan `pnpm db:seed`, atur sandi uji melalui variabel lingkungan `FND_TEST_PASSWORD`; jangan simpan sandi di repositori. Contoh shell interaktif:

```bash
read -rs FND_TEST_PASSWORD
export FND_TEST_PASSWORD
pnpm db:seed
unset FND_TEST_PASSWORD
```

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

Menjalankan lint, pemeriksaan tipe, pemeriksaan batas modul, dan build. CI menjalankan pemeriksaan yang sama pada setiap pull request.

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
| `pnpm verify` | semua pemeriksaan di atas |

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
