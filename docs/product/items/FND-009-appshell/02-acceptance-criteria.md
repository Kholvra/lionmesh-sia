# FND-009 — Acceptance Criteria

Semua langkah dijalankan dari `pnpm db:reset` + `pnpm db:seed:local` pada Supabase lokal, dengan `pnpm dev` berjalan.

| # | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pengguna tanpa sesi tidak pernah melihat shell | `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/` → `307 http://localhost:3000/login` |
| `AC-02` | Sesi aktif melihat shell dengan brand dan navigasi | `GET /` dengan cookie sesi → HTML memuat `Navigasi utama`, `Lionmesh`, `Sistem Informasi Akuntansi` |
| `AC-03` | Sidebar 220px dan area konten mulai di x=252 | Ukur di viewport 1280: `nav` lebar 220, `main` padding 32 |
| `AC-04` | Konten dibatasi 1440 dan halaman minimal 1280 | `main > *` max-width 1440; di bawah 1280 halaman scroll horizontal, tidak reflow |
| `AC-05` | Item aktif ditandai | Buka `/pengaturan` → tautan Pengaturan ber-`aria-current="page"`; Dashboard tidak |
| `AC-06` | Rute yang belum ada tidak menjadi tautan mati | Enam item primer: `Pendapatan`–`Laporan` dirender sebagai teks dengan label `belum`, tanpa `href` |
| `AC-07` | Identitas dan aksi keluar tersedia di footer | Footer memuat `display_name`, `peran`, `PT Lionmesh Prima Tbk`, tombol keluar |
| `AC-08` | `pengaturan` berada di dalam shell dan URL tetap | `/pengaturan` → 200, HTML memuat sidebar dan `Informasi akun` |
| `AC-09` | Skip link adalah elemen fokus pertama | Tab pertama dari address bar memfokuskan `Lewati ke konten`; target `#konten` ada |
| `AC-10` | Ada keadaan memuat dan gagal | `(app)/loading.tsx` (`aria-busy`) dan `(app)/error.tsx` (`role="alert"` + tombol coba lagi) |
| `AC-11` | Hanya satu shell | `grep -rn "Sidebar" src/app` hanya memakai komponen di `(app)/layout.tsx` |
| `AC-12` | Gateway mutu lulus | `pnpm verify` exit 0 |
