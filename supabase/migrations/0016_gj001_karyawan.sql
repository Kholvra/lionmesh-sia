-- GJ-001: master karyawan, gaji pokok, dan kategori PTKP.
-- DDL ini disusun dari docs/product/items/GJ-001-karyawan-gaji-pokok-ptkp/06-ddl-proposal.sql.
-- Nomor 0016 ditetapkan tech lead (D-09, docs/tech-debt/gj-001-mock-store.md).
-- Pemilik tabel: core (D-31). Pola akses mengikuti 0009 (PG-001):
--   * tabel dasar di-revoke dari anon dan authenticated;
--   * baca lewat view security_barrier yang menyembunyikan kolom per peran;
--   * tulis hanya lewat fungsi security definer dengan guard peran HR.
-- Konvensi: PK uuid, empat kolom audit dengan aktor uuid nullable tanpa FK
-- (D-32, FND-002 INV-05), uang numeric(18,2) (D-56), nama constraint uq_/ck_/fk_/idx_.

create table public.departemen (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_departemen_kode unique (kode),
    constraint ck_departemen_nama_not_blank check (length(btrim(nama)) > 0)
);

create table public.jabatan (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_jabatan_kode unique (kode),
    constraint ck_jabatan_nama_not_blank check (length(btrim(nama)) > 0)
);

-- Kategori PTKP (D-19); kode dipakai lookup kategori TER di GJ-004.
create table public.kategori_ptkp (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_kategori_ptkp_kode unique (kode),
    constraint ck_kategori_ptkp_kode check (kode ~ '^(TK|K)/[0-3]$'),
    constraint ck_kategori_ptkp_nama_not_blank check (length(btrim(nama)) > 0)
);

create table public.karyawan (
    id uuid primary key default gen_random_uuid(),
    nik text not null,
    nama text not null,
    departemen_id uuid not null,
    jabatan_id uuid not null,
    kategori_ptkp_id uuid not null,
    tipe text not null,
    tanggal_masuk date not null,
    tanggal_keluar date,
    status text not null default 'AKTIF',
    rekening_nama_bank text not null,
    rekening_nomor text not null,
    rekening_nama_pemilik text not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_karyawan_nik unique (nik),                                    -- AC-02
    constraint ck_karyawan_nik check (nik ~ '^[0-9]{16}$'),                     -- AC-14
    constraint ck_karyawan_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_karyawan_tipe check (tipe in ('PRODUKSI', 'NON_PRODUKSI')),
    constraint ck_karyawan_status check (status in ('AKTIF', 'NONAKTIF')),
    constraint ck_karyawan_keluar check (status = 'AKTIF' or tanggal_keluar is not null),
    constraint ck_karyawan_tanggal check (tanggal_keluar is null or tanggal_keluar >= tanggal_masuk),
    constraint ck_karyawan_bank_not_blank check (length(btrim(rekening_nama_bank)) > 0),   -- AC-15
    constraint ck_karyawan_rekening_nomor check (rekening_nomor ~ '^[0-9]+$'),
    constraint ck_karyawan_pemilik_not_blank check (length(btrim(rekening_nama_pemilik)) > 0),
    constraint fk_karyawan_departemen foreign key (departemen_id) references public.departemen (id),
    constraint fk_karyawan_jabatan foreign key (jabatan_id) references public.jabatan (id),
    constraint fk_karyawan_kategori_ptkp foreign key (kategori_ptkp_id) references public.kategori_ptkp (id)
);

create index idx_karyawan_departemen_id on public.karyawan (departemen_id);
create index idx_karyawan_jabatan_id on public.karyawan (jabatan_id);
create index idx_karyawan_kategori_ptkp_id on public.karyawan (kategori_ptkp_id);

-- Riwayat status karyawan (D-63, pola pemasok_riwayat_status di 0009): append-only.
-- public.riwayat_status tidak bisa dipakai karena terikat ke public.dokumen.
create table public.karyawan_riwayat_status (
    id uuid primary key default gen_random_uuid(),
    karyawan_id uuid not null references public.karyawan (id),
    aksi text not null,
    status_lama text,
    status_baru text not null,
    tanggal_keluar date,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_karyawan_riwayat_aksi check (aksi in ('BUAT', 'UBAH', 'NONAKTIFKAN', 'AKTIFKAN')),
    constraint ck_karyawan_riwayat_status_baru check (status_baru in ('AKTIF', 'NONAKTIF')),
    constraint ck_karyawan_riwayat_buat check (
        (aksi <> 'BUAT' or status_lama is null)
        and (aksi = 'BUAT' or status_lama is not null)
    ),
    constraint ck_karyawan_riwayat_keluar check (aksi <> 'NONAKTIFKAN' or tanggal_keluar is not null)
);

