-- PG-008: dua akun yang dibutuhkan pengakuan utang belum ada di seed FND-006.
-- Nomor ini PLACEHOLDER dan belum final; tech lead harus mengonfirmasi atau
-- menggantinya sebelum dipakai di produksi (lihat 05-evidence.md).

insert into public.akun (id, nomor, nama, peran) values
  ('f0060000-0000-4000-8000-000000000015', '113', 'PPN masukan', 'ppn_masukan'),
  ('f0060000-0000-4000-8000-000000000016', '603', 'Selisih harga pembelian', 'selisih_harga_pembelian')
on conflict (peran) do nothing;
