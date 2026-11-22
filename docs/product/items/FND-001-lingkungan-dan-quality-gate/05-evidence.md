# FND-001 — Bukti Verifikasi

Dijalankan 2026-11-17, dari repo ini dan dari salinan bersih tanpa `node_modules`.

## Lingkungan

| Alat | Versi |
|---|---|
| Node | v24.22.2 |
| pnpm | 10.18.3 |
| Docker | 29.9.2 |
| Supabase CLI | 3.2.0 (devDependency) |
| Next.js | 16.4.6 |
| dependency-cruiser | 18.8.0 |

## Ringkasan

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | **lulus** | salinan bersih: `pnpm install` 30,5 dtk, `db:setup` exit 0, `next dev` → `/` 200, `/login` 200, tanpa error runtime |
| `AC-02` | **lulus** | dua `db:reset`; dump skema 9.182 baris, `diff` kosong; tabel publik tetap `profiles` |
| `AC-03` | **lulus** | `0001_duplikat.sql` → exit 1, pesan menyebut kedua berkas |
| `AC-04` | **lulus** | `lint`, `typecheck`, `build` exit 0 di salinan bersih |
| `AC-05` | **lulus** | PR #3: check merah karena `error TS2322`, hijau setelah diperbaiki; run 44982760068 → 44982807239 |
| `AC-06` | **lulus** | dua putaran reset+seed → snapshot `0/1/0001` identik |
| `AC-07` | **lulus** | seed kedua → exit 1, pesan menyebut `pnpm db:reset` |
| `AC-08` | **lulus** | README tidak menyuruh menempel SQL ke dashboard |

Delapan dari delapan AC lulus. `AC-05` dibuktikan dengan run CI sungguhan pada 2026-11-22.

## Rincian per AC

### AC-01 — dari kondisi bersih

```text
rsync -a --exclude node_modules --exclude .next --exclude .git ./ /tmp/opencode/clean/
cd /tmp/opencode/clean
pnpm install --frozen-lockfile      → exit 0 (30,5 dtk)
pnpm db:setup                       → exit 0
  [check:migrations] ok — 1 berkas, nomor unik
  Applying migration 0001_initial.sql...
next dev -p 3102                    → Ready in 291 ms
GET /       → 200
GET /login  → 200
runtime data error → 0
```

Catatan: ini salinan working tree, bukan `git clone`, karena perubahan FND-001 belum di-commit. Setelah commit, AC ini perlu diulang dari clone sungguhan.

### AC-02 — migrasi dan reset idempoten

```text
pnpm db:reset   (pertama)   → exit 0
pg_dump --schema-only       → /tmp/opencode/schema-a.sql (9.182 baris)
pnpm db:reset   (kedua)     → exit 0
pg_dump --schema-only       → /tmp/opencode/schema-b.sql (9.182 baris)
diff schema-a.sql schema-b.sql → kosong
tabel publik: profiles
```

### AC-03 — tabrakan nomor migrasi

```text
cp 0001_initial.sql 0001_duplikat.sql
pnpm check:migrations → exit 1
  - nomor 0001 dipakai dua berkas: 0001_duplikat.sql dan 0001_initial.sql
```

Juga diuji nama berkas yang tidak berpola:

```text
abc.sql → exit 1
  - nama tidak sesuai pola NNNN_nama.sql: abc.sql
```

### AC-04 — gerbang mutu

```text
pnpm lint        → exit 0
pnpm typecheck   → exit 0
pnpm arch:check  → no dependency violations (21 modules, 33 dependencies)
pnpm build       → exit 0
```

`pnpm verify` (lint + typecheck + arch:check + build) → exit 0.

Build diuji dua kali: tanpa env dan dengan env placeholder seperti CI. Keduanya exit 0.

### AC-05 — CI merah lalu hijau

`.github/workflows/ci.yml` menjalankan `check:migrations`, `lint`, `typecheck`, `arch:check`, dan `build` pada setiap PR dan pada push ke `main`.

Bukti pada 2026-11-22:

```text
PR #3  fnd-001-ac05-ci-proof (throwaway, ditutup tanpa merge)
  commit 59e7d1e  src/lib/ci-proof.ts: export const ciProof: number = "deliberate type error";
  run 44982760068 → failure
    Tipe: src/lib/ci-proof.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'
    Process completed with exit code 2
  commit 21f95f1  berkas dihapus
  run 44982807239 → success
    Install, Migrasi, Lint, Tipe, Batas modul, Build — semua ✓
```

