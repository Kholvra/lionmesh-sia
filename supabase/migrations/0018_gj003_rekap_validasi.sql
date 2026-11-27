-- GJ-003: rekap presensi dan lembur oleh HR, validasi per departemen oleh
-- Supervisor Lapangan, pengembalian rekap, buka ulang periode tervalidasi, dan
-- perbaikan lembur oleh HR. Disusun dari usulan GJ-003 (06-ddl-proposal.sql).
-- Nomor 0018 menunggu persetujuan tech lead (D-09). Pola akses mengikuti 0017.
--   PERIODE_GAJI  TERBUKA -REKAP-> REKAP -VALIDASI-> TERVALIDASI
--                 REKAP -REVISI-> TERBUKA (dikembalikan Supervisor, alasan wajib)
--                 TERVALIDASI -REVISI-> REKAP (buka ulang dengan otorisasi Manajemen)

-- Putaran rekap naik setiap rekap dikembalikan atau dibuka ulang, sehingga
-- validasi putaran lama tetap menjadi jejak (Q-05).
alter table public.periode_gaji
    add column putaran_rekap integer not null default 1,
    add constraint ck_periode_gaji_putaran check (putaran_rekap > 0);

-- Penugasan Supervisor Lapangan per departemen (Q-01). Relasi data, jadi FK ke profiles.
alter table public.departemen add column supervisor_id uuid;
alter table public.departemen
    add constraint fk_departemen_supervisor foreign key (supervisor_id) references public.profiles (id);
create index idx_departemen_supervisor_id on public.departemen (supervisor_id);

create table public.validasi_departemen_periode (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    departemen_id uuid not null references public.departemen (id),
    putaran_rekap integer not null,
    created_by uuid not null,                    -- Supervisor Lapangan yang memvalidasi
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_validasi_departemen_putaran unique (periode_gaji_id, departemen_id, putaran_rekap),
    constraint ck_validasi_departemen_putaran check (putaran_rekap > 0)
);

create index idx_validasi_departemen_departemen on public.validasi_departemen_periode (departemen_id);

-- Perbaikan lembur oleh HR selama periode terbuka (D-48): nilai lama tetap terbaca.
create table public.lembur_perbaikan (
    id uuid primary key default gen_random_uuid(),
    lembur_id uuid not null references public.lembur (id),
    alasan text not null,
    menit_lama integer not null,
    nomor_spl_lama text not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_lembur_perbaikan_alasan check (length(btrim(alasan)) > 0)
);

create trigger trg_validasi_departemen_append_only
before update or delete on public.validasi_departemen_periode
for each row execute function public.trg_gj002_append_only();

create trigger trg_lembur_perbaikan_append_only
before update or delete on public.lembur_perbaikan
for each row execute function public.trg_gj002_append_only();

-- ---------------------------------------------------------------------------
-- Helper

-- Departemen yang ditugaskan ke Supervisor yang login.
create or replace function public.gj_departemen_supervisor()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
    select id from public.departemen
    where supervisor_id = (select auth.uid()) and public.current_peran() = 'Supervisor Lapangan';
$$;

-- Departemen yang punya karyawan aktif pada suatu waktu dalam periode (AC-11).
create or replace function public.gj_departemen_periode(p_periode_gaji_id uuid)
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
    select distinct k.departemen_id
    from public.karyawan k
    join public.periode_gaji p on p.id = p_periode_gaji_id
    where k.tanggal_masuk <= p.tanggal_selesai
      and (k.tanggal_keluar is null or k.tanggal_keluar >= p.tanggal_mulai)
      and (k.status = 'AKTIF' or k.tanggal_keluar is not null);
$$;

-- ---------------------------------------------------------------------------
-- View baca

-- Karyawan untuk layar rekap: HR semua; Supervisor hanya departemennya, tanpa
-- NIK dan data pribadi lain (GJ-001 AC-08).
create or replace view public.karyawan_rekap
with (security_barrier = true)
as
select k.id, k.nama,
       case when public.current_peran() = 'HR' then k.nik end as nik,
       k.departemen_id, dp.nama as departemen, k.status, k.tanggal_masuk, k.tanggal_keluar
