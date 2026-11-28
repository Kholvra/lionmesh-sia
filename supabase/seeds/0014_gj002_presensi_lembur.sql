-- GJ-002: jenis dokumen presensi dan lembur, tautan akun Karyawan, tiga periode
-- gaji, batas lembur, presensi Oktober (tervalidasi), dan tiga pengajuan lembur.
-- Aktor: Manajemen (sistem, pola seed 0010), HR, Supervisor, dan akun Karyawan.

select public.daftarkan_jenis_dokumen(
    'PRESENSI', 'Presensi harian', 'MENUNGGU_VALIDASI_SUPERVISOR',
    array['MENUNGGU_VALIDASI_SUPERVISOR', 'TERVALIDASI', 'DIBATALKAN'],
    false, null, 'f0080000-0000-4000-8100-000000000009'::uuid
);

select public.daftarkan_jenis_dokumen(
    'LEMBUR', 'Pengajuan lembur (SPL)', 'MENUNGGU_VALIDASI_SUPERVISOR',
    array['MENUNGGU_VALIDASI_SUPERVISOR', 'TERVALIDASI', 'DIBATALKAN'],
    false, null, 'f0080000-0000-4000-8100-000000000009'::uuid
);

-- Akun karyawan@lionmesh.test = Agus (D-53).
update public.profiles
set karyawan_id = 'f0160000-0000-4000-8300-000000000001'
where id = 'f0080000-0000-4000-8100-000000000013';

-- Batas lembur 4 jam per hari (PP 35/2021 Pasal 26 ayat 1).
insert into public.batas_lembur (berlaku_mulai, menit_per_hari, sumber)
values ('2021-02-02', 240, 'PP 35/2021 Pasal 26 ayat (1)');

do $$
declare
    v_sistem constant uuid := 'f0080000-0000-4000-8100-000000000009';
    v_hr constant uuid := 'f0080000-0000-4000-8100-000000000011';
    v_supervisor constant uuid := 'f0080000-0000-4000-8100-000000000012';
    v_karyawan constant uuid := 'f0080000-0000-4000-8100-000000000013';
    v_agus constant uuid := 'f0160000-0000-4000-8300-000000000001';
    v_dok jsonb;
    v_dok_id uuid;
    v_periode record;
    v_k record;
    v_tgl date;
    v_lembur record;
begin
    -- Periode 21 s.d. 20; Oktober sudah direkap dan divalidasi.
    for v_periode in
        select * from (values
            ('2026-10', 'Oktober 2026', date '2026-09-21', date '2026-10-20', 'TERVALIDASI'),
            ('2026-11', 'November 2026', date '2026-10-21', date '2026-11-20', 'TERBUKA'),
            ('2026-12', 'Desember 2026', date '2026-11-21', date '2026-12-20', 'TERBUKA')
        ) as t(kode, nama, mulai, selesai, status)
    loop
        v_dok := public.buat_dokumen('PERIODE_GAJI', v_sistem, null, v_periode.mulai);
        v_dok_id := (v_dok -> 'dokumen' ->> 'id')::uuid;
        insert into public.periode_gaji (dokumen_id, kode, nama, tanggal_mulai, tanggal_selesai, created_by, updated_by)
        values (v_dok_id, v_periode.kode, v_periode.nama, v_periode.mulai, v_periode.selesai, v_sistem, v_sistem);
        if v_periode.status = 'TERVALIDASI' then
            perform public.pindah_status_dokumen(v_dok_id, 0, 'REKAP', 'REKAP', v_hr);
            perform public.pindah_status_dokumen(v_dok_id, 1, 'TERVALIDASI', 'VALIDASI', v_supervisor);
        end if;
    end loop;

    -- Presensi Oktober dari mesin absensi: hari kerja, 08.00 s.d. 17.00, tervalidasi.
    for v_k in select id from public.karyawan where id::text like 'f0160000-0000-4000-8300-%' loop
        for v_tgl in
            select d::date from generate_series(date '2026-09-21', date '2026-10-20', interval '1 day') d
            where extract(isodow from d) < 6
        loop
            v_dok := public.buat_dokumen('PRESENSI', v_sistem, null, v_tgl);
            v_dok_id := (v_dok -> 'dokumen' ->> 'id')::uuid;
            insert into public.presensi (dokumen_id, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, sumber)
            values (v_dok_id, v_k.id, v_tgl, 'HADIR', '08:00', '17:00', 'IMPOR');
            perform public.pindah_status_dokumen(v_dok_id, 0, 'TERVALIDASI', 'VALIDASI', v_supervisor);
        end loop;
    end loop;

    -- Pengajuan lembur Agus: tervalidasi, dibatalkan, dan menunggu.
    for v_lembur in
        select * from (values
            (date '2026-10-14', 120, 'SPL/PRD/X/087', 'TERVALIDASI', null),
            (date '2026-11-12', 60, 'SPL/PRD/XI/012', 'DIBATALKAN', 'SPL salah tanggal; lembur dilaksanakan 13 November.'),
            (date '2026-11-19', 120, 'SPL/PRD/XI/019', 'MENUNGGU_VALIDASI_SUPERVISOR', null)
        ) as t(tanggal, menit, spl, status, alasan)
    loop
        v_dok := public.buat_dokumen('LEMBUR', v_karyawan, null, v_lembur.tanggal);
        v_dok_id := (v_dok -> 'dokumen' ->> 'id')::uuid;
        insert into public.lembur (dokumen_id, karyawan_id, tanggal, menit, nomor_spl, keterangan, sumber, created_by, updated_by)
        values (v_dok_id, v_agus, v_lembur.tanggal, v_lembur.menit, v_lembur.spl,
                'Menyiapkan hasil wiremesh untuk pemeriksaan QC', 'MANDIRI', v_karyawan, v_karyawan);
        if v_lembur.status = 'TERVALIDASI' then
            perform public.pindah_status_dokumen(v_dok_id, 0, 'TERVALIDASI', 'VALIDASI', v_supervisor);
        elsif v_lembur.status = 'DIBATALKAN' then
            perform public.pindah_status_dokumen(v_dok_id, 0, 'DIBATALKAN', 'BATAL', v_karyawan, v_lembur.alasan);
        end if;
    end loop;
end;
$$;