create index idx_karyawan_riwayat_status_karyawan
on public.karyawan_riwayat_status (karyawan_id, created_at, id);

create or replace function public.trg_karyawan_riwayat_status_immutable()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Riwayat status karyawan tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_karyawan_riwayat_status_immutable
before update or delete on public.karyawan_riwayat_status
for each row
execute function public.trg_karyawan_riwayat_status_immutable();

-- Histori gaji pokok: hanya tambah (AC-03, AC-04). Koreksi = entri baru dengan
-- tanggal berlaku sesudahnya. Nominal rupiah bulat (D-51 b) disimpan numeric(18,2).
create table public.gaji_pokok_histori (
    id uuid primary key default gen_random_uuid(),
    karyawan_id uuid not null,
    nominal numeric(18,2) not null,
    tanggal_berlaku date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_gaji_pokok_histori_tanggal unique (karyawan_id, tanggal_berlaku),   -- AC-11
    constraint ck_gaji_pokok_histori_nominal check (nominal > 0 and nominal = trunc(nominal)),
    constraint fk_gaji_pokok_histori_karyawan foreign key (karyawan_id) references public.karyawan (id)
);

create or replace function public.trg_prevent_gaji_pokok_histori_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Histori gaji pokok tidak boleh diubah atau dihapus. Tambahkan entri baru.';
end;
$$;

create trigger trg_gaji_pokok_histori_immutable
before update or delete on public.gaji_pokok_histori
for each row execute function public.trg_prevent_gaji_pokok_histori_mutation();

-- Akses (P-06, AC-08, AC-13), mengikuti pola 0009:
--   * tabel dasar di-revoke dari anon dan authenticated;
--   * baca lewat view security_barrier yang menyembunyikan kolom per peran;
--   * tulis hanya lewat fungsi security definer dengan guard peran HR.
-- Karyawan (peran ke-13, D-53) tidak membaca data karyawan lain; datanya sendiri
-- dibaca modul presensi (GJ-002), bukan view ini.

create or replace view public.karyawan_aman
with (security_barrier = true)
as
select
    k.id,
    k.nama,
    k.status,
    k.tanggal_keluar,
    case when public.current_peran() in ('HR', 'Accounting') then k.nik end as nik,
    case when public.current_peran() in ('HR', 'Accounting') then k.departemen_id end as departemen_id,
    case when public.current_peran() in ('HR', 'Accounting') then k.jabatan_id end as jabatan_id,
    case when public.current_peran() in ('HR', 'Accounting') then k.tipe end as tipe,
    case when public.current_peran() in ('HR', 'Accounting') then k.tanggal_masuk end as tanggal_masuk,
    case when public.current_peran() in ('HR', 'Accounting') then p.kode end as ptkp_kode,
    case when public.current_peran() in ('HR', 'Finance') then k.rekening_nama_bank end as rekening_nama_bank,
    case when public.current_peran() in ('HR', 'Finance') then k.rekening_nomor end as rekening_nomor,
    case when public.current_peran() in ('HR', 'Finance') then k.rekening_nama_pemilik end as rekening_nama_pemilik,
    k.created_at,
    k.updated_at
from public.karyawan k
join public.kategori_ptkp p on p.id = k.kategori_ptkp_id
where public.current_peran() in ('HR', 'Accounting', 'Finance');

create or replace view public.gaji_pokok_aman
with (security_barrier = true)
as
select g.id, g.karyawan_id, g.nominal, g.tanggal_berlaku, g.created_by,
       coalesce(pr.display_name, 'Sistem') as created_by_nama, g.created_at
from public.gaji_pokok_histori g
left join public.profiles pr on pr.id = g.created_by
where public.current_peran() in ('HR', 'Accounting');

create or replace view public.karyawan_riwayat
with (security_barrier = true)
as
select r.id, r.karyawan_id, r.aksi, r.status_lama, r.status_baru, r.tanggal_keluar,
       r.actor_id, coalesce(pr.display_name, 'Sistem') as actor_nama, r.created_at
