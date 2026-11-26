-- C-011: master mata uang. Transaksi dan jurnal tetap IDR (D-38); baris ini
-- menjadi mata uang dasar yang dipakai dokumen. Kurs tidak di-seed karena
-- nilainya berubah setiap hari dan bukan data operasional.
insert into public.mata_uang (id, kode, nama, simbol)
values ('f0080000-0000-4000-8000-000000000003', 'IDR', 'Rupiah', 'Rp');
