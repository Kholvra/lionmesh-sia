-- PG-005: daftarkan jenis dokumen PURCHASE_ORDER supaya core bisa memberi
-- nomor, status, dan riwayat PO. Tidak ada approval: Purchasing menerbitkan.

select public.daftarkan_jenis_dokumen(
  'PURCHASE_ORDER',
  'Purchase order',
  'DITERBITKAN',
  array[
    'DITERBITKAN', 'DITERIMA_SEBAGIAN', 'DITERIMA', 'DIBATALKAN'
  ],
  false,
  null,
  'f0080000-0000-4000-8100-000000000009'::uuid
);

update public.jenis_dokumen
set created_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    created_at = '2026-01-01 00:00:00+00'::timestamptz,
    updated_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    updated_at = '2026-01-01 00:00:00+00'::timestamptz
where tipe = 'PURCHASE_ORDER';

update public.jenis_dokumen_status
set created_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    created_at = '2026-01-01 00:00:00+00'::timestamptz,
    updated_by = 'f0080000-0000-4000-8100-000000000009'::uuid,
    updated_at = '2026-01-01 00:00:00+00'::timestamptz
where tipe = 'PURCHASE_ORDER';
