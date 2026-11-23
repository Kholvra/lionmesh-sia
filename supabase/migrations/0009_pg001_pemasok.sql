-- PG-001: Master pemasok, termin, dan toleransi match.
-- DDL ini disusun dari docs/product/items/PG-001-pemasok-termin-toleransi.
-- Nomor migrasi diberikan tech lead; jangan mengubah migrasi yang sudah diterapkan.
--
-- FND-004 memiliki public.riwayat_status yang terikat ke public.dokumen
-- (foreign key dokumen_id + tipe_dokumen). Pemasok adalah master, bukan
-- dokumen, sehingga riwayat status pemasok disimpan append-only di
-- public.pemasok_riwayat_status. Penyimpangan dari D-08/D-32 ini dicatat
-- di paket PG-001 untuk direkonsiliasi tech lead.

create table public.pemasok (
    id uuid primary key default gen_random_uuid(),
    nama text not null,
    alamat text,
    npwp text,
    kontak_perusahaan text,
    kontak_pic_nama text,
    kontak_pic_telepon text,
    termin_hari integer not null,
    toleransi_persen numeric(5, 2) not null default 0,
    toleransi_nominal numeric(18, 2) not null default 0,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_pemasok_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_pemasok_termin_non_negative check (termin_hari >= 0),
    constraint ck_pemasok_toleransi_persen_range check (toleransi_persen between 0 and 100),
    constraint ck_pemasok_toleransi_nominal_non_negative check (toleransi_nominal >= 0)
);

-- Nama pemasok unik tanpa memandang huruf besar/kecil dan spasi tepi.
create unique index uq_pemasok_nama_normalized on public.pemasok (lower(btrim(nama)));
create index idx_pemasok_aktif on public.pemasok (aktif);

-- Riwayat status master pemasok, append-only.
create table public.pemasok_riwayat_status (
    id uuid primary key default gen_random_uuid(),
    pemasok_id uuid not null references public.pemasok (id),
    aksi text not null,
    status_lama text,
    status_baru text not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_pemasok_riwayat_aksi check (aksi in ('BUAT', 'AKTIFKAN', 'NONAKTIFKAN')),
    constraint ck_pemasok_riwayat_status_baru check (status_baru in ('aktif', 'nonaktif')),
    constraint ck_pemasok_riwayat_buat check (
        (aksi <> 'BUAT' or status_lama is null)
        and (aksi = 'BUAT' or status_lama is not null)
    )
);

create index idx_pemasok_riwayat_status_pemasok
on public.pemasok_riwayat_status (pemasok_id, created_at, id);

create or replace function public.trg_pemasok_riwayat_status_immutable()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Riwayat status pemasok tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_pemasok_riwayat_status_immutable
before update or delete on public.pemasok_riwayat_status
for each row
execute function public.trg_pemasok_riwayat_status_immutable();

-- Tampilan baca yang menyembunyikan kontak PIC dari peran selain Purchasing dan Accounting.
-- View berjalan sebagai owner agar tidak bergantung pada grant tabel dasar; filter staf
-- aktif tetap ditegakkan di dalam view.
create or replace view public.pemasok_aman
with (security_barrier = true)
as
select
    p.id,
    p.nama,
    p.alamat,
    p.npwp,
    p.kontak_perusahaan,
    case
        when public.current_peran() in ('Purchasing', 'Accounting') then p.kontak_pic_nama
        else null
    end as kontak_pic_nama,
    case
        when public.current_peran() in ('Purchasing', 'Accounting') then p.kontak_pic_telepon
        else null
    end as kontak_pic_telepon,
    p.termin_hari,
    p.toleransi_persen,
    p.toleransi_nominal,
    p.aktif,
    p.created_at,
    p.updated_at
from public.pemasok p
where public.is_active_staff();

