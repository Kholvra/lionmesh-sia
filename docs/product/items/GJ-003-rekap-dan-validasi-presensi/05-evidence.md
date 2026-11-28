# GJ-003 — Bukti Verifikasi

Tanggal: 2026-11-27. Branch `gj-003-rekap-dan-validasi-presensi`, ditumpuk di atas `gj-002-presensi-dan-lembur` (#44). Supabase lokal (`pnpm db:reset` + `pnpm db:seed:local`), dev server, Chromium headless lebar 1440.

Data di Supabase lewat migrasi `0018_gj003_rekap_validasi.sql` (nomor menunggu persetujuan tech lead, `D-09`) dan seed `0015_gj003_rekap.sql`. Status periode tetap di core dokumen; validasi per departemen dan perbaikan lembur disimpan append-only dan tampil di riwayat.

Keputusan yang diambil saat menulis migrasi:

- `departemen.supervisor_id` (Q-01); seed menugaskan satu akun Supervisor ke keempat departemen, setiap departemen tetap divalidasi sendiri (Q-05).
- `periode_gaji.putaran_rekap` naik saat rekap dikembalikan atau dibuka ulang, sehingga validasi putaran lama tetap menjadi jejak.
- Presensi dan lembur satu departemen menjadi `TERVALIDASI` saat departemen itu divalidasi; periode menjadi `TERVALIDASI` setelah semua departemen yang punya karyawan aktif tervalidasi (AC-11).
- Supervisor membaca karyawan departemennya lewat `karyawan_rekap` tanpa NIK (GJ-001 AC-08).

## Uji database (supabase-js, login per peran)

24/24 lolos: Supervisor membaca 4 karyawan dan 92 presensi November tanpa NIK; Accounting 0 baris; Supervisor tidak bisa menyimpan rekap; HR tidak bisa memvalidasi; validasi ganda ditolak; pengembalian tanpa alasan ditolak; putaran naik ke 2 lalu 3; buka ulang tanpa otorisasi ditolak; Karyawan tidak bisa memperbaiki lembur; HR memperbaiki lembur dengan alasan.

## Uji layar

| AC | Hasil | Bukti |
|---|---|---|
| AC-01 | Lolos | HR → Rekap November → "Simpan rekap & tutup periode" → periode Rekap |
| AC-02 | Lolos | Supervisor → "Validasi rekap Produksi" → departemen Divalidasi |
| AC-03, AC-10 | Lolos | Supervisor mengembalikan Administrasi dengan alasan; HR melihat "Supervisor Lapangan mengembalikan rekap Administrasi: Rina cuti 5 Nov belum dicatat"; tanpa alasan ditolak (DB) |
| AC-04 | Lolos (DB) | HR memanggil `validasi_departemen` → "Anda tidak punya izin untuk tindakan ini." |
| AC-05 | Sebagian | Periode belum Tervalidasi tidak bisa direkap ulang atau divalidasi; penolakan hitung payroll dibuktikan di GJ-004 |
| AC-06 | Lolos | Periode Tervalidasi menolak entri baru (GJ-002) dan hanya bisa dibuka lewat otorisasi |
| AC-07 | Lolos | Manajemen memberi otorisasi; HR "Buka ulang ke Rekap" → periode Rekap, putaran naik, semua departemen validasi ulang |
| AC-08 | Lolos (DB) | `rekap_periode` menolak karyawan aktif tanpa entri dan Hadir tanpa jam pulang |
| AC-09 | Lolos (DB) | `validasi_departemen` menolak bila entri departemen dicatat oleh Supervisor itu sendiri |
| AC-11 | Lolos | Departemen Gudang tanpa karyawan tidak perlu divalidasi; periode Tervalidasi setelah tiga departemen |

Riwayat rekap menampilkan validasi per departemen, pengembalian beserta alasan, dan buka ulang dengan nama pemberi otorisasi. Accounting membuka rekap → "Rekap dibuka HR untuk seluruh karyawan dan Supervisor Lapangan untuk departemennya." Tanpa error halaman.

`pnpm verify` dan `pnpm check:migrations` (18 berkas, nomor unik): exit 0.
