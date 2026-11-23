-- FND-006: COA dasar D-41 dan jenis sumber jurnal inti.

insert into public.akun (id, nomor, nama, peran) values
  ('f0060000-0000-4000-8000-000000000001', '102', 'Bank', 'kas_bank'),
  ('f0060000-0000-4000-8000-000000000002', '110', 'Piutang usaha', 'piutang_usaha'),
  ('f0060000-0000-4000-8000-000000000003', '120', 'Persediaan bahan baku', 'persediaan_bahan'),
  ('f0060000-0000-4000-8000-000000000004', '121', 'Barang dalam proses', 'barang_dalam_proses'),
  ('f0060000-0000-4000-8000-000000000005', '122', 'Persediaan barang jadi', 'persediaan_barang_jadi'),
  ('f0060000-0000-4000-8000-000000000006', '201', 'Utang usaha', 'utang_usaha'),
  ('f0060000-0000-4000-8000-000000000007', '202', 'Utang belum difakturkan', 'gr_ir'),
  ('f0060000-0000-4000-8000-000000000008', '210', 'Utang gaji', 'utang_gaji'),
  ('f0060000-0000-4000-8000-000000000009', '302', 'Laba ditahan', 'laba_ditahan'),
  ('f0060000-0000-4000-8000-000000000010', '401', 'Penjualan', 'penjualan'),
  ('f0060000-0000-4000-8000-000000000011', '501', 'Harga pokok penjualan', 'hpp'),
  ('f0060000-0000-4000-8000-000000000012', '601', 'Tenaga kerja langsung', 'tenaga_kerja_langsung'),
  ('f0060000-0000-4000-8000-000000000013', '602', 'Overhead pabrik', 'overhead_pabrik'),
  ('f0060000-0000-4000-8000-000000000014', '701', 'Beban gaji administrasi', 'beban_gaji_admin');

-- Reversal authorization belongs to the cancellation action in the calling module.
insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('PEMBALIKAN', 'Jurnal pembalik', null);