CI juga hijau di `main` setelah merge: run 44982685947.

Catatan: run pertama di `main` (44982638751) gagal karena `pnpm/action-setup` menerima versi ganda (`version: 10` di workflow + `packageManager` di `package.json`). Diperbaiki di commit `bb4fa4c`; workflow sekarang membaca versi dari `package.json` saja.

### AC-06 — determinisme seed

```text
putaran 1: reset → seed → snapshot profil/_seed_meta/versi = 0/1/0001
putaran 2: reset → seed → snapshot profil/_seed_meta/versi = 0/1/0001
hasil: identik
```

### AC-07 — seed menolak data ganda

```text
seed pertama → exit 0   "[db:seed] selesai — data dasar terpasang"
seed kedua   → exit 1   "[db:seed] Data dasar sudah terpasang. Jalankan `pnpm db:reset` dulu, lalu seed ulang."
```

### AC-08 — README tanpa SQL manual

`README.md` memuat prasyarat, `pnpm install`, `pnpm db:setup`, pengisian `.env.local` dari `supabase status`, dan tabel perintah. Tidak ada instruksi menempel SQL ke dashboard.

## Kontrak desain FND-001

| ID | Hasil | Bukti |
|---|---|---|
| `B-01` | **PASS** | nomor duplikat ditolak sebelum database; pesan menyebut kedua berkas |
| `PRE-01` | **PASS** | `db-guard setup` → "Docker berjalan"; tanpa Docker → berhenti dengan pesan yang menyebut Docker |
| `PRE-02` | **PASS** | nama tidak berpola dan nomor duplikat ditolak |
| `PRE-03` | **PASS** | seed kedua ditolak, menyebut perintah reset |
| `PRE-04` | **PASS** | `SUPABASE_DB_URL` ke `prod.example.com` → reset dibatalkan, data seed tetap ada |
| `POST-01` | **PASS** | setelah `db:setup`, tabel publik = `profiles`; migrasi `0001` tercatat |
| `POST-02` | **PASS** | reset kedua tidak mengubah skema (diff kosong) |
| `POST-03` | **PASS** | setelah reset tidak ada `_seed_meta`; hanya tabel dari migrasi |
| `POST-04` | **PASS** | dua putaran reset+seed identik |
| `POST-05` | **PASS** | `AC-04` lulus, `AC-05` hijau di run 44982685947 dan 44982807239 |
| `INV-01` | **PASS** | `fnd-001-lingkungan` di-merge ke `main` (1dd8477) dan di-push; CI hijau di `main` |
| `INV-04` | **PASS** | migrasi `0002_rusak.sql` → exit 1; versi tercatat tetap `0001`; tabel `rusak` tidak ada; reset berikutnya pulih |

Bukti `INV-04`:

```text
versi sebelum      : 0001
reset + migrasi rusak → exit 1 (MigrationApplyError, syntax error)
versi setelah gagal: 0001
tabel rusak        : tidak ada
reset pemulihan    : exit 0, versi tetap 0001
```

## Selisih dari rencana

| Hal | Kenyataan | Tindakan |
|---|---|---|
| `reset` | Supabase CLI melakukan drop + menerapkan ulang migrasi, jadi hasilnya `siap`, bukan tanpa tabel | Kontrak direvisi: `POST-03` = skema `siap`, tanpa data dasar |
| Next.js 16.4.3 | Berhenti di run pertama karena security advisory | Upgrade ke 16.4.6 (`D-29`) |
| `src/app/page.tsx` | Build dengan env nyata gagal: `cookies()` dibaca saat prerender | Tambah `export const instant = false`; `/` menjadi dinamis |
| Tabel `_seed_meta` | Dibuat oleh seed untuk penjaga idempoten | RLS aktif, tanpa policy — tidak terbaca lewat API |
| Test runner | Belum ada | Tetap di luar FND-001; menunggu item perilaku pertama |

`src/app/page.tsx` bukan bagian FND-001. Perbaikan itu diperlukan karena tanpa itu `AC-04`/`AC-05` tidak bisa hijau dengan env nyata. Perubahan ini harus direview terpisah saat PR.

## Status `done`

Tidak ada AC yang tersisa. `AC-05` terbukti merah lalu hijau (PR #3), branch `fnd-001-lingkungan` sudah di-merge ke `main` oleh tech lead, dan CI `main` hijau. Item ditandai `done` pada 2026-11-22.