from public.karyawan_riwayat_status r
left join public.profiles pr on pr.id = r.actor_id
where public.current_peran() in ('HR', 'Accounting');

alter table public.departemen enable row level security;
alter table public.jabatan enable row level security;
alter table public.kategori_ptkp enable row level security;
alter table public.karyawan enable row level security;
alter table public.gaji_pokok_histori enable row level security;
alter table public.karyawan_riwayat_status enable row level security;

revoke all on public.karyawan, public.gaji_pokok_histori, public.karyawan_riwayat_status
    from anon, authenticated;
revoke all on public.karyawan_aman, public.gaji_pokok_aman, public.karyawan_riwayat from public, anon;
grant select on public.karyawan_aman, public.gaji_pokok_aman, public.karyawan_riwayat to authenticated;

create policy "Staf aktif boleh baca departemen" on public.departemen
    for select to authenticated using (public.is_active_staff());
create policy "Staf aktif boleh baca jabatan" on public.jabatan
    for select to authenticated using (public.is_active_staff());
create policy "Staf aktif boleh baca kategori PTKP" on public.kategori_ptkp
    for select to authenticated using (public.is_active_staff());

-- Defense in depth: bila grant tabel dasar dibuka kembali, RLS tetap membatasi.
create policy "Peran payroll boleh baca karyawan" on public.karyawan
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting', 'Finance'));
create policy "HR dan Accounting boleh baca gaji pokok" on public.gaji_pokok_histori
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting'));
create policy "HR dan Accounting boleh baca riwayat karyawan" on public.karyawan_riwayat_status
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting'));

-- Guard peran untuk semua penulisan data karyawan (P-06).
create or replace function public.gj001_assert_hr()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
    -- `is distinct from`: current_peran() bernilai null saat sesi tidak berlaku.
    if auth.uid() is null or public.current_peran() is distinct from 'HR' then
        raise exception 'Anda tidak punya izin mengubah data karyawan.' using errcode = '42501';
    end if;
end;
$$;

revoke all on function public.gj001_assert_hr() from public, anon;
grant execute on function public.gj001_assert_hr() to authenticated;

-- Fungsi tulis. Pesan kesalahan berbahasa Indonesia karena diteruskan ke layar.

