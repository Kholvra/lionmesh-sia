# GJ-008 — Bukti Verifikasi

Tanggal: 2026-11-27. Branch `gj-008-impor-presensi-mesin`, ditumpuk di atas `gj-002-presensi-dan-lembur` (#44) saja, karena item ini hanya bergantung pada GJ-002. Supabase lokal (`pnpm db:reset` + `pnpm db:seed:local`), dev server, Chromium headless lebar 1440.

Migrasi `0022_gj008_impor_presensi.sql` (nomor menunggu persetujuan tech lead, `D-09`; `0018`–`0021` dipakai GJ-003..GJ-006 di branch lain) dan seed `0016_gj008_impor.sql`:

- `profil_impor_presensi` (satu profil aktif; versi lama tetap tersimpan), `pemetaan_id_mesin` (satu ID mesin untuk satu karyawan aktif), `impor_presensi` (SHA-256 unik, ringkasan dan baris dilewati), `presensi.impor_presensi_id`.
- Parsing dan validasi format tetap di `impor/parse.ts` (murni); `impor_presensi_mesin` menggolongkan baris (tidak terpetakan, nonaktif, di luar periode, bentrok, ganda dalam berkas), menyimpan presensi bersumber `IMPOR`, dan mencatat hasil dalam satu transaksi.
- Semua tabel hanya dibaca HR lewat view; tulis lewat fungsi dengan guard HR.

## Uji

- Unit `impor/parse.test.ts`: 4/4 (AC-01, AC-02, AC-04, AC-12). `parse.ts` kini mengimpor `waktu.ts` secara relatif agar bisa diuji dengan `node --test`.
- Database: 12/12 (Accounting ditolak; periode tertutup ditolak; berkas kosong ditolak; 2 tersimpan dan 3 dilewati termasuk baris ganda dalam berkas; berkas identik ditolak; bentrok dengan presensi yang ada dilewati; ID ganda ditolak; pemetaan baru; profil diubah tanpa kode; Accounting tidak membaca hasil; presensi impor bersumber `IMPOR`).

| AC | Hasil | Bukti layar |
|---|---|---|
| AC-01, AC-14 | Lolos | Impor `mesin.csv` ke November → halaman hasil: 2 tersimpan, `M-009` dilewati "belum dipetakan ke NIK" |
| AC-02, AC-12 | Lolos (unit + DB) | Format tidak sesuai profil dan berkas kosong ditolak sebelum simpan |
| AC-03 | Lolos | ID tanpa pemetaan dilewati dengan alasan, tidak disimpan |
| AC-04 | Lolos | Berkas dengan tanggal `31/13/2026` → "Baris 3 rusak … Seluruh berkas ditolak" |
| AC-05 | Lolos | Unggah ulang berkas yang sama → "sudah pernah diimpor" |
| AC-06, AC-13 | Lolos (DB) | Bentrok dan karyawan nonaktif dilewati, presensi lama tidak diubah |
| AC-07 | Lolos (DB) | Periode Oktober → "Impor ditolak: periode Oktober 2026 tertutup." |
| AC-08 | Lolos | Accounting tidak mendapat form impor; fungsi DB menolak |
| AC-09, AC-10 | Lolos | `M-001` ganda ditolak; `M-009` dipetakan ke karyawan aktif |
| AC-11 | Lolos (DB) | Profil diganti ke koma/`YYYY-MM-DD`/`UserID` tanpa perubahan kode |

Tautan kembali di layar impor kini ke `/penggajian/presensi` (layar rekap milik GJ-003 belum ada di branch ini). Tanpa error halaman. `pnpm verify` (113 tes) dan `pnpm check:migrations` (18 berkas, nomor unik): exit 0.
