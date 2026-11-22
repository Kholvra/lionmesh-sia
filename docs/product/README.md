# Backlog Produk — Lionmesh SIA

## Peran dokumen

| Dokumen | Peran | Isi |
|---|---|---|
| `backlog.md` | **canonical** | indeks tunggal seluruh requirement |
| `decisions.md` | **canonical** | register keputusan yang sudah dikunci |
| `items/<ID>-<slug>/` | **canonical** | paket requirement per item |
| `epics/<EPIC>.md` | **canonical** | batas outcome, topologi, gate |
| `policies/` | **canonical** | Definition of Ready / Done |
| `reference/analisis-sia.md` | **reference** | analisis end-to-end, bukan sumber normatif |

## Source priority

Saat dua dokumen berbeda, urutan yang menang:

1. `decisions.md` — keputusan yang sudah dikunci manusia
2. `backlog.md` + `items/*/02-acceptance-criteria.md`
3. `reference/analisis-sia.md`

`reference/analisis-sia.md` menjelaskan **mengapa**, bukan **apa yang harus dibangun**. Kalau bertentangan dengan backlog, backlog menang.

## Kontrak desain

Kontrak perilaku per item ada di `items/<ID>-<slug>/04-design-contract.md`. Kontrak lintas item ada di `docs/architecture/contracts/`.

Item yang mengubah uang, stok, status dokumen, atau batas modul **wajib** punya kontrak sebelum implementasi. Kontrak yang belum punya bukti pemeriksa berstatus `Unverified` — bukan "aman".

## Profil proyek

`product-app` — aplikasi web internal. Requirement memakai bahasa aktor, alur kerja, izin, status, dan pesan error yang terlihat.

## Konvensi ID

| Prefix | Cakupan | Lane |
|---|---|---|
| `FND-###` | fondasi bersama (core) | active, serial |
| `PD-###` | siklus pendapatan | active, paralel |
| `PG-###` | siklus pengeluaran | active, paralel |
| `PR-###` | siklus produksi | active, paralel |
| `GJ-###` | siklus penggajian | active, paralel |
| `INT-###` | integrasi lintas siklus | active, join |
| `DISC-###` | pencarian bukti / spike (konfirmasi dari luar tim) | discovery |

Nomor tidak pernah dipakai ulang. Item yang sudah di-handoff tidak di-renumber.

## Topologi

**Hybrid** — fondasi serial, lalu graph paralel lintas siklus **dan** di dalam siklus, ditutup satu titik join.

```text
FND-001 → … → FND-008            (serial, satu pemilik)
                    │
    ┌───────────┬───┴───────┬───────────┐
    │           │           │           │
  PD-A…D      PG-A…E      PR-A…D      GJ-A…D      CORE-A…C
    │           │           │           │            │
    └───────────┴─────┬─────┴───────────┴────────────┘
                      │
                   INT-001 → INT-002 / INT-003
```

### Aturan paralel

1. **Fondasi serial.** Hanya `FND-*` yang punya urutan wajib. Sequence = urutan ID.
2. **Setelah gate fondasi, semua item modul masuk graph.** Item boleh mulai begitu **prasyarat sebenarnya** selesai — tidak menunggu siklus lain.
3. **Tiap siklus punya beberapa track** (A/B/C/D…). Satu track bisa dipegang satu orang, dan track yang tidak saling bergantung boleh jalan bersamaan.
4. **`level` = panjang jalur dependensi.** Item dengan level sama bisa dikerjakan serentak. Level bersifat **derived** — alat bantu perencanaan, bukan aturan normatif.
5. **Tidak ada dependensi lintas siklus yang dibuat-buat.** Produksi hanya bergantung pada *service* pengadaan, bukan pada seluruh siklus Pengeluaran.
6. **Join.** `INT-*` tidak boleh ditutup sebelum keempat siklus dan core lanjutan mencapai definisi selesai.

### Critical path

Jalur ini dihitung **setelah** gate fondasi. `FND-001`–`FND-007` ada di depannya (`FND-003` sampai `FND-007` sejajar setelah `FND-002`), jadi total durasi lebih panjang dari jalur di bawah.

`FND-002` → `FND-005` → `C-013` → `PG-002` → `PG-003` → `PG-004` → `PG-005` → `PG-006` → `PG-007` → `PG-008` → `PG-009` → `INT-001`

Pengeluaran adalah jalur terpanjang (level 9). Kalau mau mempercepat keseluruhan, tambah orang di Pengeluaran — bukan di Pendapatan.

### Yang bisa mulai serentak setelah fondasi

| Level 1 — delapan item kerja dan dua spike discovery |
|---|
| `PD-001` pelanggan · `PG-001` pemasok · `GJ-001` data karyawan · `C-009` laporan keuangan · `C-011` master data · `C-012` notifikasi · `C-013` pengadaan · `C-014` dashboard · spike `DISC-001` (mesin absensi) · `DISC-002` (format bank) |

Produksi mulai di level 2 (`PR-001` menunggu `C-011`). `C-011` dan `C-013` yang memblokir siklus lain, jadi keduanya didahulukan (`D-34`).

Approval topologi: keputusan D-02 (satu repo, branch per track) dan D-03 (review tech lead).

## Status fondasi

`partial` — per 2026-11-22.

| Kapabilitas | Status | Bukti |
|---|---|---|
| Next.js 16 + React 19 + TS + Tailwind | `available` | `package.json`, `next.config.ts`, `eslint.config.mjs` |
| Supabase client (browser/server/proxy) | `available` | `src/lib/supabase/*` |
| Auth SSR flow | `available` | `src/app/login/page.tsx`, `src/app/auth/callback/route.ts` |
| Skema domain | `missing` | hanya `supabase/migrations/0001_initial.sql` (`profiles`) |
| Peran & otorisasi | `missing` | `profiles` tanpa role |
| Service bersama (dokumen, inventory, ledger) | `missing` | tidak ada `src/core/` |
| Seed & reset | `available` | `scripts/db-seed.mjs`, `supabase/seed.sql` |
| Gerbang mutu | `available` | `pnpm verify`, `.dependency-cruiser.cjs` |
| Test runner | `missing` | tidak ada script test |
| CI | `available` | `.github/workflows/ci.yml`; merah→hijau terbukti di PR #3 |
| Migration runner | `available` | `scripts/check-migrations.mjs`, `pnpm db:setup` |

Gate: `FND-001`–`FND-007` wajib `done` sebelum item modul boleh `Ready` (tidak berlaku untuk item `FND-*`, `D-54`). Gate ini **lebih ketat** daripada `depends on` per item dan menang atas aturan 2 di atas (mis. `PD-001` hanya butuh `FND-003`, tapi tetap menunggu gate). Hanya `FND-008` yang boleh selesai paralel.

## Menambah item

1. Buat folder `items/<ID>-<slug>/` dengan empat file kanonik.
2. Isi metadata di `01-requirement.md`.
3. Tambah satu baris di `backlog.md`.
4. Jalankan DoR di `03-readiness-review.md`.
5. Jangan menyalin isi requirement ke `backlog.md` — cukup tautan.
