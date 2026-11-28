# PG-010: bukti database dan tiga keputusan sementara

## Kondisi saat ini

PG-010 sudah diimplementasikan: impor CSV dengan pemetaan kolom (dan profil
tersimpan), pencocokan 1:1 dengan baris jurnal `kas_bank`, pasangan manual,
penandaan selisih, pelepasan pasangan, dan riwayat per mutasi. Migrasi `0035`
menambah konfigurasi, profil pemetaan, impor, mutasi, dan riwayat.

Seluruh AC database belum dijalankan karena tidak ada Docker/Supabase lokal.

## Keputusan yang perlu dikonfirmasi tech lead

1. **Rekening bank** diambil dari `rekening_bank` PG-009, sehingga branch ini
   ditumpuk di atas `pg-009-pembayaran-utang`.
2. **Tanpa dimensi rekening pada jurnal** (R-04 tidak sepenuhnya bisa
   ditegakkan). Pencocokan memakai semua baris akun 102.
3. **Jendela tanggal 3 hari** lewat seed `0018`, masih placeholder.

## Pekerjaan yang dibutuhkan

1. Nyalakan Supabase lokal, `pnpm db:reset`, `pnpm db:seed:local`.
2. Pastikan ada baris jurnal akun `kas_bank` (mis. dari pembayaran pemasok).
3. Jalankan AC-01 sampai AC-17 sebagai `accounting@lionmesh.test`; AC-16 juga
   mencoba `finance@lionmesh.test`.
4. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
5. Konfirmasi nomor migrasi `0035`, seed `0018`, dan jendela 3 hari.

## Dampak

Pencocokan, idempotensi impor, dan penolakan baris rusak belum terbukti di
database. Item ini juga prasyarat `INT-001`. Risiko utama: pencocokan salah
bila ada beberapa rekening dengan mutasi bernilai sama.
