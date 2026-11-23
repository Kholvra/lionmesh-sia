# FND-009 — Diskusi

## Masalah

`FND-001`–`FND-008` selesai, tetapi tidak ada satu pun item yang membangun kerangka rute terautentikasi. Akibatnya:

- layar modul tidak punya tempat render. `PR #22` (PG-001) menaruh `src/app/(app)/pengeluaran/pemasok/page.tsx` tanpa `layout.tsx`, sehingga halaman tampil tanpa sidebar dan tanpa navigasi;
- setiap modul yang mulai akan membuat sidebar sendiri, dan `docs/design/COMPONENTS.md` §1 melarang shell kedua;
- gate backlog (`FND-001`–`FND-007`) menyatakan modul boleh mulai padahal prasyarat visualnya belum ada.

## Keputusan yang sudah diambil

| Hal | Keputusan | Alasan |
|---|---|---|
| Pemilik shell | item fondasi ini, bukan modul | lintas siklus; satu pemilik = satu shell |
| Lebar sidebar | **220px** (`D-62`) | 375/375 layar v2 memakai 220px; shell belum ada di kode sehingga tidak ada biaya migrasi |
| Palet | tetap v0.1 | `FIGMA_V2_DELTAS.md` §2 belum diputuskan; shell memakai token yang sudah ada |
| Sidebar v1 | tidak ada | `D-62` hanya mengubah geometri, bukan warna |

## Pertanyaan terbuka

Tidak ada. Lebar sudah diputuskan; warna tetap pada nilai terkunci.

## Yang sengaja tidak dikerjakan

- Grup navigasi kontekstual per siklus. Isinya baru bisa ditentukan saat layar pertama tiap siklus ada; menebak sekarang berarti menulis tautan mati.
- Dashboard umum (`C-014`). Shell hanya menyediakan keadaan kosong yang jujur.
- Palet v2. Menunggu keputusan `FIGMA_V2_DELTAS.md` §2 dan perubahan `globals.css` bersama.
