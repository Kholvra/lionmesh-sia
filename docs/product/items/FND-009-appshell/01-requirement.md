# FND-009 — Requirement

**Item:** `FND-009`
**Judul:** AppShell: sidebar 220px + guard rute `(app)`
**Epic:** `EPIC-FND` · **Sequence:** 9 · **Depends on:** `FND-003`, `FND-007`
**Pemilik:** tech lead

## Outcome

Setiap pengguna yang sudah masuk melihat satu kerangka tetap di semua layar: sidebar 220px berisi navigasi dan identitas pengguna, area konten di sebelahnya, dan sesi yang dijaga di satu tempat. Pengguna tanpa sesi diarahkan ke `/login` sebelum melihat isi apa pun.

## Aktor

| Aktor | Perilaku |
|---|---|
| 13 peran staf | melihat shell yang sama; nama dan peran tampil di footer |
| Pengguna tanpa sesi | diarahkan ke `/login`; tidak pernah melihat shell |
| Akun nonaktif | diperlakukan seperti tanpa sesi (`FND-003`) |

## Cakupan

- `src/app/(app)/layout.tsx`: guard `requireSesi()`, skip link, sidebar, `<main id="konten">`.
- `src/components/shell/sidebar.tsx` + `nav.ts` + `sidebar.module.css`: brand, menu primer, menu utilitas, footer (nama, peran, perusahaan, keluar).
- `src/app/(app)/page.tsx`: keadaan kosong Dashboard sampai `C-014` dibangun.
- `src/app/(app)/loading.tsx` dan `src/app/(app)/error.tsx`.
- `src/app/(app)/pengaturan/page.tsx`: `pengaturan` dipindah ke dalam shell; URL tidak berubah.
- `src/app/page.tsx` (konten starter) dihapus; `/` sekarang milik shell.
- Token layout dan sidebar di `src/app/globals.css`.

## Nilai tetap

| Hal | Nilai | Sumber |
|---|---|---|
| Lebar sidebar | 220px | `D-62` |
| Konten mulai | x=252 (220 + 32) | `D-62` |
| Padding halaman | 32px | `LAYOUTS.md` |
| Content max | 1440px | `LAYOUTS.md` |
| Min width | 1280px, scroll horizontal di bawahnya | `LAYOUTS.md` |
| Item tinggi | 40px | `COMPONENTS.md` |
| Item aktif | `brand-500` bg, `ink-900` text, radius 8 | `COMPONENTS.md` |

## Status dan transisi

Shell tidak punya state machine. Yang ada hanya tiga keadaan, semuanya wajib terlihat:

| Keadaan | Perilaku |
|---|---|
| Tanpa sesi | `redirect("/login")`; tidak ada HTML shell yang terkirim |
| Sesi aktif | shell tampil; item aktif ditandai `aria-current="page"` |
| Item belum tersedia | dirender sebagai teks non-tautan dengan label "belum"; tidak menautkan ke rute 404 |

## Validasi

Tidak ada input pengguna di item ini, jadi tidak ada pesan validasi. Aksi keluar memakai `SignOutButton` yang sudah ada.

## Di luar cakupan

- Dashboard umum (`C-014`), grup navigasi per siklus, palet v2, notifikasi, pencarian global, dan penyempitan menu berdasarkan izin per peran (matriks izin mengatur aksi, bukan menu).
