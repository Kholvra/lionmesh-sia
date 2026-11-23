# PG-001 — Bukti Verifikasi

Implementasi dimulai 2026-11-23 pada branch `feat/pg-001-pemasok` oleh track Pengeluaran. Di-rebase ke `origin/main` dan diverifikasi ulang oleh tech lead pada hari yang sama setelah `FND-009` (AppShell) selesai.

Status item: **`in progress`**. Sebelas dari tiga belas AC terbukti; `AC-07` dan `AC-09` sengaja lintas item dan baru bisa dibuktikan saat dokumen pemakai (`PG-005`, `PG-006`) ada.

## Lingkungan verifikasi

- Node.js `v24.22.2`, pnpm `10.18.3`, Next.js `16.4.6`
- Supabase lokal (Docker) — migrasi `0001`–`0009`, seed versi `0004`
- Akun: `purchasing@lionmesh.test`, `gudang@lionmesh.test`, `manajemen@lionmesh.test` (sandi `lionmesh-dev-2026`)

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0009_pg001_pemasok.sql` |
| Core service | `src/core/pemasok/{types,queries,service,index}.ts` |
| Modul | `src/modules/pengeluaran/pemasok/{schema,actions,queries,screen,format}.ts(x)` |
| Komponen | `src/modules/pengeluaran/pemasok/components/*` |
| Route | `src/app/(app)/pengeluaran/pemasok/{page,loading,error}.tsx` |

### Perubahan saat review (tech lead, 2026-11-23)

| Hal | Sebelum | Sesudah |
|---|---|---|
| Guard peran di RPC | `current_peran() <> 'Purchasing'` — gagal terbuka saat `current_peran()` null (sesi kedaluwarsa) | `current_peran() is distinct from 'Purchasing'` |
| Guard di halaman | Dua `<main>` (shell + layar) dan tombol keluar ganda | Satu `<main>` milik shell; tombol keluar hanya di sidebar |
| Peran pembaca | Semua staf kecuali Karyawan | Purchasing dan Accounting saja, sesuai `D-33` dan requirement |
| Padding halaman | Shell 32px + layar 32px (konten mulai x=284) | Hanya shell; konten mulai x=252 |

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm check:migrations` | lolos — 9 berkas, nomor unik |
| `pnpm lint` | lolos |
| `pnpm typecheck` | lolos |
| `pnpm arch:check` | lolos |
| `pnpm build` | lolos |
| `pnpm db:reset` | lolos — migrasi `0009` terpasang dari database kosong |
| `pnpm db:seed` | lolos — 13 akun uji |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ✅ | Form di `/pengeluaran/pemasok` membuat `PT Baja Nusantara`; baris muncul di daftar dengan status `Aktif` dan detail terbuka lewat `?pemasok=<id>` |
| `AC-02` | ✅ | `create_pemasok('PT Default', …, termin 30)` → `toleransi_persen 0.00`, `toleransi_nominal 0.00` |
| `AC-03` | ✅ | Submit nama kosong → `Nama pemasok wajib diisi`; tidak ada baris baru |
| `AC-04` | ✅ | `toleransi_nominal = -1` → `Toleransi nominal tidak boleh negatif` |
| `AC-05` | ✅ | Termin kosong → `Termin pembayaran wajib diisi` |
| `AC-06` | ✅ | `set_status_pemasok(false)` menulis `NONAKTIFKAN · aktif → nonaktif` dengan `actor_id` Purchasing dan waktu |
| `AC-07` | ⚠️ | Lintas item: pemakai pertama adalah `PG-005`/`PG-006`. Query `listPemasok({ aktif: true })` tersedia |
| `AC-08` | ✅ | Manajemen memanggil `update_pemasok` → `42501 Anda tidak punya izin mengubah data pemasok`; halaman menampilkan "Akses ditolak" untuk Gudang |
| `AC-09` | ⚠️ | Lintas item: butuh dokumen lama untuk membuktikan snapshot termin |
| `AC-10` | ✅ | `pnpm db:reset` dua kali berturut-turut, lalu `db:seed`; hasil sama dan migrasi bersih |
| `AC-11` | ✅ | Tersimpan terpisah: `toleransi_persen 0.5`, `toleransi_nominal 1000`, keduanya dibaca apa adanya di detail |
| `AC-12` | ✅ | `set_status_pemasok(true)` menulis `AKTIFKAN · nonaktif → aktif`; riwayat berisi tiga baris berurutan |
| `AC-13` | ✅ | Purchasing melihat `kontak_pic_nama = Rina`; Gudang membaca baris yang sama dengan PIC `null` |

### Bukti sesi kedaluwarsa

`D-42` membatasi sesi 8 jam. Sebelum perbaikan, pengguna dengan token valid tetapi sesi berumur 9 jam masih bisa menulis pemasok karena `current_peran()` mengembalikan `null` dan `null <> 'Purchasing'` dievaluasi `false` oleh PL/pgSQL. Setelah perbaikan:

```text
sesi 9 jam + peran Purchasing → 42501 Anda tidak punya izin mengubah data pemasok
sesi valid + peran Gudang     → 42501
sesi valid + peran Purchasing → baris tersimpan
```

## Validasi form memakai zod (2026-11-23)

`schema.ts` memakai `zod 4.6.7` (standar baru di `AGENTS.md`). Validasi RPC tidak berubah; zod adalah gerbang pertama di batas action. Kasus diperiksa langsung terhadap `parsePemasokForm`:

| Input | Hasil |
|---|---|
| kosong | `nama: Nama pemasok wajib diisi`, `termin_hari: Termin pembayaran wajib diisi` |
| nama + termin 30, toleransi kosong | tersimpan dengan `toleransi_persen 0`, `toleransi_nominal 0` |
| termin `abc` | `Termin pembayaran harus berupa angka` |
| termin `-5` | `Termin pembayaran harus berupa angka bulat minimal 0` |
| persen `0,755` | `Maksimal 2 angka desimal` (tidak dibulatkan diam-diam oleh `numeric(5,2)`) |
| nominal `-1` | `Toleransi nominal tidak boleh negatif` |
| nominal `1.234,56` | `Toleransi nominal harus berupa angka` |
| `0,75` / `1500` | tersimpan `0.75` / `1500` |

`zod` hanya diimpor `actions.ts` (`"use server"`) dan `form-state.ts` tidak mengimpornya, sehingga zod tidak masuk bundel browser. Dibuktikan setelah build:

```text
$ grep -rl --include="*.js" "ZodError" .next/static      → kosong
$ grep -rl --include="*.js" "invalid_union" .next/static  → kosong
```

## Screenshot 1280

[`pg001-pemasok-1280.png`](pg001-pemasok-1280.png) — daftar + detail + riwayat status, sidebar 220px, konten mulai x=252.

## Kepatuhan aturan

- `D-09`: migrasi `0009` dinomori dan di-review tech lead; tidak ada migrasi lain yang memakai nomor itu.
- `D-31`: tabel `pemasok` hidup di core (`src/core/pemasok`, `public.pemasok`), layar di modul.
- `D-63`: status master dicatat di `public.pemasok_riwayat_status` karena `riwayat_status` terikat `dokumen`.
- `D-42`/`D-48`: guard peran dan sesi ditegakkan di RPC `security definer`, bukan hanya di UI.
- `D-33`: hanya Purchasing menulis; Accounting membaca; peran lain tidak mendapat akses master.

## Yang belum selesai

1. `AC-07` dan `AC-09` menunggu dokumen pemakai.
2. `PG-011`/laporan belum membaca pemasok — di luar cakupan item ini.