-- Riwayat pemasok dengan nama aktor untuk layar detail.
create or replace view public.pemasok_riwayat
with (security_barrier = true)
as
select
    r.id,
    r.pemasok_id,
    r.aksi,
    r.status_lama,
    r.status_baru,
    r.actor_id,
    coalesce(pr.display_name, 'Sistem') as actor_nama,
    r.created_at
from public.pemasok_riwayat_status r
left join public.profiles pr on pr.id = r.actor_id
where public.is_active_staff();

alter table public.pemasok enable row level security;
alter table public.pemasok_riwayat_status enable row level security;

revoke all on public.pemasok from anon, authenticated;
revoke all on public.pemasok_riwayat_status from anon, authenticated;
revoke all on public.pemasok_aman from public, anon;
revoke all on public.pemasok_riwayat from public, anon;
grant select on public.pemasok_aman to authenticated;
grant select on public.pemasok_riwayat to authenticated;

-- Defense in depth: bila grant tabel dasar dibuka kembali, RLS tetap membatasi.
create policy "Staf aktif boleh baca pemasok"
on public.pemasok for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca riwayat status pemasok"
on public.pemasok_riwayat_status for select
to authenticated
using (public.is_active_staff());

-- Guard peran untuk semua penulisan master pemasok (D-33).
create or replace function public.pg001_assert_purchasing()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
    if auth.uid() is null or public.current_peran() <> 'Purchasing' then
        raise exception 'Anda tidak punya izin mengubah data pemasok.' using errcode = '42501';
    end if;
end;
$$;

revoke all on function public.pg001_assert_purchasing() from public, anon;
grant execute on function public.pg001_assert_purchasing() to authenticated;

