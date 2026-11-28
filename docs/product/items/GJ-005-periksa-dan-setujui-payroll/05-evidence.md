# GJ-005 — Bukti Verifikasi

Tanggal: 2026-11-27. Branch `gj-005-periksa-dan-setujui-payroll`, ditumpuk di atas `gj-004-hitung-payroll` (#46). Supabase lokal (`pnpm db:reset` + `pnpm db:seed:local`), dev server, Chromium headless lebar 1440.

Migrasi `0020_gj005_periksa_setujui_payroll.sql` (nomor menunggu persetujuan tech lead, `D-09`) tidak menambah tabel. Status tetap di dokumen `PERIODE_GAJI`, lewat fungsi core dokumen:

- `periksa_payroll` (Accounting) → `periksa_dokumen`, yang menyalin aturan approval Direksi level 1 (seed 0010) ke dokumen.
- `setujui_payroll` (Direksi) → `setujui_dokumen`, yang memeriksa peran per level lalu mengunci di level terakhir; ditolak bila bulan akuntansi akhir periode sudah `kunci` (AC-08).
- `kembalikan_payroll` (Accounting atau Direksi) → `DIPERIKSA → REVISI` dengan alasan wajib.
- Ketiganya menolak penghitung draft (`draft_payroll.created_by`, D-48). Tidak ada fungsi buka kunci.

Juga di branch ini: status periode di tipe dan label layar kini mencakup status payroll (`DRAFT_TERHITUNG` … `DIPOSTING`), dan layar rekap memakai `sudahTervalidasi()` sehingga periode yang sudah masuk payroll tetap terbaca tervalidasi. Celah ini muncul sejak GJ-004.

## Uji database

16/16 lolos, termasuk AC-08: bulan 10/2026 dikunci → "Persetujuan ditolak: periode akuntansi 10/2026 sudah ditutup."; setelah dibuka, persetujuan diterima.

## Uji layar

| AC | Hasil | Bukti |
|---|---|---|
| AC-01 | Lolos | Accounting "Verifikasi & teruskan" → Diperiksa Accounting |
| AC-02 | Sebagian | Direksi "Setujui payroll" → Disetujui Direksi dan dikunci. **Jurnal akrual belum diposting**: COA belum punya akun utang BPJS, utang PPh 21, dan selisih pembulatan; nomor akunnya keputusan Accounting |
| AC-03 | Lolos | Sebelum diperiksa, Direksi hanya melihat "Menunggu pemeriksaan Accounting"; DB menolak "Persetujuan ditolak: pemeriksaan Accounting belum dilakukan." |
| AC-04, AC-12 | Lolos | Setelah disetujui, HR tidak punya tombol hitung ulang; DB menolak hitung ulang, koreksi, dan pengembalian "Draft sudah disetujui dan dikunci." |
| AC-05 | Lolos (DB) | Finance memeriksa → "Anda tidak punya izin untuk tindakan ini." |
| AC-06 | Lolos | Accounting mengembalikan dengan alasan; HR melihat alasan dan menghitung ulang (`REVISI → DRAFT_TERHITUNG`) |
| AC-07 | Lolos | Draft terkunci tidak dihitung ulang, sehingga perubahan tarif tidak mengubahnya |
| AC-08 | Lolos (DB) | Lihat uji database |
| AC-09 | Lolos (DB) | `gj005_siapkan` menolak `auth.uid()` = penghitung draft |
| AC-10 | Lolos | Direksi mengembalikan dengan alasan "Lembur Agus perlu dicek ulang" |
| AC-11 | Lolos | Riwayat draft memuat catatan periksa, pengembalian, dan persetujuan |

Tanpa error halaman. `pnpm verify` dan `pnpm check:migrations` (20 berkas, nomor unik): exit 0.
