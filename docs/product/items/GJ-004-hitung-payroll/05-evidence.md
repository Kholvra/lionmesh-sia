# GJ-004 — Bukti Verifikasi

Tanggal: 2026-11-27. Branch `gj-004-hitung-payroll`, ditumpuk di atas `gj-003-rekap-dan-validasi-presensi` (#45). Supabase lokal (`pnpm db:reset` + `pnpm db:seed:local`), dev server, Chromium headless lebar 1440.

Draft disimpan di Supabase lewat migrasi `0019_gj004_draft_payroll.sql` (nomor menunggu persetujuan tech lead, `D-09`). Perhitungan berjalan di server aplikasi (`payroll/hitung.ts`, murni dan deterministik) dari view HR; `simpan_draft_payroll` menyimpan seluruh hasil dalam satu transaksi dan memindahkan status dokumen periode `TERVALIDASI → DRAFT_TERHITUNG`.

Keputusan yang diambil saat menulis migrasi:

- **Tabel tarif tetap konstanta berversi di kode** (`payroll/tarif.ts`, `tarif-ter.ts`), dengan sumber per versi. Usulan GJ-004 menaruhnya di tabel `tarif_ter`/`tarif_bpjs`/`tarif_lembur`; pemindahan ke database menunggu keputusan tech lead. Versi yang dipakai tetap tersimpan di setiap draft (`draft_payroll.versi_tarif`) dan di setiap komponen (AC-15).
- Status draft memakai status dokumen periode; tabel draft tidak menyimpan status.
- Akses (P-13): rincian komponen untuk HR dan Accounting (`komponen_gaji_aman`), gaji bersih per karyawan menambah Finance (`gaji_bersih`), ringkasan menambah Direksi (`ringkasan_payroll`).
- Uang lewat JSON sebagai teks (ISSUE-001 F13).

## Uji database

8/8 lolos: Accounting tidak bisa menyimpan draft atau mengoreksi komponen; koreksi tanpa alasan ditolak; Finance 0 baris komponen dan 4 baris gaji bersih; Direksi 0 baris gaji bersih dan 1 ringkasan; Karyawan 0; tabel dasar ditolak.

## Uji layar

| AC | Hasil | Bukti |
|---|---|---|
| AC-01, AC-06..AC-08, AC-15 | Lolos | HR menghitung Oktober 2026; rincian Agus menampilkan gaji pokok, tunjangan, lembur 120 menit (LEMBUR-HK-2021), BPJS (BPJS-2026-03), PPh 21 TER kategori B (TER-2024-01), dengan dasar hitung dan versi tarif per komponen |
| AC-02 | Lolos | Hitung ulang → neto dibayarkan sama, Rp 12.810.578 |
| AC-03 | Lolos | November belum Tervalidasi: layar menolak, `simpan_draft_payroll` juga menolak |
| AC-09 | Lolos | Koreksi tunjangan kehadiran dengan alasan tersimpan beserta pelaku dan waktu; tanpa alasan ditolak |
| AC-12 | Lolos | Pembulatan per komponen; selisih pembulatan Agus 0,03 tampil dan dijumlahkan di ringkasan |
| AC-14 | Lolos (DB) | Seluruh draft ditulis dalam satu fungsi; kegagalan membatalkan transaksi |
| AC-17 | Lolos | Accounting melihat rincian; Finance hanya gaji bersih; Direksi hanya ringkasan tanpa nama |
| AC-04, AC-05, AC-10, AC-11, AC-13 | Logika ada, belum diuji otomatis di sini | Jalur di `hitung.ts` (tarif hilang, versi tarif, karyawan tanpa presensi tervalidasi, prorata, masa pajak terakhir) tidak berubah dari prototipe; data seed tidak memicunya |
| AC-16 | Milik GJ-005 | Pengembalian oleh Accounting/Direksi ada di GJ-005; `simpan_draft_payroll` sudah menerima status `REVISI` |

Tanpa error halaman. `pnpm verify` dan `pnpm check:migrations` (19 berkas, nomor unik): exit 0.
