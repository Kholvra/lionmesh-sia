-- GJ-002: periode gaji, presensi harian, dan pengajuan lembur.
-- DDL ini disusun dari usulan GJ-002 (06-ddl-proposal.sql). Nomor 0017 menunggu
-- persetujuan tech lead (D-09). Pola akses mengikuti 0009 dan 0016:
--   * tabel dasar di-revoke dari anon dan authenticated;
--   * baca lewat view security_barrier yang menyaring baris per peran;
--   * tulis hanya lewat fungsi security definer dengan guard peran.
-- Status tidak disimpan di tabel modul: setiap baris berstatus adalah dokumen
-- core/dokumen (FND-004), dengan jejak di public.riwayat_status (D-08).
--   PERIODE_GAJI  TERBUKA -> REKAP -> TERVALIDASI   (REKAP -> TERBUKA lewat REVISI)
--   PRESENSI      MENUNGGU_VALIDASI_SUPERVISOR -> TERVALIDASI
--   LEMBUR        MENUNGGU_VALIDASI_SUPERVISOR -> TERVALIDASI | DIBATALKAN (alasan wajib)

-- Akun peran Karyawan menunjuk baris karyawannya (D-53, Q-DDL-01 GJ-001).
alter table public.profiles
    add constraint fk_profiles_karyawan foreign key (karyawan_id) references public.karyawan (id);

create table public.periode_gaji (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid not null,
    tipe_dokumen text not null default 'PERIODE_GAJI',
    kode text not null,
    nama text not null,
    tanggal_mulai date not null,
    tanggal_selesai date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_periode_gaji_kode unique (kode),
    constraint uq_periode_gaji_dokumen unique (dokumen_id),
    constraint ck_periode_gaji_tipe check (tipe_dokumen = 'PERIODE_GAJI'),
    constraint ck_periode_gaji_kode check (kode ~ '^[0-9]{4}-[0-9]{2}$'),
    constraint ck_periode_gaji_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_periode_gaji_rentang check (tanggal_selesai >= tanggal_mulai),
    constraint fk_periode_gaji_dokumen foreign key (dokumen_id, tipe_dokumen)
        references public.dokumen (id, tipe)
);

-- Rentang periode tidak boleh bertumpuk (tanpa btree_gist: diperiksa trigger).
create or replace function public.trg_periode_gaji_tidak_bertumpuk()
returns trigger
language plpgsql
as $$
begin
    if exists (
        select 1 from public.periode_gaji p
        where p.id <> new.id
          and daterange(p.tanggal_mulai, p.tanggal_selesai, '[]')
              && daterange(new.tanggal_mulai, new.tanggal_selesai, '[]')
    ) then
        raise exception 'Rentang periode % bertumpuk dengan periode lain.', new.kode;
    end if;
    return new;
end;
$$;

create trigger trg_periode_gaji_tidak_bertumpuk
before insert or update on public.periode_gaji
for each row execute function public.trg_periode_gaji_tidak_bertumpuk();

-- Otorisasi Manajemen untuk koreksi periode yang sudah ditutup (P-07, PRE-07). Sekali pakai.
create table public.otorisasi_koreksi_periode (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    alasan text not null,
    dipakai_at timestamptz,
    dipakai_by uuid,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_otorisasi_koreksi_alasan check (length(btrim(alasan)) > 0),
    constraint ck_otorisasi_koreksi_dipakai check ((dipakai_at is null) = (dipakai_by is null))
);

create index idx_otorisasi_koreksi_periode on public.otorisasi_koreksi_periode (periode_gaji_id);

