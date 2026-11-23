# FND-009 — Design Contract

## Batas kepemilikan

| Hal | Pemilik | Aturan |
|---|---|---|
| Kerangka rute `(app)` | `FND-009` | satu-satunya tempat shell dipasang |
| Navigasi (label, urutan, ikon) | `FND-009` | `src/components/shell/nav.ts` |
| Primitive UI (tabel, form, badge, dialog) | `FND-007` | tidak diubah item ini |
| Nilai token | `docs/design/DESIGN_TOKENS.md` | tidak ada hex/px mentah di komponen |
| Layar isi per siklus | modul masing-masing | dirender sebagai `children` |

## Invariants

- `INV-01` — **Satu shell.** `Sidebar` hanya diimpor oleh `src/app/(app)/layout.tsx`. Tidak ada sidebar kedua di modul.
- `INV-02` — **Guard di satu tempat.** Setiap halaman di bawah `(app)` memakai `requireSesi()` dari layout, bukan pemeriksaan sendiri. Halaman tidak boleh menambah guard yang berbeda.
- `INV-03` — **Lebar dari token.** `--layout-sidebar-width` (220px) adalah satu-satunya sumber; tidak ada `220px` literal di komponen.
- `INV-04` — **Tidak ada tautan mati.** Item navigasi dengan `tersedia: false` dirender tanpa `href`. Menautkan rute yang belum ada dilarang.
- `INV-05` — **Tidak ada nilai desain baru.** Warna, jarak, radius, dan ukuran huruf memakai variabel dari `globals.css` yang berasal dari `DESIGN_TOKENS.md`.
- `INV-06` — **Shell tidak menyentuh data domain.** Layout hanya membaca sesi dan profil; tidak ada query tabel bisnis.

## Alur

```text
request → proxy (refresh cookie) → (app)/layout
                                     ├─ tanpa sesi  → redirect /login
                                     └─ sesi aktif  → Sidebar + main(children)
```

## Kegagalan yang harus terlihat

| Kondisi | Perilaku |
|---|---|
| Cookie kedaluwarsa | `requireSesi()` → `/login`, tanpa render setengah jadi |
| Profil hilang/nonaktif | diperlakukan sebagai tanpa sesi (`FND-003`) |
| Render halaman gagal | `(app)/error.tsx` menampilkan pesan + tombol coba lagi, tanpa membocorkan detail |
| Halaman lambat | `(app)/loading.tsx` dengan `aria-busy="true"` |
