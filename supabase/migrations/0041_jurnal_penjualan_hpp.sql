-- Migrasi 0018: Daftarkan sumber jurnal PENGIRIMAN dan kolom jurnal_hpp_id di tabel pengiriman (PD-008)

insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('PENGIRIMAN', 'Surat Jalan / Pengiriman Barang', array['Gudang', 'Accounting', 'Penjualan'])
on conflict (kode) do nothing;

alter table public.pengiriman
add column if not exists jurnal_hpp_id uuid references public.jurnal (id);
