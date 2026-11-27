# GJ-001 — Bukti Verifikasi

## Pembaruan 2026-11-27: data di Supabase (migrasi 0016)

Utang dari PR #38 dibayar: tabel karyawan masuk lewat `supabase/migrations/0016_gj001_karyawan.sql` (nomor dari tech lead, `D-09`), `store.ts` dihapus, dan hanya `queries.ts` serta `actions.ts` yang berubah; layar tidak disentuh. Seed contoh di `supabase/seeds/0013_gj001_karyawan.sql` (departemen, jabatan, 8 kategori PTKP, Agus/Siti/Rina/Doni). Lingkungan: `pnpm db:reset` + `pnpm db:seed:local` di Supabase lokal, dev server, Chromium headless lebar 1440.

Perbedaan migrasi terhadap `06-ddl-proposal.sql`:

- `karyawan_aman`: NIK, departemen, jabatan, tipe, tanggal masuk, dan kode PTKP hanya untuk HR dan Accounting. Usulan memperlihatkan NIK ke Finance, sedangkan `akses.ts` memberi Finance nama dan rekening saja. View juga mengembalikan `ptkp_kode`, bukan id.
- `karyawan_riwayat_status.aksi` menerima `UBAH` agar perubahan data tercatat dengan aktor dan waktu (AC-09). Riwayat dibaca HR dan Accounting, sama dengan pembaca identitas di layar.
- Badan empat fungsi tulis ditulis: `create_karyawan`, `update_karyawan`, `tambah_gaji_pokok`, `nonaktifkan_karyawan`; semuanya `security definer` dan memanggil `gj001_assert_hr()`.

Uji database (supabase-js, login per peran, akses langsung ke API): 27/27 lolos.

| Peran | `karyawan_aman` | Kolom terlihat | `gaji_pokok_aman` | Tabel dasar | Tulis gaji |
|---|---|---|---|---|---|
| HR | 4 baris | semua | 6 | ditolak | diterima |
| Accounting | 4 baris | identitas, PTKP; tanpa rekening | 6 | ditolak | ditolak: "Anda tidak punya izin mengubah data karyawan." |
| Finance | 4 baris | nama, rekening; tanpa NIK dan PTKP | 0 | ditolak | ditolak |
| Direksi, Supervisor Lapangan, Produksi, Karyawan | 0 baris | — | 0 | ditolak | ditolak |

Juga lewat API: tanggal berlaku ganda → "Sudah ada gaji pokok yang berlaku pada 01-01-2026."; NIK ganda → "NIK 3216051290010001 sudah terdaftar."; HR menghapus `gaji_pokok_histori` langsung → "permission denied"; ubah data menambah riwayat `UBAH` dengan `actor_nama`.

Uji layar: 13/13 lolos, tanpa error halaman.

| AC | Hasil | Bukti |
|---|---|---|
| AC-01 | Lolos (DB) | HR menambah "Budi Uji" → tersimpan, tampil di detail dengan gaji Rp 2.750.000 |
| AC-02 | Lolos (DB) | Form lengkap dengan NIK yang sama → "sudah dipakai karyawan lain"; fungsi DB juga menolak |
| AC-03, AC-04 | Lolos (DB) | Gaji Rp 3.000.000 berlaku 01 Jan 2027 ditambahkan; entri Rp 2.750.000 tetap; histori immutable oleh trigger |
| AC-07 | Lolos (DB) | Selain HR, `tambah_gaji_pokok` ditolak oleh `gj001_assert_hr()` |
| AC-08 | **Lolos (RLS)** | Tabel di atas; Accounting tidak melihat rekening Agus, Finance tidak melihat NIK, Direksi tidak melihat apa pun |
| AC-09 | Lolos (DB) | Riwayat "Data karyawan dibuat", "Data karyawan diubah", gaji ditambahkan, dan nonaktif dengan nama HR dan waktu |
| AC-11 | Lolos (DB) | Tanggal berlaku 01 Nov 2026 kedua kali → ditolak dengan pesan tanggal |
| AC-13 | **Lolos (RLS)** | Akun Karyawan: 0 baris dari ketiga view, tabel dasar ditolak, layar tidak menampilkan data |
| AC-14 | Lolos | NIK "12AB" → "NIK harus 16 digit angka."; constraint `ck_karyawan_nik` juga menolak |

AC-05, AC-06, AC-15 tetap seperti bukti 2026-11-23 (validasi tidak berubah; PTKP kini dari tabel `kategori_ptkp`). AC-10 tetap ditunda ke GJ-005; AC-12 bagian pemilihan tetap di GJ-002/GJ-008.

`pnpm verify` dan `pnpm check:migrations` (16 berkas, nomor unik): exit 0.

## Bukti awal 2026-11-23 (store memori)

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
| AC-10 | Ditunda | Ditunda ke GJ-005 sesuai `02-acceptance-criteria.md`: butuh payroll yang disetujui dan dikunci, yang belum ada di item ini |
| AC-11 | Lolos (UI) | Gaji pokok kedua dengan tanggal berlaku yang sama → ditolak dengan pesan tanggal |
| AC-12 | Sebagian | Setelah dinonaktifkan, data dan riwayat gaji tetap tampil di detail dengan status Nonaktif. Pilihan karyawan untuk dokumen baru dibuat oleh item pemakainya (GJ-002 presensi, GJ-008 pemetaan mesin); bagian itu dibuktikan di sana |
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
