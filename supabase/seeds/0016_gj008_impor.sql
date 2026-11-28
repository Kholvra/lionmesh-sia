-- GJ-008: profil impor bawaan dan dua pemetaan ID mesin (Agus, Siti).
insert into public.profil_impor_presensi (
    pemisah, format_tanggal, kolom_id_mesin, kolom_tanggal, kolom_jam_masuk, kolom_jam_pulang, created_by
) values (';', 'DD/MM/YYYY', 'ID', 'Tanggal', 'Masuk', 'Pulang', 'f0080000-0000-4000-8100-000000000011');

insert into public.pemetaan_id_mesin (id_mesin, karyawan_id, created_by) values
    ('M-001', 'f0160000-0000-4000-8300-000000000001', 'f0080000-0000-4000-8100-000000000011'),
    ('M-002', 'f0160000-0000-4000-8300-000000000002', 'f0080000-0000-4000-8100-000000000011');
