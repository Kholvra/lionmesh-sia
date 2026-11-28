-- GJ-001: master departemen, jabatan, kategori PTKP, dan empat karyawan contoh.
-- Nilai PTKP mengikuti kategori D-19; departemen dan jabatan adalah data contoh
-- (Q-DDL-02 di 06-ddl-proposal.sql). Aktor riwayat = akun uji HR (seed 0009).

insert into public.departemen (id, kode, nama) values
    ('f0160000-0000-4000-8100-000000000001', 'PRODUKSI', 'Produksi'),
    ('f0160000-0000-4000-8100-000000000002', 'ADMINISTRASI', 'Administrasi'),
    ('f0160000-0000-4000-8100-000000000003', 'PENJUALAN', 'Penjualan'),
    ('f0160000-0000-4000-8100-000000000004', 'GUDANG', 'Gudang');

insert into public.jabatan (id, kode, nama) values
    ('f0160000-0000-4000-8200-000000000001', 'OPERATOR', 'Operator'),
    ('f0160000-0000-4000-8200-000000000002', 'OPERATOR_SENIOR', 'Operator senior'),
    ('f0160000-0000-4000-8200-000000000003', 'STAF_ADMINISTRASI', 'Staf administrasi'),
    ('f0160000-0000-4000-8200-000000000004', 'STAF_PENJUALAN', 'Staf penjualan'),
    ('f0160000-0000-4000-8200-000000000005', 'STAF_GUDANG', 'Staf gudang');

insert into public.kategori_ptkp (kode, nama) values
    ('TK/0', 'Tidak kawin, tanpa tanggungan'),
    ('TK/1', 'Tidak kawin, 1 tanggungan'),
    ('TK/2', 'Tidak kawin, 2 tanggungan'),
    ('TK/3', 'Tidak kawin, 3 tanggungan'),
    ('K/0', 'Kawin, tanpa tanggungan'),
    ('K/1', 'Kawin, 1 tanggungan'),
    ('K/2', 'Kawin, 2 tanggungan'),
    ('K/3', 'Kawin, 3 tanggungan');

insert into public.karyawan (
    id, nik, nama, departemen_id, jabatan_id, kategori_ptkp_id, tipe, tanggal_masuk,
    rekening_nama_bank, rekening_nomor, rekening_nama_pemilik, created_by, updated_by
)
select v.id::uuid, v.nik, v.nama, v.dep::uuid, v.jab::uuid, p.id, v.tipe, date '2024-03-04',
       v.bank, v.rek, v.nama,
       'f0080000-0000-4000-8100-000000000011', 'f0080000-0000-4000-8100-000000000011'
from (values
    ('f0160000-0000-4000-8300-000000000001', '3216051290010001', 'Agus', 'f0160000-0000-4000-8100-000000000001', 'f0160000-0000-4000-8200-000000000001', 'PRODUKSI', 'K/1', 'BCA', '7720551101'),
    ('f0160000-0000-4000-8300-000000000002', '3216051290010002', 'Siti', 'f0160000-0000-4000-8100-000000000001', 'f0160000-0000-4000-8200-000000000001', 'PRODUKSI', 'TK/0', 'BRI', '7720551102'),
    ('f0160000-0000-4000-8300-000000000003', '3216051290010003', 'Rina', 'f0160000-0000-4000-8100-000000000002', 'f0160000-0000-4000-8200-000000000003', 'NON_PRODUKSI', 'K/0', 'Mandiri', '7720551103'),
    ('f0160000-0000-4000-8300-000000000004', '3216051290010004', 'Doni', 'f0160000-0000-4000-8100-000000000003', 'f0160000-0000-4000-8200-000000000004', 'NON_PRODUKSI', 'TK/1', 'BNI', '7720551104')
) as v(id, nik, nama, dep, jab, tipe, ptkp, bank, rek)
join public.kategori_ptkp p on p.kode = v.ptkp;

insert into public.gaji_pokok_histori (karyawan_id, nominal, tanggal_berlaku, created_by, updated_by)
select v.k::uuid, v.n, v.t::date, 'f0080000-0000-4000-8100-000000000011', 'f0080000-0000-4000-8100-000000000011'
from (values
    ('f0160000-0000-4000-8300-000000000001', 2350000, '2025-01-01'),
    ('f0160000-0000-4000-8300-000000000001', 2500000, '2026-01-01'),
    ('f0160000-0000-4000-8300-000000000001', 2650000, '2027-01-01'),
    ('f0160000-0000-4000-8300-000000000002', 2400000, '2026-01-01'),
    ('f0160000-0000-4000-8300-000000000003', 3100000, '2026-01-01'),
    ('f0160000-0000-4000-8300-000000000004', 3000000, '2026-01-01')
) as v(k, n, t);

insert into public.karyawan_riwayat_status (karyawan_id, aksi, status_lama, status_baru, actor_id)
select id, 'BUAT', null, 'AKTIF', 'f0080000-0000-4000-8100-000000000011'
from public.karyawan
where id::text like 'f0160000-0000-4000-8300-%';