create table public.presensi (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid not null,
    tipe_dokumen text not null default 'PRESENSI',
    karyawan_id uuid not null references public.karyawan (id),
    tanggal date not null,
    kehadiran text not null,
    jam_masuk time,
    jam_pulang time,
    keterangan text,
    sumber text not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_presensi_karyawan_tanggal unique (karyawan_id, tanggal),   -- INV-01
    constraint uq_presensi_dokumen unique (dokumen_id),
    constraint ck_presensi_tipe check (tipe_dokumen = 'PRESENSI'),
    constraint ck_presensi_kehadiran check (kehadiran in ('HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'CUTI')),
    constraint ck_presensi_jam_hadir check (kehadiran <> 'HADIR' or jam_masuk is not null),
    constraint ck_presensi_jam_lain check (kehadiran = 'HADIR' or (jam_masuk is null and jam_pulang is null)),
    constraint ck_presensi_jam_urut check (jam_pulang is null or jam_masuk is null or jam_pulang > jam_masuk),
    constraint ck_presensi_sumber check (sumber in ('MANDIRI', 'HR', 'IMPOR')),
    constraint fk_presensi_dokumen foreign key (dokumen_id, tipe_dokumen)
        references public.dokumen (id, tipe)
);

-- Jejak koreksi periode tertutup: nilai lama tetap terbaca (append-only).
create table public.presensi_koreksi (
    id uuid primary key default gen_random_uuid(),
    presensi_id uuid not null references public.presensi (id),
    otorisasi_id uuid not null references public.otorisasi_koreksi_periode (id),
    alasan text not null,
    kehadiran_lama text,
    jam_masuk_lama time,
    jam_pulang_lama time,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_presensi_koreksi_alasan check (length(btrim(alasan)) > 0)
);

create table public.lembur (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid not null,
    tipe_dokumen text not null default 'LEMBUR',
    karyawan_id uuid not null references public.karyawan (id),
    tanggal date not null,
    menit integer not null,                      -- P-04: per menit
    nomor_spl text not null,                     -- INV-02
    keterangan text not null default '',
    sumber text not null,
    created_by uuid not null,                    -- pemohon (PRE-05)
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_lembur_dokumen unique (dokumen_id),
    constraint ck_lembur_tipe check (tipe_dokumen = 'LEMBUR'),
    constraint ck_lembur_menit check (menit > 0),
    constraint ck_lembur_spl_not_blank check (length(btrim(nomor_spl)) > 0),
    constraint ck_lembur_sumber check (sumber in ('MANDIRI', 'HR')),
    constraint fk_lembur_dokumen foreign key (dokumen_id, tipe_dokumen)
        references public.dokumen (id, tipe)
);

create index idx_lembur_karyawan_tanggal on public.lembur (karyawan_id, tanggal);

-- Batas jam lembur berversi (D-51). Data acuan.
create table public.batas_lembur (
    id uuid primary key default gen_random_uuid(),
    berlaku_mulai date not null,
    menit_per_hari integer not null,
    sumber text not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_batas_lembur_berlaku unique (berlaku_mulai),
    constraint ck_batas_lembur_menit check (menit_per_hari > 0),
    constraint ck_batas_lembur_sumber_not_blank check (length(btrim(sumber)) > 0)
);

create or replace function public.trg_gj002_append_only()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Jejak % tidak bisa diubah atau dihapus.', tg_table_name;
end;
$$;

create trigger trg_presensi_koreksi_append_only
before update or delete on public.presensi_koreksi
for each row execute function public.trg_gj002_append_only();

-- ---------------------------------------------------------------------------
-- Helper

-- Guard peran bersama untuk modul penggajian (GJ-002 sampai GJ-008).
create or replace function public.gj_assert_peran(variadic p_peran text[])
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
    -- `is distinct from`: current_peran() bernilai null saat sesi tidak berlaku.
    if auth.uid() is null or public.current_peran() is null
        or not (public.current_peran() = any (p_peran)) then
        raise exception 'Anda tidak punya izin untuk tindakan ini.' using errcode = '42501';
    end if;
end;
$$;

create or replace function public.current_karyawan_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
    select karyawan_id
    from public.profiles
    where id = (select auth.uid()) and aktif = true
      and public.is_session_current();
$$;

-- Periode yang memuat tanggal, beserta status dokumennya.
create or replace function public.gj_periode_untuk(p_tanggal date)
returns table (id uuid, nama text, status text, dokumen_id uuid, versi bigint)
language sql
security definer
stable
set search_path = public
as $$
    select p.id, p.nama, d.status, d.id, d.versi
    from public.periode_gaji p
    join public.dokumen d on d.id = p.dokumen_id
    where p_tanggal between p.tanggal_mulai and p.tanggal_selesai;
$$;

-- PRE-02: entri baru hanya untuk tanggal di periode TERBUKA.
create or replace function public.gj_assert_periode_terbuka(p_tanggal date)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v record;
begin
    select * into v from public.gj_periode_untuk(p_tanggal);
    if not found then
        raise exception 'Tanggal % tidak masuk periode penggajian mana pun.', to_char(p_tanggal, 'DD-MM-YYYY');
    end if;
    if v.status <> 'TERBUKA' then
        raise exception 'Periode % tidak terbuka. Entri baru ditolak; perubahan perlu otorisasi khusus Manajemen lewat koreksi periode oleh HR.', v.nama;
    end if;
    return v.id;
end;
$$;

-- Karyawan target: Karyawan hanya dirinya; HR memilih karyawan aktif (PRE-01).
create or replace function public.gj_karyawan_target(p_karyawan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_target uuid;
    v_status text;
begin
    perform public.gj_assert_peran('HR', 'Karyawan');
    if public.current_peran() = 'Karyawan' then
        v_target := public.current_karyawan_id();
        if v_target is null then
            raise exception 'Akun ini belum terhubung ke data karyawan. Hubungi HR.';
        end if;
        if p_karyawan_id is not null and p_karyawan_id <> v_target then
            raise exception 'Karyawan hanya boleh mencatat untuk dirinya sendiri.' using errcode = '42501';
        end if;
    else
        v_target := p_karyawan_id;
    end if;

    select status into v_status from public.karyawan where id = v_target;
    if v_status is null then
        raise exception 'Karyawan tidak ditemukan.';
    end if;
    if v_status <> 'AKTIF' then
        raise exception 'Karyawan nonaktif tidak bisa dipilih untuk entri baru.';
    end if;
    return v_target;
end;
$$;

-- ---------------------------------------------------------------------------
-- View baca

-- Satu baris karyawan milik akun Karyawan yang login (D-53).
create or replace view public.karyawan_saya
with (security_barrier = true)
as
select k.id, k.nik, k.nama, k.status, dp.nama as departemen, jb.nama as jabatan
from public.karyawan k
join public.departemen dp on dp.id = k.departemen_id
join public.jabatan jb on jb.id = k.jabatan_id
where k.id = public.current_karyawan_id();

create or replace view public.periode_gaji_status
with (security_barrier = true)
as
select pg.id, pg.kode, pg.nama, pg.tanggal_mulai, pg.tanggal_selesai,
       d.id as dokumen_id, d.nomor, d.status, d.versi, pg.created_at, pg.updated_at
from public.periode_gaji pg
join public.dokumen d on d.id = pg.dokumen_id
where public.current_peran() is not null;

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
   or (public.current_peran() = 'Karyawan' and p.karyawan_id = public.current_karyawan_id());

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
   or (public.current_peran() = 'Karyawan' and l.karyawan_id = public.current_karyawan_id());

create or replace view public.otorisasi_koreksi_aman
with (security_barrier = true)
as
select o.id, o.periode_gaji_id, o.alasan, o.dipakai_at,
       o.created_by, coalesce(pr.display_name, 'Manajemen') as created_by_nama, o.created_at
from public.otorisasi_koreksi_periode o
left join public.profiles pr on pr.id = o.created_by
where public.current_peran() in ('HR', 'Manajemen');

-- Jejak status (riwayat_status) dan koreksi untuk dokumen yang boleh dibaca peran ini.
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
where p.dokumen_id in (select dokumen_id from public.presensi_aman);

-- ---------------------------------------------------------------------------
-- Fungsi tulis

create or replace function public.catat_presensi(
    p_karyawan_id uuid,
    p_tanggal date,
    p_kehadiran text,
    p_jam_masuk time,
    p_jam_pulang time default null,
    p_keterangan text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_target uuid := public.gj_karyawan_target(p_karyawan_id);
    v_dok jsonb;
    v_id uuid;
begin
    perform public.gj_assert_periode_terbuka(p_tanggal);

    if exists (select 1 from public.presensi where karyawan_id = v_target and tanggal = p_tanggal) then
        raise exception 'Presensi tanggal % sudah ada.', to_char(p_tanggal, 'DD-MM-YYYY') using errcode = '23505';
    end if;

    v_dok := public.buat_dokumen('PRESENSI', v_actor, null, p_tanggal);

    insert into public.presensi (
        dokumen_id, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, keterangan, sumber,
        created_by, updated_by
    ) values (
        (v_dok -> 'dokumen' ->> 'id')::uuid, v_target, p_tanggal, p_kehadiran,
        case when p_kehadiran = 'HADIR' then p_jam_masuk end,
        case when p_kehadiran = 'HADIR' then p_jam_pulang end,
        nullif(btrim(p_keterangan), ''),
        case when public.current_peran() = 'Karyawan' then 'MANDIRI' else 'HR' end,
        v_actor, v_actor
    ) returning id into v_id;

    return v_id;
end;
$$;

-- Absen pulang mandiri: hanya baris milik sendiri, masih menunggu validasi, periode terbuka.
create or replace function public.isi_jam_pulang(p_presensi_id uuid, p_jam_pulang time)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
begin
    perform public.gj_assert_peran('HR', 'Karyawan');
    select p.*, d.status into v
    from public.presensi p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_presensi_id
    for update of p;

    if not found or (public.current_peran() = 'Karyawan' and v.karyawan_id is distinct from public.current_karyawan_id()) then
        raise exception 'Presensi tidak ditemukan.';
    end if;
    if v.jam_pulang is not null then
        raise exception 'Absen pulang sudah tercatat.';
    end if;
    if v.status <> 'MENUNGGU_VALIDASI_SUPERVISOR' then
        raise exception 'Presensi sudah tervalidasi. Untuk koreksi, hubungi HR.';
    end if;
    perform public.gj_assert_periode_terbuka(v.tanggal);
    if p_jam_pulang <= v.jam_masuk then
        raise exception 'Jam pulang harus setelah jam masuk (%).', to_char(v.jam_masuk, 'HH24:MI');
    end if;

    update public.presensi
    set jam_pulang = p_jam_pulang, updated_by = auth.uid(), updated_at = now()
    where id = p_presensi_id;
end;
$$;

create or replace function public.ajukan_lembur(
    p_karyawan_id uuid,
    p_tanggal date,
    p_menit integer,
    p_nomor_spl text,
    p_keterangan text default ''
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_target uuid := public.gj_karyawan_target(p_karyawan_id);
    v_batas integer;
    v_terpakai integer;
    v_dok jsonb;
    v_id uuid;
begin
    perform public.gj_assert_periode_terbuka(p_tanggal);

    if p_nomor_spl is null or length(btrim(p_nomor_spl)) = 0 then
        raise exception 'Nomor SPL wajib diisi.';
    end if;

    select menit_per_hari into v_batas
    from public.batas_lembur
    where berlaku_mulai <= p_tanggal
    order by berlaku_mulai desc
    limit 1;

    select coalesce(sum(l.menit), 0) into v_terpakai
    from public.lembur l join public.dokumen d on d.id = l.dokumen_id
    where l.karyawan_id = v_target and l.tanggal = p_tanggal and d.status <> 'DIBATALKAN';

    if v_batas is not null and p_menit + v_terpakai > v_batas then
        raise exception 'Jam lembur melebihi batas yang berlaku: % menit per hari.', v_batas;
    end if;

    v_dok := public.buat_dokumen('LEMBUR', v_actor, null, p_tanggal);

    insert into public.lembur (
        dokumen_id, karyawan_id, tanggal, menit, nomor_spl, keterangan, sumber, created_by, updated_by
    ) values (
        (v_dok -> 'dokumen' ->> 'id')::uuid, v_target, p_tanggal, p_menit, btrim(p_nomor_spl),
        coalesce(btrim(p_keterangan), ''),
        case when public.current_peran() = 'Karyawan' then 'MANDIRI' else 'HR' end,
        v_actor, v_actor
    ) returning id into v_id;

    return v_id;
end;
$$;

-- PRE-05: hanya pemohon, hanya selama menunggu validasi, alasan wajib.
create or replace function public.batalkan_lembur(p_lembur_id uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
begin
    perform public.gj_assert_peran('HR', 'Karyawan');
    select l.created_by, d.id as dokumen_id, d.status, d.versi into v
    from public.lembur l join public.dokumen d on d.id = l.dokumen_id
    where l.id = p_lembur_id;

    if not found then
        raise exception 'Pengajuan lembur tidak ditemukan.';
    end if;
    if v.created_by <> auth.uid() then
        raise exception 'Hanya pemohon yang bisa membatalkan pengajuan ini.' using errcode = '42501';
    end if;
    if v.status <> 'MENUNGGU_VALIDASI_SUPERVISOR' then
        raise exception 'Pembatalan ditolak: pengajuan sudah diproses. Untuk koreksi, hubungi HR.';
    end if;
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pembatalan wajib diisi.';
    end if;

    perform public.pindah_status_dokumen(v.dokumen_id, v.versi, 'DIBATALKAN', 'BATAL', auth.uid(), btrim(p_alasan));
end;
$$;

-- P-07: Manajemen memberi otorisasi koreksi untuk periode yang sudah ditutup.
create or replace function public.beri_otorisasi_koreksi(p_periode_gaji_id uuid, p_alasan text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_status text;
    v_id uuid;
begin
    perform public.gj_assert_peran('Manajemen');
    select d.status into v_status
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id;

    if v_status is null then
        raise exception 'Periode tidak ditemukan.';
    end if;
    if v_status not in ('REKAP', 'TERVALIDASI') then
        raise exception 'Pilih periode berstatus Rekap atau Tervalidasi.';
    end if;
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan otorisasi wajib diisi.';
    end if;

    insert into public.otorisasi_koreksi_periode (periode_gaji_id, alasan, created_by, updated_by)
    values (p_periode_gaji_id, btrim(p_alasan), auth.uid(), auth.uid())
    returning id into v_id;
    return v_id;
end;
$$;

-- PRE-07: HR mengoreksi presensi di periode Rekap memakai otorisasi sekali pakai.
-- Periode kembali TERBUKA (D-47 c) sebelum entri berubah; HR menyimpan rekap lagi.
create or replace function public.koreksi_presensi(
    p_otorisasi_id uuid,
    p_karyawan_id uuid,
    p_tanggal date,
    p_kehadiran text,
    p_jam_masuk time,
    p_jam_pulang time,
    p_alasan text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_periode record;
    v_otorisasi record;
    v_presensi record;
    v_dok jsonb;
    v_id uuid;
    v_hadir boolean := p_kehadiran = 'HADIR';
begin
    perform public.gj_assert_peran('HR');
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan koreksi wajib diisi.';
    end if;

    select * into v_periode from public.gj_periode_untuk(p_tanggal);
    if not found then
        raise exception 'Tanggal tidak masuk periode penggajian mana pun.';
    end if;
    if v_periode.status <> 'REKAP' then
        raise exception 'Koreksi ini hanya untuk periode berstatus Rekap.';
    end if;

    select * into v_otorisasi from public.otorisasi_koreksi_periode
    where id = p_otorisasi_id and periode_gaji_id = v_periode.id and dipakai_at is null
    for update;
    if not found then
        raise exception 'Koreksi periode tertutup perlu otorisasi khusus dari Manajemen.';
    end if;

    update public.otorisasi_koreksi_periode
    set dipakai_at = now(), dipakai_by = v_actor, updated_by = v_actor, updated_at = now()
    where id = p_otorisasi_id;

    perform public.pindah_status_dokumen(
        v_periode.dokumen_id, v_periode.versi, 'TERBUKA', 'REVISI', v_actor,
        'Koreksi periode tertutup: ' || btrim(p_alasan)
    );

    select * into v_presensi from public.presensi
    where karyawan_id = p_karyawan_id and tanggal = p_tanggal
    for update;

    if found then
        insert into public.presensi_koreksi (
            presensi_id, otorisasi_id, alasan, kehadiran_lama, jam_masuk_lama, jam_pulang_lama, actor_id
        ) values (
            v_presensi.id, p_otorisasi_id, btrim(p_alasan), v_presensi.kehadiran,
            v_presensi.jam_masuk, v_presensi.jam_pulang, v_actor
        );
        update public.presensi
        set kehadiran = p_kehadiran,
            jam_masuk = case when v_hadir then p_jam_masuk end,
            jam_pulang = case when v_hadir then p_jam_pulang end,
            keterangan = btrim(p_alasan),
            updated_by = v_actor,
            updated_at = now()
        where id = v_presensi.id;
        return v_presensi.id;
    end if;

    if not exists (select 1 from public.karyawan where id = p_karyawan_id) then
        raise exception 'Karyawan tidak ditemukan.';
    end if;
    v_dok := public.buat_dokumen('PRESENSI', v_actor, null, p_tanggal);
    insert into public.presensi (
        dokumen_id, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, keterangan, sumber,
        created_by, updated_by
    ) values (
        (v_dok -> 'dokumen' ->> 'id')::uuid, p_karyawan_id, p_tanggal, p_kehadiran,
        case when v_hadir then p_jam_masuk end, case when v_hadir then p_jam_pulang end,
        btrim(p_alasan), 'HR', v_actor, v_actor
    ) returning id into v_id;
    insert into public.presensi_koreksi (presensi_id, otorisasi_id, alasan, actor_id)
    values (v_id, p_otorisasi_id, btrim(p_alasan), v_actor);
    return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Akses

alter table public.periode_gaji enable row level security;
alter table public.otorisasi_koreksi_periode enable row level security;
alter table public.presensi enable row level security;
alter table public.presensi_koreksi enable row level security;
alter table public.lembur enable row level security;
alter table public.batas_lembur enable row level security;

revoke all on public.periode_gaji, public.otorisasi_koreksi_periode, public.presensi,
    public.presensi_koreksi, public.lembur, public.batas_lembur from anon, authenticated;
revoke all on public.karyawan_saya, public.periode_gaji_status, public.presensi_aman,
    public.lembur_aman, public.otorisasi_koreksi_aman, public.riwayat_penggajian from public, anon;
grant select on public.karyawan_saya, public.periode_gaji_status, public.presensi_aman,
    public.lembur_aman, public.otorisasi_koreksi_aman, public.riwayat_penggajian to authenticated;
-- Batas lembur adalah data acuan: boleh dibaca, tidak boleh ditulis.
grant select on public.batas_lembur to authenticated;

-- Defense in depth: bila grant tabel dasar dibuka kembali, RLS tetap membatasi.
create policy "Pengguna aktif boleh baca periode gaji" on public.periode_gaji
    for select to authenticated using (public.current_peran() is not null);
create policy "Pengguna aktif boleh baca batas lembur" on public.batas_lembur
    for select to authenticated using (public.current_peran() is not null);
create policy "HR dan Manajemen baca otorisasi koreksi" on public.otorisasi_koreksi_periode
    for select to authenticated using (public.current_peran() in ('HR', 'Manajemen'));
create policy "HR atau pemilik baca presensi" on public.presensi
    for select to authenticated using (
        public.current_peran() = 'HR'
        or (public.current_peran() = 'Karyawan' and karyawan_id = public.current_karyawan_id())
    );
create policy "HR baca koreksi presensi" on public.presensi_koreksi
    for select to authenticated using (public.current_peran() = 'HR');
create policy "HR atau pemilik baca lembur" on public.lembur
    for select to authenticated using (
        public.current_peran() = 'HR'
        or (public.current_peran() = 'Karyawan' and karyawan_id = public.current_karyawan_id())
    );

revoke all on function public.gj_assert_peran(text[]) from public, anon;
revoke all on function public.current_karyawan_id() from public, anon;
revoke all on function public.gj_periode_untuk(date) from public, anon, authenticated;
revoke all on function public.gj_assert_periode_terbuka(date) from public, anon, authenticated;
revoke all on function public.gj_karyawan_target(uuid) from public, anon, authenticated;
revoke all on function public.catat_presensi(uuid, date, text, time, time, text) from public, anon;
revoke all on function public.isi_jam_pulang(uuid, time) from public, anon;
revoke all on function public.ajukan_lembur(uuid, date, integer, text, text) from public, anon;
revoke all on function public.batalkan_lembur(uuid, text) from public, anon;
revoke all on function public.beri_otorisasi_koreksi(uuid, text) from public, anon;
revoke all on function public.koreksi_presensi(uuid, uuid, date, text, time, time, text) from public, anon;

grant execute on function public.gj_assert_peran(text[]) to authenticated;
grant execute on function public.current_karyawan_id() to authenticated;
grant execute on function public.catat_presensi(uuid, date, text, time, time, text) to authenticated;
grant execute on function public.isi_jam_pulang(uuid, time) to authenticated;
grant execute on function public.ajukan_lembur(uuid, date, integer, text, text) to authenticated;
grant execute on function public.batalkan_lembur(uuid, text) to authenticated;
grant execute on function public.beri_otorisasi_koreksi(uuid, text) to authenticated;
grant execute on function public.koreksi_presensi(uuid, uuid, date, text, time, time, text) to authenticated;
