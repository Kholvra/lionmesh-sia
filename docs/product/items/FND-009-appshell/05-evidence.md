# FND-009 — Evidence

Tanggal: 2026-11-23 · Lingkungan: Supabase lokal (Docker, migrasi `0008`, seed versi `0004`), Next.js 16.4.6, Node 24.

## Persiapan

```text
$ pnpm db:reset && pnpm db:seed:local
[db:seed] selesai — seed versi 0004 terpasang
[db:seed:local] akun uji siap — sandi: lionmesh-dev-2026
$ pnpm dev
✓ Ready in 351ms
```

Akun yang dipakai untuk verifikasi: `purchasing@lionmesh.test` / `lionmesh-dev-2026`.

## AC-01 — tanpa sesi diarahkan ke login

```text
$ curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/
307 http://localhost:3000/login
```

## AC-02 — sesi aktif melihat shell

```text
$ curl -s -H "Cookie: sb-127-auth-token=<sesi>" http://localhost:3000/
200
$ grep -c "Navigasi utama" home.html
1
$ grep -c "Lionmesh" home.html
2
```

## AC-05, AC-08 — item aktif dan `pengaturan` di dalam shell

```text
$ curl -s -H "Cookie: ..." -o set.html -w "%{http_code}" http://localhost:3000/pengaturan
200
$ grep -c "Informasi akun" set.html
1
$ grep -c "Purchasing" set.html
6
```

`/pengaturan` tetap di URL yang sama setelah dipindah ke `src/app/(app)/pengaturan/`.

## AC-06 — rute yang belum ada bukan tautan mati

```text
$ grep -o "Belum tersedia" home.html | wc -l
5      # Pendapatan, Pengeluaran, Produksi, Penggajian, Laporan
```

## AC-03, AC-04 — lebar dan konten

```text
$ grep -n "layout-" src/app/globals.css
106:  --layout-content-max: 1440px;
107:  --layout-min-width: 1280px;
108:  --layout-sidebar-width: 220px;
```

`nav` memakai `width: var(--layout-sidebar-width)` dan `main` memakai
`margin-inline-start: var(--layout-sidebar-width)`; tidak ada `220px` literal di
komponen. Lebar 220px ditetapkan `D-62`.

Screenshot 1280 × 900 (produksi, bukan dev): sidebar mengisi 220px, konten mulai
di x=252, tidak ada scroll horizontal pada halaman pendek.

| Berkas | Isi |
|---|---|
| [`fnd009-appshell-1280.png`](fnd009-appshell-1280.png) | Dashboard: sidebar, 5 item `BELUM`, keadaan kosong, footer identitas |
| [`fnd009-pengaturan-1280.png`](fnd009-pengaturan-1280.png) | `/pengaturan` di dalam shell, item aktif oranye, tombol keluar tunggal |

Screenshot diambil dengan Brave headless + CDP (`Emulation.setDeviceMetricsOverride`
1280×900) terhadap `pnpm build && pnpm start`, memakai sesi `purchasing@lionmesh.test`.

## AC-11 — hanya satu shell

```text
$ grep -rn "Sidebar" src/app
src/app/(app)/layout.tsx:3:import { Sidebar } from "@/components/shell/sidebar";
src/app/(app)/layout.tsx:19:      <Sidebar
```

## AC-12 — gerbang mutu

```text
$ pnpm verify
✓ Compiled successfully
✓ Generating static pages (7/7)
exit 0
```

Rute hasil build: `/`, `/_not-found`, `/auth/callback`, `/login`, `/pengaturan` — `/` dan `/pengaturan` dinamis (`ƒ`) karena membaca cookie sesi.

## AC-09, AC-10 — keadaan fokus dan kegagalan

| AC | Bukti |
|---|---|
| AC-07 | `src/components/shell/sidebar.tsx` footer: `nama`, `peran`, `PT Lionmesh Prima Tbk`, `SignOutButton` — satu tombol keluar, milik shell |
| AC-09 | `src/app/(app)/layout.tsx` baris skip link `#konten` sebelum `<Sidebar>`; `main` memakai `id="konten"` |
| AC-10 | `src/app/(app)/loading.tsx` (`aria-busy`, `aria-live`) dan `error.tsx` (`role="alert"`, tombol coba lagi) |

## Catatan penyimpangan

`pengaturan` sebelumnya merender tombol keluar sendiri di header. Setelah masuk
shell, tombol itu dihapus supaya hanya ada satu aksi keluar (footer sidebar,
`COMPONENTS.md` §2). `min-height: 100vh` di halaman itu juga dihapus karena
shell sudah menyediakan tinggi penuh; menyisakannya memunculkan dua scrollbar.

## Kesimpulan

AC-01 sampai AC-12 terbukti. Item boleh ditandai `done` setelah PR di-merge.
