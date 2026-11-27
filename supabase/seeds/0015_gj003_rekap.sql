-- GJ-003: penugasan Supervisor Lapangan dan presensi November (menunggu validasi)
-- agar periode November bisa direkap dan divalidasi.
-- Seed hanya punya satu akun Supervisor, jadi ia memegang keempat departemen;
-- setiap departemen tetap divalidasi sendiri (Q-05).

update public.departemen
set supervisor_id = 'f0080000-0000-4000-8100-000000000012'
where id::text like 'f0160000-0000-4000-8100-%';

do $$
declare
    v_sistem constant uuid := 'f0080000-0000-4000-8100-000000000009';
    v_dok jsonb;
    v_k record;
    v_tgl date;
begin
    for v_k in select id from public.karyawan where id::text like 'f0160000-0000-4000-8300-%' loop
        for v_tgl in
            select d::date from generate_series(date '2026-10-21', date '2026-11-20', interval '1 day') d
            where extract(isodow from d) < 6
        loop
            v_dok := public.buat_dokumen('PRESENSI', v_sistem, null, v_tgl);
            insert into public.presensi (dokumen_id, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, sumber)
            values ((v_dok -> 'dokumen' ->> 'id')::uuid, v_k.id, v_tgl, 'HADIR', '08:00', '17:00', 'IMPOR');
        end loop;
    end loop;
end;
$$;
