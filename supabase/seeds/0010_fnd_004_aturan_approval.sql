-- Placeholder approval data from D-37 and D-51(c). Thresholds and final type
-- codes are not final business decisions.

select public.daftarkan_jenis_dokumen(
  'PERMINTAAN_PEMBELIAN',
  'Permintaan pembelian',
  'DIAJUKAN',
  array[
    'DIAJUKAN', 'REVISI', 'MENUNGGU_PERSETUJUAN', 'DISETUJUI',
    'DITOLAK', 'DIBATALKAN', 'PEMASOK_DITETAPKAN', 'DITERBITKAN'
  ],
  true,
  'MENUNGGU_PERSETUJUAN',
  'f0080000-0000-4000-8100-000000000009'::uuid
);

select public.daftarkan_jenis_dokumen(
  'PERIODE_GAJI',
  'Periode gaji',
  'TERBUKA',
  array[
    'TERBUKA', 'REKAP', 'TERVALIDASI', 'DRAFT_TERHITUNG', 'DIPERIKSA',
    'REVISI', 'DISETUJUI', 'DIBAYAR', 'GAGAL_TRANSFER', 'DIPOSTING',
    'DIBATALKAN'
  ],
  true,
  'DIPERIKSA',
  'f0080000-0000-4000-8100-000000000009'::uuid
);

insert into public.aturan_approval (
  id, tipe, level, peran, batas_bawah, batas_atas, aktif,
  created_by, created_at, updated_by, updated_at
) values
  (
    'f0040000-0000-4000-8000-000000000001',
    'PERMINTAAN_PEMBELIAN',
    1,
    'Manajemen',
    0,
    null,
    true,
    'f0080000-0000-4000-8100-000000000009'::uuid,
    '2026-01-01 00:00:00+00'::timestamptz,
    'f0080000-0000-4000-8100-000000000009'::uuid,
    '2026-01-01 00:00:00+00'::timestamptz
  ),
  (
    'f0040000-0000-4000-8000-000000000002',
    'PERIODE_GAJI',
    1,
    'Direksi',
    0,
    null,
    true,
    'f0080000-0000-4000-8100-000000000009'::uuid,
    '2026-01-01 00:00:00+00'::timestamptz,
    'f0080000-0000-4000-8100-000000000009'::uuid,
    '2026-01-01 00:00:00+00'::timestamptz
  );

-- Pembayaran pemasok intentionally has no approval rule (D-51(c)).

update public.jenis_dokumen
set created_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    created_at = '2026-01-01 00:00:00+00'::timestamptz,
    updated_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    updated_at = '2026-01-01 00:00:00+00'::timestamptz
where tipe in ('PERMINTAAN_PEMBELIAN', 'PERIODE_GAJI');

update public.jenis_dokumen_status
set created_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    created_at = '2026-01-01 00:00:00+00'::timestamptz,
    updated_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    updated_at = '2026-01-01 00:00:00+00'::timestamptz
where tipe in ('PERMINTAAN_PEMBELIAN', 'PERIODE_GAJI');