create or replace function public.create_karyawan(
    p_nik text,
    p_nama text,
    p_departemen_id uuid,
    p_jabatan_id uuid,
    p_ptkp_kode text,
    p_tipe text,
    p_tanggal_masuk date,
    p_rekening_nama_bank text,
    p_rekening_nomor text,
    p_rekening_nama_pemilik text,
    p_gaji_pokok numeric,
    p_tanggal_berlaku date
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_id uuid;
    v_ptkp uuid;
    v_actor uuid := auth.uid();
begin
    perform public.gj001_assert_hr();

    if exists (select 1 from public.karyawan where nik = btrim(p_nik)) then
        raise exception 'NIK % sudah terdaftar.', btrim(p_nik) using errcode = '23505';
    end if;

    select id into v_ptkp from public.kategori_ptkp where kode = p_ptkp_kode and aktif;
    if v_ptkp is null then
        raise exception 'Status PTKP % tidak ada di daftar yang berlaku.', p_ptkp_kode;
    end if;

    insert into public.karyawan (
        nik, nama, departemen_id, jabatan_id, kategori_ptkp_id, tipe, tanggal_masuk,
        rekening_nama_bank, rekening_nomor, rekening_nama_pemilik, created_by, updated_by
    )
    values (
        btrim(p_nik), btrim(p_nama), p_departemen_id, p_jabatan_id, v_ptkp, p_tipe, p_tanggal_masuk,
        btrim(p_rekening_nama_bank), btrim(p_rekening_nomor), btrim(p_rekening_nama_pemilik), v_actor, v_actor
    )
    returning id into v_id;

    insert into public.gaji_pokok_histori (karyawan_id, nominal, tanggal_berlaku, created_by, updated_by)
    values (v_id, p_gaji_pokok, p_tanggal_berlaku, v_actor, v_actor);

    insert into public.karyawan_riwayat_status (karyawan_id, aksi, status_lama, status_baru, actor_id)
    values (v_id, 'BUAT', null, 'AKTIF', v_actor);

    return v_id;
end;
$$;

create or replace function public.update_karyawan(
    p_id uuid,
    p_nama text,
    p_departemen_id uuid,
    p_jabatan_id uuid,
    p_ptkp_kode text,
    p_tipe text,
    p_tanggal_masuk date,
    p_rekening_nama_bank text,
    p_rekening_nomor text,
    p_rekening_nama_pemilik text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_status text;
    v_ptkp uuid;
    v_actor uuid := auth.uid();
begin
    perform public.gj001_assert_hr();

    select status into v_status from public.karyawan where id = p_id for update;
    if v_status is null then
        raise exception 'Karyawan tidak ditemukan.';
    end if;

    select id into v_ptkp from public.kategori_ptkp where kode = p_ptkp_kode and aktif;
    if v_ptkp is null then
        raise exception 'Status PTKP % tidak ada di daftar yang berlaku.', p_ptkp_kode;
    end if;

    -- NIK dan gaji pokok tidak diubah di sini (AC-03, AC-07).
    update public.karyawan
    set nama = btrim(p_nama),
        departemen_id = p_departemen_id,
        jabatan_id = p_jabatan_id,
        kategori_ptkp_id = v_ptkp,
        tipe = p_tipe,
        tanggal_masuk = p_tanggal_masuk,
        rekening_nama_bank = btrim(p_rekening_nama_bank),
        rekening_nomor = btrim(p_rekening_nomor),
        rekening_nama_pemilik = btrim(p_rekening_nama_pemilik),
        updated_by = v_actor,
        updated_at = now()
    where id = p_id;

    insert into public.karyawan_riwayat_status (karyawan_id, aksi, status_lama, status_baru, actor_id)
    values (p_id, 'UBAH', v_status, v_status, v_actor);
end;
$$;

create or replace function public.tambah_gaji_pokok(
    p_karyawan_id uuid,
    p_nominal numeric,
    p_tanggal_berlaku date
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
    perform public.gj001_assert_hr();

    if not exists (select 1 from public.karyawan where id = p_karyawan_id) then
        raise exception 'Karyawan tidak ditemukan.';
    end if;

    if exists (
        select 1 from public.gaji_pokok_histori
        where karyawan_id = p_karyawan_id and tanggal_berlaku = p_tanggal_berlaku
    ) then
        raise exception 'Sudah ada gaji pokok yang berlaku pada %.', to_char(p_tanggal_berlaku, 'DD-MM-YYYY')
            using errcode = '23505';
    end if;

    insert into public.gaji_pokok_histori (karyawan_id, nominal, tanggal_berlaku, created_by, updated_by)
    values (p_karyawan_id, p_nominal, p_tanggal_berlaku, v_actor, v_actor)
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function public.nonaktifkan_karyawan(
    p_id uuid,
    p_tanggal_keluar date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_status text;
    v_actor uuid := auth.uid();
begin
    perform public.gj001_assert_hr();

    select status into v_status from public.karyawan where id = p_id for update;
    if v_status is null then
        raise exception 'Karyawan tidak ditemukan.';
    end if;
    if v_status = 'NONAKTIF' then
        raise exception 'Karyawan ini sudah nonaktif.';
    end if;

    update public.karyawan
    set status = 'NONAKTIF', tanggal_keluar = p_tanggal_keluar, updated_by = v_actor, updated_at = now()
    where id = p_id;

    insert into public.karyawan_riwayat_status (karyawan_id, aksi, status_lama, status_baru, tanggal_keluar, actor_id)
    values (p_id, 'NONAKTIFKAN', 'AKTIF', 'NONAKTIF', p_tanggal_keluar, v_actor);
end;
$$;

revoke all on function public.create_karyawan(text, text, uuid, uuid, text, text, date, text, text, text, numeric, date) from public, anon;
revoke all on function public.update_karyawan(uuid, text, uuid, uuid, text, text, date, text, text, text) from public, anon;
revoke all on function public.tambah_gaji_pokok(uuid, numeric, date) from public, anon;
revoke all on function public.nonaktifkan_karyawan(uuid, date) from public, anon;
grant execute on function public.create_karyawan(text, text, uuid, uuid, text, text, date, text, text, text, numeric, date) to authenticated;
grant execute on function public.update_karyawan(uuid, text, uuid, uuid, text, text, date, text, text, text) to authenticated;
grant execute on function public.tambah_gaji_pokok(uuid, numeric, date) to authenticated;
grant execute on function public.nonaktifkan_karyawan(uuid, date) to authenticated;
