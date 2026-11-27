-- K10 (D-70): pendaftaran dokumen SPK, status/transisi, sumber jurnal,
-- serta RLS dan grant yang mengikuti MATRIKS_IZIN yang berlaku.
--
-- Tidak ada data produksi yang di-seed. Registry di bawah adalah data
-- konfigurasi core yang diwajibkan D-70; semua insert idempoten.

begin;

-- ---------------------------------------------------------------------------
-- 1. Jenis dokumen WO. core.buat_dokumen() akan membentuk nomor
--    WO/{TAHUN}/{BULAN}/{URUT} sesuai PR-002 AC-02.
-- ---------------------------------------------------------------------------

insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('WO', 'Perintah produksi (SPK)', 'DIRENCANAKAN', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('WO', 'DIRENCANAKAN', 1),
    ('WO', 'CEK_BAHAN', 2),
    ('WO', 'BAHAN_CUKUP', 3),
    ('WO', 'BAHAN_KURANG', 4),
    ('WO', 'MENUNGGU_PEMBELIAN', 5),
    ('WO', 'BAHAN_SIAP', 6),
    ('WO', 'BERJALAN', 7),
    ('WO', 'HASIL_DICATAT', 8),
    ('WO', 'QC_PASSED', 9),
    ('WO', 'REWORK', 10),
    ('WO', 'REJECTED', 11),
    ('WO', 'SELESAI', 12),
    ('WO', 'DIBATALKAN', 13)
on conflict (tipe, status) do nothing;

-- Transisi D-46 §5.3 / PR-002. Sebagian sudah didaftarkan 0007; insert
-- idempoten ini menyatakan daftar lengkap yang dipakai SPK tanpa mengubah
-- migrasi lama.
insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan)
values
    ('DIRENCANAKAN', 'CEK_BAHAN', 'CEK_BAHAN', false),
    ('CEK_BAHAN', 'BAHAN_CUKUP', 'CEK_BAHAN', false),
    ('CEK_BAHAN', 'BAHAN_KURANG', 'CEK_BAHAN', false),
    ('BAHAN_KURANG', 'MENUNGGU_PEMBELIAN', 'AJUKAN_PEMBELIAN', false),
    ('BAHAN_KURANG', 'DIBATALKAN', 'BATAL', true),
    ('MENUNGGU_PEMBELIAN', 'BAHAN_SIAP', 'TERIMA_BAHAN', false),
    ('BAHAN_CUKUP', 'BERJALAN', 'MULAI', false),
    ('BAHAN_SIAP', 'BERJALAN', 'MULAI', false),
    ('BERJALAN', 'HASIL_DICATAT', 'CATAT_HASIL', false),
    ('HASIL_DICATAT', 'QC_PASSED', 'QC', false),
    ('HASIL_DICATAT', 'REWORK', 'QC', false),
    ('HASIL_DICATAT', 'REJECTED', 'QC', false),
    ('REWORK', 'HASIL_DICATAT', 'CATAT_HASIL', false),
    ('QC_PASSED', 'SELESAI', 'SELESAI', false),
    ('DIRENCANAKAN', 'DIBATALKAN', 'BATAL', true),
    ('CEK_BAHAN', 'DIBATALKAN', 'BATAL', true),
    ('BAHAN_CUKUP', 'DIBATALKAN', 'BATAL', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Sumber jurnal produksi (D-07/D-43): dipakai saat event biaya dan
--    jurnal ditulis dalam satu transaksi.
-- ---------------------------------------------------------------------------

insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values
    ('PERINTAH_PRODUKSI', 'Pembebanan biaya perintah produksi', array['Accounting']),
    ('PEMAKAIAN_BAHAN', 'Pengeluaran dan pemakaian bahan produksi', array['Gudang', 'Produksi']),
    ('HASIL_PRODUKSI', 'Hasil dan keputusan QC produksi', array['Produksi', 'QC']),
    ('PENERIMAAN_BARANG_JADI', 'Penerimaan barang jadi', array['Gudang'])
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------------
-- 3. RLS dan grant untuk tabel produksi baru.
--    anon ditolak; authenticated hanya SELECT lewat policy peran MATRIKS_IZIN
--    (ditambah baris yang dibuatnya sendiri dalam sesi aktif). Penulisan
--    tetap lewat RPC SECURITY DEFINER. Grant service_role tidak diubah.
-- ---------------------------------------------------------------------------

-- BOM: lihat_bom = Produksi, Gudang, Purchasing, Manajemen, Accounting.
alter table public.bom enable row level security;
alter table public.bom_versi enable row level security;
alter table public.produk_komponen enable row level security;

revoke all on public.bom, public.bom_versi, public.produk_komponen from anon, authenticated;
grant select on public.bom, public.bom_versi, public.produk_komponen to authenticated;
grant all on public.bom, public.bom_versi, public.produk_komponen to service_role;

drop policy if exists "K10 BOM read per MATRIKS_IZIN" on public.bom;
create policy "K10 BOM read per MATRIKS_IZIN"
on public.bom for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Gudang', 'Purchasing', 'Manajemen', 'Accounting')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

drop policy if exists "K10 BOM versi read per MATRIKS_IZIN" on public.bom_versi;
create policy "K10 BOM versi read per MATRIKS_IZIN"
on public.bom_versi for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Gudang', 'Purchasing', 'Manajemen', 'Accounting')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

drop policy if exists "K10 komponen BOM read per MATRIKS_IZIN" on public.produk_komponen;
create policy "K10 komponen BOM read per MATRIKS_IZIN"
on public.produk_komponen for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Gudang', 'Purchasing', 'Manajemen', 'Accounting')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

-- SPK: lihat_perintah_produksi = Produksi, Gudang, QC, Purchasing,
-- Manajemen, Accounting.
alter table public.perintah_produksi enable row level security;

revoke all on public.perintah_produksi from anon, authenticated;
grant select on public.perintah_produksi to authenticated;
grant all on public.perintah_produksi to service_role;

drop policy if exists "K10 SPK read per MATRIKS_IZIN" on public.perintah_produksi;
create policy "K10 SPK read per MATRIKS_IZIN"
on public.perintah_produksi for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Gudang', 'QC', 'Purchasing', 'Manajemen', 'Accounting')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

-- Hasil/QC: lihat_laporan_hasil_produksi = Produksi, Accounting, Manajemen.
alter table public.hasil_produksi enable row level security;
alter table public.quality_check enable row level security;

revoke all on public.hasil_produksi, public.quality_check from anon, authenticated;
grant select on public.hasil_produksi, public.quality_check to authenticated;
grant all on public.hasil_produksi, public.quality_check to service_role;

drop policy if exists "K10 hasil produksi read per MATRIKS_IZIN" on public.hasil_produksi;
create policy "K10 hasil produksi read per MATRIKS_IZIN"
on public.hasil_produksi for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

drop policy if exists "K10 QC read per MATRIKS_IZIN" on public.quality_check;
create policy "K10 QC read per MATRIKS_IZIN"
on public.quality_check for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

-- Kartu jam kerja: lihat_kartu_jam_kerja = Produksi, Accounting, Manajemen.
alter table public.kartu_jam_kerja enable row level security;

revoke all on public.kartu_jam_kerja from anon, authenticated;
grant select on public.kartu_jam_kerja to authenticated;
grant all on public.kartu_jam_kerja to service_role;

drop policy if exists "K10 kartu jam kerja read per MATRIKS_IZIN" on public.kartu_jam_kerja;
create policy "K10 kartu jam kerja read per MATRIKS_IZIN"
on public.kartu_jam_kerja for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

-- Bahan/WIP: lihat_laporan_saldo_wip = Produksi, Accounting, Manajemen.
-- Gudang mencatat lewat RPC; baris yang dibuatnya tetap terbaca via skrip
-- created_by di bawah (sesuai pola own-row 0017).
alter table public.pengeluaran_bahan enable row level security;
alter table public.pemakaian_bahan enable row level security;

revoke all on public.pengeluaran_bahan, public.pemakaian_bahan from anon, authenticated;
grant select on public.pengeluaran_bahan, public.pemakaian_bahan to authenticated;
grant all on public.pengeluaran_bahan, public.pemakaian_bahan to service_role;

drop policy if exists "K10 pengeluaran bahan read per MATRIKS_IZIN" on public.pengeluaran_bahan;
create policy "K10 pengeluaran bahan read per MATRIKS_IZIN"
on public.pengeluaran_bahan for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

drop policy if exists "K10 pemakaian bahan read per MATRIKS_IZIN" on public.pemakaian_bahan;
create policy "K10 pemakaian bahan read per MATRIKS_IZIN"
on public.pemakaian_bahan for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

-- Biaya/HPP: lihat_hpp_perintah_produksi = Produksi, Accounting, Manajemen.
alter table public.tarif_overhead enable row level security;
alter table public.overhead_aktual enable row level security;
alter table public.biaya_produksi_event enable row level security;

revoke all on public.tarif_overhead, public.overhead_aktual, public.biaya_produksi_event
    from anon, authenticated;
grant select on public.tarif_overhead, public.overhead_aktual, public.biaya_produksi_event
    to authenticated;
grant all on public.tarif_overhead, public.overhead_aktual, public.biaya_produksi_event
    to service_role;

drop policy if exists "K10 tarif overhead read per MATRIKS_IZIN" on public.tarif_overhead;
create policy "K10 tarif overhead read per MATRIKS_IZIN"
on public.tarif_overhead for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

drop policy if exists "K10 overhead aktual read per MATRIKS_IZIN" on public.overhead_aktual;
create policy "K10 overhead aktual read per MATRIKS_IZIN"
on public.overhead_aktual for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

drop policy if exists "K10 event biaya read per MATRIKS_IZIN" on public.biaya_produksi_event;
create policy "K10 event biaya read per MATRIKS_IZIN"
on public.biaya_produksi_event for select to authenticated
using (
    ((select public.current_peran()) in ('Produksi', 'Accounting', 'Manajemen')
        and public.is_session_current())
    or (created_by = (select auth.uid()) and public.is_session_current())
);

-- ---------------------------------------------------------------------------
-- 4. Perluasan visibility dokumen inti untuk tipe WO. Policy 0018 tetap
--    berlaku untuk pengadaan; policy ini hanya menambah SPK. Riwayat status
--    mewarisi aturan yang sama lewat EXISTS ke `dokumen`.
-- ---------------------------------------------------------------------------

revoke all on public.dokumen, public.riwayat_status from anon;

drop policy if exists "K10 SPK dokumen read per MATRIKS_IZIN" on public.dokumen;
create policy "K10 SPK dokumen read per MATRIKS_IZIN"
on public.dokumen for select to authenticated
using (
    tipe = 'WO'
    and (select public.current_peran()) in ('Produksi', 'Gudang', 'QC', 'Purchasing', 'Manajemen', 'Accounting')
);

drop policy if exists "K10 SPK riwayat read per MATRIKS_IZIN" on public.riwayat_status;
create policy "K10 SPK riwayat read per MATRIKS_IZIN"
on public.riwayat_status for select to authenticated
using (
    exists (
        select 1 from public.dokumen d
        where d.id = riwayat_status.dokumen_id
          and d.tipe = 'WO'
          and (select public.current_peran()) in ('Produksi', 'Gudang', 'QC', 'Purchasing', 'Manajemen', 'Accounting')
    )
);

commit;