from public.karyawan k
join public.departemen dp on dp.id = k.departemen_id
where public.current_peran() = 'HR'
   or k.departemen_id in (select public.gj_departemen_supervisor());

create or replace view public.validasi_departemen_aman
with (security_barrier = true)
as
select v.id, v.periode_gaji_id, v.departemen_id, v.putaran_rekap,
       v.created_by, coalesce(pr.display_name, 'Supervisor Lapangan') as created_by_nama, v.created_at
from public.validasi_departemen_periode v
left join public.profiles pr on pr.id = v.created_by
where public.current_peran() is not null;

-- Periode menampilkan putaran rekap berjalan.
create or replace view public.periode_gaji_status
with (security_barrier = true)
as
select pg.id, pg.kode, pg.nama, pg.tanggal_mulai, pg.tanggal_selesai,
       d.id as dokumen_id, d.nomor, d.status, d.versi, pg.created_at, pg.updated_at, pg.putaran_rekap
from public.periode_gaji pg
join public.dokumen d on d.id = pg.dokumen_id
where public.current_peran() is not null;

-- Supervisor Lapangan membaca presensi dan lembur karyawan di departemennya.
create or replace view public.presensi_aman
with (security_barrier = true)
as
select p.id, p.dokumen_id, d.status, p.karyawan_id, p.tanggal, p.kehadiran,
       to_char(p.jam_masuk, 'HH24:MI') as jam_masuk, to_char(p.jam_pulang, 'HH24:MI') as jam_pulang,
       p.keterangan, p.sumber,
       p.created_by, coalesce(pr.display_name, 'Impor mesin absensi') as created_by_nama, p.created_at
from public.presensi p
join public.dokumen d on d.id = p.dokumen_id
left join public.profiles pr on pr.id = p.created_by
where public.current_peran() = 'HR'
   or (public.current_peran() = 'Karyawan' and p.karyawan_id = public.current_karyawan_id())
   or p.karyawan_id in (
        select k.id from public.karyawan k
        where k.departemen_id in (select public.gj_departemen_supervisor())
   );

create or replace view public.lembur_aman
with (security_barrier = true)
as
select l.id, l.dokumen_id, d.status, d.versi, l.karyawan_id, l.tanggal, l.menit, l.nomor_spl,
       l.keterangan, l.sumber,
       l.created_by, coalesce(pr.display_name, 'Pengguna') as created_by_nama, l.created_at
from public.lembur l
join public.dokumen d on d.id = l.dokumen_id
left join public.profiles pr on pr.id = l.created_by
where public.current_peran() = 'HR'
   or (public.current_peran() = 'Karyawan' and l.karyawan_id = public.current_karyawan_id())
   or l.karyawan_id in (
        select k.id from public.karyawan k
        where k.departemen_id in (select public.gj_departemen_supervisor())
   );

-- Riwayat: ditambah validasi departemen (di periode) dan perbaikan lembur.
create or replace view public.riwayat_penggajian
with (security_barrier = true)
as
select r.id, r.dokumen_id, r.status_asal as dari, r.status_tujuan as ke, r.alasan,
       coalesce(pr.display_name, 'Sistem') as oleh, r.created_at as pada
from public.riwayat_status r
left join public.profiles pr on pr.id = r.actor_id
where r.tipe_dokumen = 'PERIODE_GAJI' and public.current_peran() is not null
   or r.dokumen_id in (select dokumen_id from public.presensi_aman)
   or r.dokumen_id in (select dokumen_id from public.lembur_aman)
union all
select k.id, p.dokumen_id, d.status, d.status,
       'Koreksi periode tertutup: ' || k.alasan,
       coalesce(pr.display_name, 'HR'), k.created_at
from public.presensi_koreksi k
join public.presensi p on p.id = k.presensi_id
join public.dokumen d on d.id = p.dokumen_id
left join public.profiles pr on pr.id = k.actor_id
where p.dokumen_id in (select dokumen_id from public.presensi_aman)
union all
select v.id, pg.dokumen_id, 'REKAP', 'REKAP',
       'Departemen ' || dp.nama || ' tervalidasi',
       coalesce(pr.display_name, 'Supervisor Lapangan'), v.created_at
