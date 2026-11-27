# GJ-002 — Bukti Verifikasi

Tanggal: 2026-11-27. Branch `gj-002-presensi-dan-lembur` dari `main` `b2c465d`. Supabase lokal (`pnpm db:reset` + `pnpm db:seed:local`), dev server, Chromium headless lebar 1440.

Data di Supabase lewat migrasi `0017_gj002_presensi_lembur.sql` (nomor menunggu persetujuan tech lead, `D-09`) dan seed `0014_gj002_presensi_lembur.sql`. Status presensi, lembur, dan periode disimpan di core dokumen (`FND-004`); jejaknya di `riwayat_status`. Layar diambil dari prototipe dan memakai AppShell bersama serta peta kelas Tailwind `ui/kelas.ts`.

Keputusan yang diambil saat menulis migrasi:

- `profiles.karyawan_id` mendapat FK ke `karyawan` (Q-DDL-01 GJ-001); akun `karyawan@` ditautkan ke Agus di seed.
- Koreksi periode tertutup memakai transisi `REKAP → TERBUKA` (`REVISI`) yang sudah ada di 0007; nilai lama disimpan di `presensi_koreksi` (append-only). Tidak perlu transisi baru.
- Presensi tidak punya status `DIBATALKAN`, sehingga `unique (karyawan_id, tanggal)` tidak bertabrakan (Q-DDL-02 usulan).
- Rentang periode tidak bertumpuk diperiksa trigger, karena `btree_gist` belum dipasang.
- Supervisor Lapangan belum membaca presensi; bagian itu milik GJ-003 (validasi per departemen).

## Uji database (supabase-js, login per peran)

27/27 lolos, termasuk alur koreksi.

| Kasus | Hasil |
|---|---|
| Karyawan membaca dirinya (`karyawan_saya`) dan hanya presensinya sendiri (22 baris) | lolos |
| HR membaca 88 presensi; Accounting 0; tabel dasar ditolak | lolos |
| Absen masuk mandiri; presensi ganda ditolak "Presensi tanggal 27-11-2026 sudah ada." | lolos |
| Karyawan mencatat atas nama orang lain → "Karyawan hanya boleh mencatat untuk dirinya sendiri." | lolos |
| Periode Oktober (Tervalidasi) menolak entri baru dengan nama periode | lolos |
| Accounting mencatat presensi → "Anda tidak punya izin untuk tindakan ini." | lolos |
| Lembur 300 menit → "Jam lembur melebihi batas yang berlaku: 240 menit per hari." | lolos |
| Pembatalan: bukan pemohon ditolak, tanpa alasan ditolak, pemohon dengan alasan diterima | lolos |
| Otorisasi koreksi: HR ditolak, Manajemen diterima | lolos |
| Koreksi tanpa otorisasi ditolak; dengan otorisasi tersimpan, periode kembali Terbuka, otorisasi sekali pakai | lolos |
| Absen pulang pada menit yang sama → "Jam pulang harus setelah jam masuk (18:46)." | lolos |

## Uji layar

| AC | Hasil | Bukti |
|---|---|---|
| AC-01, AC-12 | Lolos | HR → Catat presensi atas nama Siti, Sakit, 26 Nov 2026 → tersimpan |
| AC-02 | Lolos (DB) | Presensi kedua di tanggal sama ditolak oleh layar dan oleh `catat_presensi` |
| AC-03 | Lolos | HR mencatat 5 Okt 2026 → "Periode Oktober 2026 berstatus Tervalidasi…" |
| AC-04, AC-05 | Lolos | Lembur dengan SPL `SPL/PRD/XI/027` tersimpan; SPL kosong ditolak validasi dan fungsi DB |
| AC-06 | Lolos | Detail lembur menampilkan riwayat dari `riwayat_status` (diajukan, dibatalkan dengan alasan) |
| AC-07 | Lolos (DB) | Accounting ditolak `gj_assert_peran` |
| AC-08, AC-10 | Lolos | Akun Karyawan melihat "Agus / 3216051290010001", absen masuk dari layar, daftar lembur hanya miliknya |
| AC-09 | Lolos | Accounting membuka `/penggajian/presensi`: tidak ada jam atau SPL yang tampil; view mengembalikan 0 baris |
| AC-11 | Lolos (DB) | Absen pulang ditolak setelah tervalidasi atau periode tertutup |
| AC-13 | Lolos (DB) | Lihat tabel uji database; tombol rekap ada di GJ-003 sehingga periode Rekap dibuat lewat SQL untuk uji ini |
| AC-14 | Lolos | Pemohon membatalkan dengan alasan "Salah tanggal" |
| AC-15 | Lolos (DB) | Pembatalan setelah tervalidasi ditolak |
| AC-16 | Lolos | Validasi layar "Jam pulang wajib diisi untuk Hadir." tetap dari `rules.ts` |

Tanpa error halaman. `pnpm verify` dan `pnpm check:migrations` (17 berkas, nomor unik): exit 0.

Menu "Penggajian" di sidebar bersama masih `tersedia: false`; layar dibuka lewat `/penggajian/presensi`, `/penggajian/lembur`, dan `/penggajian/periode`.