create or replace function public.create_pemasok(
    p_nama text,
    p_alamat text default null,
    p_npwp text default null,
    p_kontak_perusahaan text default null,
    p_kontak_pic_nama text default null,
    p_kontak_pic_telepon text default null,
    p_termin_hari integer default null,
    p_toleransi_persen numeric default 0,
    p_toleransi_nominal numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_id uuid;
    v_actor uuid := auth.uid();
begin
    perform public.pg001_assert_purchasing();

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama pemasok wajib diisi.';
    end if;

    if p_termin_hari is null then
        raise exception 'Termin pembayaran wajib diisi.';
    end if;

    if p_termin_hari < 0 then
        raise exception 'Termin pembayaran tidak boleh negatif.';
    end if;

    if p_toleransi_persen is null or p_toleransi_persen < 0 or p_toleransi_persen > 100 then
        raise exception 'Toleransi persen harus antara 0 dan 100.';
    end if;

    if p_toleransi_nominal is null or p_toleransi_nominal < 0 then
        raise exception 'Toleransi nominal tidak boleh negatif.';
    end if;

    insert into public.pemasok (
        nama,
        alamat,
        npwp,
        kontak_perusahaan,
        kontak_pic_nama,
        kontak_pic_telepon,
        termin_hari,
        toleransi_persen,
        toleransi_nominal,
        aktif,
        created_by,
        updated_by
    )
    values (
        btrim(p_nama),
        nullif(btrim(p_alamat), ''),
        nullif(btrim(p_npwp), ''),
        nullif(btrim(p_kontak_perusahaan), ''),
        nullif(btrim(p_kontak_pic_nama), ''),
        nullif(btrim(p_kontak_pic_telepon), ''),
        p_termin_hari,
        p_toleransi_persen,
        p_toleransi_nominal,
        true,
        v_actor,
        v_actor
    )
    returning id into v_id;

    insert into public.pemasok_riwayat_status (pemasok_id, aksi, status_lama, status_baru, actor_id)
    values (v_id, 'BUAT', null, 'aktif', v_actor);

    return v_id;
exception
    when unique_violation then
        raise exception 'Nama pemasok sudah terdaftar.';
end;
$$;

revoke all on function public.create_pemasok(text, text, text, text, text, text, integer, numeric, numeric) from public, anon;
grant execute on function public.create_pemasok(text, text, text, text, text, text, integer, numeric, numeric) to authenticated;

create or replace function public.update_pemasok(
    p_id uuid,
    p_nama text,
    p_alamat text default null,
    p_npwp text default null,
    p_kontak_perusahaan text default null,
    p_kontak_pic_nama text default null,
    p_kontak_pic_telepon text default null,
    p_termin_hari integer default null,
    p_toleransi_persen numeric default 0,
    p_toleransi_nominal numeric default 0
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
begin
    perform public.pg001_assert_purchasing();

    if p_id is null then
        raise exception 'Pemasok tidak ditemukan.';
    end if;

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama pemasok wajib diisi.';
    end if;

    if p_termin_hari is null then
        raise exception 'Termin pembayaran wajib diisi.';
    end if;

    if p_termin_hari < 0 then
        raise exception 'Termin pembayaran tidak boleh negatif.';
    end if;

    if p_toleransi_persen is null or p_toleransi_persen < 0 or p_toleransi_persen > 100 then
        raise exception 'Toleransi persen harus antara 0 dan 100.';
    end if;

    if p_toleransi_nominal is null or p_toleransi_nominal < 0 then
        raise exception 'Toleransi nominal tidak boleh negatif.';
    end if;

    update public.pemasok
    set
        nama = btrim(p_nama),
        alamat = nullif(btrim(p_alamat), ''),
        npwp = nullif(btrim(p_npwp), ''),
        kontak_perusahaan = nullif(btrim(p_kontak_perusahaan), ''),
        kontak_pic_nama = nullif(btrim(p_kontak_pic_nama), ''),
        kontak_pic_telepon = nullif(btrim(p_kontak_pic_telepon), ''),
        termin_hari = p_termin_hari,
        toleransi_persen = p_toleransi_persen,
        toleransi_nominal = p_toleransi_nominal,
        updated_by = v_actor,
        updated_at = now()
    where id = p_id;

    if not found then
        raise exception 'Pemasok tidak ditemukan.';
    end if;
exception
    when unique_violation then
        raise exception 'Nama pemasok sudah terdaftar.';
end;
$$;

revoke all on function public.update_pemasok(uuid, text, text, text, text, text, text, integer, numeric, numeric) from public, anon;
grant execute on function public.update_pemasok(uuid, text, text, text, text, text, text, integer, numeric, numeric) to authenticated;

create or replace function public.set_status_pemasok(p_id uuid, p_aktif boolean)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_status_lama boolean;
    v_status_baru text;
begin
    perform public.pg001_assert_purchasing();

    if p_id is null or p_aktif is null then
        raise exception 'Pemasok tidak ditemukan.';
    end if;

    select aktif into v_status_lama
    from public.pemasok
    where id = p_id
    for update;

    if not found then
        raise exception 'Pemasok tidak ditemukan.';
    end if;

    if v_status_lama = p_aktif then
        if p_aktif then
            raise exception 'Pemasok sudah aktif.';
        else
            raise exception 'Pemasok sudah nonaktif.';
        end if;
    end if;

    update public.pemasok
    set aktif = p_aktif,
        updated_by = v_actor,
        updated_at = now()
    where id = p_id;

    v_status_baru := case when p_aktif then 'aktif' else 'nonaktif' end;

    insert into public.pemasok_riwayat_status (pemasok_id, aksi, status_lama, status_baru, actor_id)
    values (
        p_id,
        case when p_aktif then 'AKTIFKAN' else 'NONAKTIFKAN' end,
        case when v_status_lama then 'aktif' else 'nonaktif' end,
        v_status_baru,
        v_actor
    );
end;
$$;

revoke all on function public.set_status_pemasok(uuid, boolean) from public, anon;
grant execute on function public.set_status_pemasok(uuid, boolean) to authenticated;

grant all on public.pemasok to service_role;
grant all on public.pemasok_riwayat_status to service_role;
grant select on public.pemasok_aman to service_role;
grant select on public.pemasok_riwayat to service_role;
