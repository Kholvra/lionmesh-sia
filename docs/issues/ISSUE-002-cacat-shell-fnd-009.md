# ISSUE-002 — Cacat shell `FND-009`: prerender `Date.now()` dan scroll di 1280

**Status:** `open` · **Dicatat:** 2026-11-23 · **Pemilik keputusan:** tech lead
**Tidak dikerjakan sekarang.** Ditemukan saat menjalankan `pnpm dev` untuk uji manual `PG-001`.

## `F01` — `pnpm dev` mencatat error prerender di setiap rute `(app)`

Gejala di log dev:

```text
Error: Route "/": Next.js encountered the unstable value `Date.now()` while prerendering.
Error: Route "/pengeluaran/pemasok": Next.js encountered the unstable value `Date.now()` …
    at AppLayout (<anonymous>)  digest: '1503537001'
```

Halaman tetap merespons 200 dan tampil benar, tetapi Next menampilkan badge merah **"1 Issue"** di kiri bawah, menutupi sudut sidebar saat uji manual.

Fakta yang sudah diperiksa:

- Tidak ada `Date.now()` di `src/`. Pencarian hanya menemukan `new Date()` di `src/core/inventory/*`.
- Rute `/` dan `/pengaturan` keluar sebagai dinamis (`ƒ`) pada `pnpm build`; build produksi bersih.
- Error hanya muncul di dev, dipicu pembacaan sesi di `src/app/(app)/layout.tsx` (`requireSesi()` → klien Supabase) saat Next mencoba merender shell statis.

Dugaan: kombinasi Cache Components Next 16 + pembacaan cookie/sesi di layout grup. Belum dipastikan penyebab persisnya.

Usulan penyelidikan (belum dikerjakan): jalankan `pnpm dev` dengan `cacheComponents` dimatikan sementara, lalu bandingkan; atau bungkus pembacaan sesi dengan penanda dinamis yang didukung Next 16 (`connection()`/`cookies()` sebelum klien dibuat). Jangan menambal dengan `Date.now = …` atau mematikan pemeriksaan.

## `F02` — Scrollbar horizontal muncul saat lebar jendela tepat 1280

Gejala: pada viewport 1280×900, halaman yang lebih tinggi dari layar menampilkan scrollbar horizontal di dasar halaman, sehingga sidebar ikut bergeser.

Sebab: `.shell` memakai `min-width: 1280px` (`(app)/layout.module.css:2`), sedangkan scrollbar vertikal memakan ~15px. Area klien menjadi ~1265px < 1280px, jadi aturan "di bawah 1280 scroll" aktif pada lebar yang seharusnya pas.

Pilihan penyelesaian (belum diputuskan):

| Opsi | Efek | Catatan |
|---|---|---|
| A. Biarkan | sesuai aturan tertulis | mengganggu secara visual pada 1280 |
| B. `scrollbar-gutter: stable` pada `html` | ruang scrollbar disediakan selalu | area konten menyusut ~15px di semua lebar |
| C. Turunkan `min-width` shell ke 1248px | pas untuk 1280 dengan scrollbar | menyimpang dari `D-62`; butuh keputusan |
| D. Terima 1280 hanya untuk halaman pendek | tidak konsisten | — |

Rekomendasi awal: **B** dicoba lebih dulu, karena tidak mengubah angka desain; kalau efeknya mengganggu, baru **C** dengan keputusan tertulis.

## Dampak

Keduanya kosmetik untuk build produksi (`F01`) atau hanya pada lebar minimum (`F02`). Tidak memblokir `PG-001`. Tetapi setiap uji manual memakai badge "1 Issue" sebagai latar, sehingga mudah salah dibaca sebagai kesalahan fitur.
