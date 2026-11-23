# GJ-001 — Bukti Verifikasi

Tanggal: 2026-11-23. Lingkungan: Node 24, pnpm 10.18.3, Next.js 16.4.6 (`pnpm dev`), Supabase lokal (akun uji 13 peran). Branch `gj-001-karyawan-gaji-pokok-ptkp` dari `main` `ac62cd4`. Layar dirender di AppShell bersama (`FND-009`, `D-62`); tidak ada sidebar modul.

**Batas bukti:** tabel karyawan, gaji pokok, dan PTKP milik core (`D-31`) belum punya migrasi. Layar memakai store sementara di memori (`src/modules/penggajian/karyawan/store.ts`) di belakang `queries.ts` dan `actions.ts`; usulan skema dan RLS ada di `06-ddl-proposal.sql`, mengikuti pola `0009` (`PG-001`): view per peran, fungsi tulis dengan guard HR, dan `karyawan_riwayat_status` (`D-63`). Usulan itu lolos dijalankan di atas migrasi `0001`–`0009` dalam transaksi yang di-rollback. Pembatasan baca oleh database (RLS) untuk AC-08 dan AC-13 belum bisa dibuktikan; yang dibuktikan adalah penyaringan field di server per peran.

Uji otomatis memakai skrip Playwright di luar repo (Brave headless, lebar 1280).

| AC | Hasil | Langkah dan hasil |
|---|---|---|
| AC-01 | Lolos (UI) | HR → Tambah karyawan dengan data lengkap dan gaji pokok awal → "Karyawan tersimpan." dan karyawan tampil di direktori |
| AC-02 | Lolos (UI) | NIK 3216051290010001 (milik Agus) → "NIK 3216051290010001 sudah dipakai karyawan lain." |
| AC-03 | Lolos (UI) | Tambah gaji pokok baru → entri lama tetap di riwayat dengan keadaan Digantikan atau Dijadwalkan |
| AC-04 | Lolos (UI) | Koreksi dilakukan dengan entri baru; tidak ada aksi ubah atau hapus entri gaji |
| AC-05 | Lolos (UI) | Status PTKP dipilih dari daftar aktif (TK/0–TK/3, K/0–K/3) |
| AC-06 | Lolos (server) | Kode PTKP di luar daftar ditolak oleh validasi server |
| AC-07 | Lolos (UI + server) | Accounting dan Finance tidak punya tombol ubah; server action menolak lewat `assertIzin("kelola_data_karyawan")` |
| AC-08 | Sebagian | Accounting melihat identitas, gaji, dan PTKP tanpa rekening; Finance melihat nama dan rekening; Direksi dan Karyawan "tidak punya akses". RLS menunggu tabel |
| AC-09 | Lolos (UI) | Setiap tambah, ubah, gaji baru, dan nonaktif menambah baris riwayat dengan pelaku dan waktu |
| AC-10 | Sebagian | Draft payroll menyimpan angka gaji yang dipakai dan dikunci saat disetujui (GJ-005); gaji pokok baru tidak mengubah draft yang sudah dihitung |
| AC-11 | Lolos (UI) | Gaji pokok kedua dengan tanggal berlaku yang sama → ditolak dengan pesan tanggal |
| AC-12 | Lolos (UI) | Karyawan nonaktif tidak muncul di pilihan karyawan untuk presensi, lembur, dan pemetaan mesin (GJ-002, GJ-008) |
| AC-13 | Lolos (UI) | Akun Karyawan membuka data karyawan → "Anda tidak punya akses" |
| AC-14 | Lolos (UI) | NIK bukan 16 digit → "NIK harus 16 digit angka." |
| AC-15 | Lolos (UI) | Rekening tanpa nama bank, nomor berdigit, atau nama pemilik → ditolak dengan pesan per kolom |

Bug di luar item yang dilaporkan: `ConfirmDialog` (FND-007) tampil di pojok kiri atas karena margin dialog direset preflight Tailwind.

`pnpm verify` (2026-11-23): lint, typecheck, arch:check, dan build lulus, exit code 0.

## Layar

Sumber: Figma "SIA Liomesh (Copy)" `VS9PagBMlKi2McPPfCdsRV`, daftar di `docs/design/inventory/penggajian.md`.

| Layar | Node | Route |
|---|---|---|
| Data karyawan | `141:2521` | `/penggajian/karyawan` |
| Tambah karyawan | `141:2584` | `/penggajian/karyawan/tambah` |
| Detail karyawan | `141:2779` | `/penggajian/karyawan/[id]` |
| Edit data karyawan | `141:2833` | `/penggajian/karyawan/[id]/ubah` |
| Ubah status karyawan | `141:2923` | `/penggajian/karyawan/[id]/status` |

Menu "Penggajian" di sidebar bersama masih `tersedia: false`; sampai menu modul diputuskan tech lead, layar dibuka lewat route di atas.
