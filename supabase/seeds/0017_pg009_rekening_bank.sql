-- PG-009: rekening bank placeholder. Nomor rekening ini BUKAN data nyata dan
-- harus diganti tech lead sebelum dipakai di produksi (lihat 05-evidence.md).

insert into public.rekening_bank (id, nama_bank, nomor, nama_pemilik, aktif)
values (
  'f0090000-0000-4000-8000-000000000001',
  'Bank Uji',
  '0000000000',
  'PT Lionmesh Prima Tbk',
  true
)
on conflict (nama_bank, nomor) do nothing;
