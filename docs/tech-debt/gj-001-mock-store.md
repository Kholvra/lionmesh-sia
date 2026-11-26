# GJ-001: mock store karyawan menunggu migrasi 0016

## Kondisi saat ini

GJ-001 di-merge (PR #38) dengan layar karyawan berjalan di atas store in-memory
(`src/modules/penggajian/karyawan/store.ts`). Tabel `departemen`, `jabatan`,
`kategori_ptkp`, `karyawan`, `gaji_pokok_histori`, dan `karyawan_riwayat_status`
belum ada; usulan DDL sudah diuji rollback dan menunggu nomor.

Keputusan tech lead 2026-11-27 (`D-09`): migrasi karyawan memakai nomor **`0016`**.
Nomor ini dicadangkan; migrasi berikutnya memakai `0017` ke atas.

## Pekerjaan yang dibutuhkan

1. Tulis `supabase/migrations/0016_<nama>.sql` dari
   `docs/product/items/GJ-001-karyawan-gaji-pokok-ptkp/06-ddl-proposal.sql`
   (tabel milik core, `D-31`).
2. Ganti `store.ts` dengan Supabase di `queries.ts` dan `actions.ts` saja;
   kontrak branch: layar tidak ikut berubah.
3. Buktikan ulang AC yang bergantung database dan perbarui `05-evidence.md`.
4. Hapus `store.ts` dan file ini setelah bukti baru lolos.

## Dampak

Layar menampilkan data contoh: hilang tiap restart, RLS dan view per peran
belum terbukti, dan item presensi/payroll (`GJ-002`+) belum punya tabel nyata
untuk ditulis.