from public.validasi_departemen_periode v
join public.periode_gaji pg on pg.id = v.periode_gaji_id
join public.departemen dp on dp.id = v.departemen_id
left join public.profiles pr on pr.id = v.created_by
where public.current_peran() is not null
union all
select b.id, l.dokumen_id, d.status, d.status,
       'Diperbaiki HR: ' || b.alasan,
       coalesce(pr.display_name, 'HR'), b.created_at
from public.lembur_perbaikan b
join public.lembur l on l.id = b.lembur_id
join public.dokumen d on d.id = l.dokumen_id
left join public.profiles pr on pr.id = b.actor_id
where l.dokumen_id in (select dokumen_id from public.lembur_aman);

-- ---------------------------------------------------------------------------
-- Fungsi tulis

-- AC-08: setiap karyawan aktif punya entri; setiap Hadir punya jam pulang; tanpa Alpha otomatis.
create or replace function public.rekap_periode(p_periode_gaji_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_kosong text;
    v_belum text;
begin
    perform public.gj_assert_peran('HR');
    select p.*, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found then
        raise exception 'Periode tidak ditemukan.';
    end if;
    if v.status <> 'TERBUKA' then
        raise exception 'Rekap % tidak bisa disimpan: periode tidak berstatus Terbuka.', v.nama;
    end if;

    select string_agg(k.nama, ', ' order by k.nik) into v_kosong
    from public.karyawan k
    where k.departemen_id in (select public.gj_departemen_periode(v.id))
      and k.tanggal_masuk <= v.tanggal_selesai
      and (k.tanggal_keluar is null or k.tanggal_keluar >= v.tanggal_mulai)
      and not exists (
          select 1 from public.presensi pr
          where pr.karyawan_id = k.id and pr.tanggal between v.tanggal_mulai and v.tanggal_selesai
      );
    if v_kosong is not null then
        raise exception 'Rekap ditolak: % belum punya entri presensi. Tidak ada Alpha yang dibuat otomatis.', v_kosong;
    end if;

    select string_agg(distinct k.nama, ', ') into v_belum
    from public.presensi pr join public.karyawan k on k.id = pr.karyawan_id
    where pr.tanggal between v.tanggal_mulai and v.tanggal_selesai
      and pr.kehadiran = 'HADIR' and pr.jam_pulang is null;
    if v_belum is not null then
        raise exception 'Rekap ditolak: presensi Hadir tanpa jam pulang untuk %.', v_belum;
    end if;

    perform public.pindah_status_dokumen(v.dokumen_id, v.versi, 'REKAP', 'REKAP', auth.uid(), 'Rekap disimpan');
end;
$$;

-- AC-04, AC-09: hanya Supervisor departemen itu, bukan pencatat entrinya.
create or replace function public.validasi_departemen(p_periode_gaji_id uuid, p_departemen_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_actor uuid := auth.uid();
    v_dok record;
begin
    perform public.gj_assert_peran('Supervisor Lapangan');
    if p_departemen_id not in (select public.gj_departemen_supervisor()) then
        raise exception 'Hanya Supervisor Lapangan departemen ini yang berwenang memvalidasi rekapnya.' using errcode = '42501';
    end if;

    select p.*, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found then
        raise exception 'Periode tidak ditemukan.';
    end if;
    if v.status <> 'REKAP' then
        raise exception 'Validasi hanya untuk periode berstatus Rekap.';
    end if;
    if exists (
        select 1 from public.validasi_departemen_periode
        where periode_gaji_id = v.id and departemen_id = p_departemen_id and putaran_rekap = v.putaran_rekap
    ) then
        raise exception 'Rekap departemen ini sudah divalidasi.';
    end if;
    if exists (
        select 1 from public.presensi pr join public.karyawan k on k.id = pr.karyawan_id
        where k.departemen_id = p_departemen_id and pr.created_by = v_actor
          and pr.tanggal between v.tanggal_mulai and v.tanggal_selesai
        union all
        select 1 from public.lembur l join public.karyawan k on k.id = l.karyawan_id
        where k.departemen_id = p_departemen_id and l.created_by = v_actor
          and l.tanggal between v.tanggal_mulai and v.tanggal_selesai
    ) then
        raise exception 'Validasi ditolak: pencatat presensi tidak boleh memvalidasi presensi yang dicatatnya sendiri.' using errcode = '42501';
    end if;

    insert into public.validasi_departemen_periode (periode_gaji_id, departemen_id, putaran_rekap, created_by, updated_by)
    values (v.id, p_departemen_id, v.putaran_rekap, v_actor, v_actor);

    -- Entri departemen yang masih menunggu menjadi tervalidasi.
    for v_dok in
        select d.id, d.versi from public.presensi pr
        join public.karyawan k on k.id = pr.karyawan_id
        join public.dokumen d on d.id = pr.dokumen_id
        where k.departemen_id = p_departemen_id and d.status = 'MENUNGGU_VALIDASI_SUPERVISOR'
          and pr.tanggal between v.tanggal_mulai and v.tanggal_selesai
        union all
        select d.id, d.versi from public.lembur l
        join public.karyawan k on k.id = l.karyawan_id
        join public.dokumen d on d.id = l.dokumen_id
        where k.departemen_id = p_departemen_id and d.status = 'MENUNGGU_VALIDASI_SUPERVISOR'
          and l.tanggal between v.tanggal_mulai and v.tanggal_selesai
    loop
        perform public.pindah_status_dokumen(v_dok.id, v_dok.versi, 'TERVALIDASI', 'VALIDASI', v_actor);
    end loop;

    -- Semua departemen putaran ini tervalidasi → periode TERVALIDASI.
    if not exists (
        select 1 from public.gj_departemen_periode(v.id) dep
        where not exists (
            select 1 from public.validasi_departemen_periode x
            where x.periode_gaji_id = v.id and x.departemen_id = dep and x.putaran_rekap = v.putaran_rekap
        )
    ) then
        perform public.pindah_status_dokumen(v.dokumen_id, v.versi, 'TERVALIDASI', 'VALIDASI', v_actor, 'Semua departemen tervalidasi');
    end if;
end;
$$;

-- Supervisor mengembalikan rekap: seluruh periode kembali Terbuka, putaran naik.
create or replace function public.kembalikan_rekap(p_periode_gaji_id uuid, p_departemen_id uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_departemen text;
begin
    perform public.gj_assert_peran('Supervisor Lapangan');
    if p_departemen_id not in (select public.gj_departemen_supervisor()) then
        raise exception 'Hanya Supervisor Lapangan departemen ini yang bisa mengembalikan rekapnya.' using errcode = '42501';
    end if;
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pengembalian wajib diisi.';
    end if;
    select p.*, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found or v.status <> 'REKAP' then
        raise exception 'Pengembalian hanya untuk periode berstatus Rekap.';
    end if;
    select nama into v_departemen from public.departemen where id = p_departemen_id;

    perform public.pindah_status_dokumen(
        v.dokumen_id, v.versi, 'TERBUKA', 'REVISI', auth.uid(),
        'Dikembalikan ' || v_departemen || ': ' || btrim(p_alasan)
    );
    update public.periode_gaji
    set putaran_rekap = putaran_rekap + 1, updated_by = auth.uid(), updated_at = now()
    where id = v.id;
end;
$$;

-- HR membuka ulang periode Tervalidasi dengan otorisasi Manajemen (P-07, AC-07):
-- periode kembali Rekap dan setiap departemen memvalidasi lagi.
create or replace function public.buka_ulang_periode(p_periode_gaji_id uuid, p_otorisasi_id uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_oleh text;
begin
    perform public.gj_assert_peran('HR');
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan koreksi wajib diisi.';
    end if;
    select p.*, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found or v.status <> 'TERVALIDASI' then
        raise exception 'Buka ulang hanya untuk periode berstatus Tervalidasi.';
    end if;

    select coalesce(pr.display_name, 'Manajemen') into v_oleh
    from public.otorisasi_koreksi_periode o
    left join public.profiles pr on pr.id = o.created_by
    where o.id = p_otorisasi_id and o.periode_gaji_id = v.id and o.dipakai_at is null
    for update of o;
    if not found then
        raise exception 'Buka ulang % ditolak: perlu otorisasi khusus dari Manajemen.', v.nama;
    end if;

    update public.otorisasi_koreksi_periode
    set dipakai_at = now(), dipakai_by = auth.uid(), updated_by = auth.uid(), updated_at = now()
    where id = p_otorisasi_id;

    perform public.pindah_status_dokumen(
        v.dokumen_id, v.versi, 'REKAP', 'REVISI', auth.uid(),
        btrim(p_alasan) || ' (otorisasi ' || v_oleh || ')'
    );
    update public.periode_gaji
    set putaran_rekap = putaran_rekap + 1, updated_by = auth.uid(), updated_at = now()
    where id = v.id;
end;
$$;

-- D-48: HR memperbaiki lembur selama periode Terbuka dan belum tervalidasi, dengan alasan.
create or replace function public.perbaiki_lembur(p_lembur_id uuid, p_menit integer, p_nomor_spl text, p_alasan text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_batas integer;
    v_lain integer;
begin
    perform public.gj_assert_peran('HR');
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan perbaikan wajib diisi.';
    end if;
    if p_nomor_spl is null or length(btrim(p_nomor_spl)) = 0 then
        raise exception 'Nomor SPL wajib diisi.';
    end if;
    select l.*, d.status into v
    from public.lembur l join public.dokumen d on d.id = l.dokumen_id
    where l.id = p_lembur_id
    for update of l;
    if not found then
        raise exception 'Pengajuan lembur tidak ditemukan.';
    end if;
    if v.status <> 'MENUNGGU_VALIDASI_SUPERVISOR' then
        raise exception 'Lembur hanya bisa diperbaiki selama periode Terbuka dan belum tervalidasi.';
    end if;
    perform public.gj_assert_periode_terbuka(v.tanggal);

    select menit_per_hari into v_batas from public.batas_lembur
    where berlaku_mulai <= v.tanggal order by berlaku_mulai desc limit 1;
    select coalesce(sum(l.menit), 0) into v_lain
    from public.lembur l join public.dokumen d on d.id = l.dokumen_id
    where l.karyawan_id = v.karyawan_id and l.tanggal = v.tanggal and l.id <> v.id and d.status <> 'DIBATALKAN';
    if v_batas is not null and p_menit + v_lain > v_batas then
        raise exception 'Jam lembur melebihi batas yang berlaku: % menit per hari.', v_batas;
    end if;

    insert into public.lembur_perbaikan (lembur_id, alasan, menit_lama, nomor_spl_lama, actor_id)
    values (v.id, btrim(p_alasan), v.menit, v.nomor_spl, auth.uid());
    update public.lembur
    set menit = p_menit, nomor_spl = btrim(p_nomor_spl), updated_by = auth.uid(), updated_at = now()
    where id = v.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Akses

alter table public.validasi_departemen_periode enable row level security;
alter table public.lembur_perbaikan enable row level security;
revoke all on public.validasi_departemen_periode, public.lembur_perbaikan from anon, authenticated;
revoke all on public.karyawan_rekap, public.validasi_departemen_aman from public, anon;
grant select on public.karyawan_rekap, public.validasi_departemen_aman to authenticated;

create policy "Pengguna aktif baca validasi departemen" on public.validasi_departemen_periode
    for select to authenticated using (public.current_peran() is not null);
create policy "HR baca perbaikan lembur" on public.lembur_perbaikan
    for select to authenticated using (public.current_peran() = 'HR');

revoke all on function public.gj_departemen_supervisor() from public, anon;
revoke all on function public.gj_departemen_periode(uuid) from public, anon, authenticated;
revoke all on function public.rekap_periode(uuid) from public, anon;
revoke all on function public.validasi_departemen(uuid, uuid) from public, anon;
revoke all on function public.kembalikan_rekap(uuid, uuid, text) from public, anon;
revoke all on function public.buka_ulang_periode(uuid, uuid, text) from public, anon;
revoke all on function public.perbaiki_lembur(uuid, integer, text, text) from public, anon;

grant execute on function public.gj_departemen_supervisor() to authenticated;
grant execute on function public.rekap_periode(uuid) to authenticated;
grant execute on function public.validasi_departemen(uuid, uuid) to authenticated;
grant execute on function public.kembalikan_rekap(uuid, uuid, text) to authenticated;
grant execute on function public.buka_ulang_periode(uuid, uuid, text) to authenticated;
grant execute on function public.perbaiki_lembur(uuid, integer, text, text) to authenticated;
