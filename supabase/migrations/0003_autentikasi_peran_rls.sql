-- FND-003: Autentikasi & 13 peran staf dengan RLS

-- 1. Perluas tabel profiles
alter table public.profiles
  add column if not exists peran text,
  add column if not exists aktif boolean not null default true,
  add column if not exists karyawan_id uuid,
  add column if not exists updated_by uuid references auth.users (id);

-- Constraint ck_profiles_peran: tepat 13 peran yang sah atau null (tanpa peran)
alter table public.profiles
  drop constraint if exists ck_profiles_peran;

alter table public.profiles
  add constraint ck_profiles_peran check (
    peran is null or peran in (
      'Penjualan',
      'Pengiriman',
      'Gudang',
      'Purchasing',
      'QC',
      'Produksi',
      'Accounting',
      'Finance',
      'Manajemen',
      'Direksi',
      'HR',
      'Supervisor Lapangan',
      'Karyawan'
    )
  );

-- Trigger untuk memperbarui updated_at di profiles
create or replace function public.handle_profile_updated()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
before update on public.profiles
for each row execute procedure public.handle_profile_updated();

-- 2. Trigger pencabutan sesi aktif jika peran berubah atau akun dinonaktifkan (D-48, AC-05)
create or replace function public.handle_profile_session_revocation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.peran is distinct from new.peran or old.aktif is distinct from new.aktif then
    delete from auth.sessions where user_id = new.id;
  end if;
  if old.aktif is distinct from new.aktif then
    update auth.users
    set banned_until = case when new.aktif then null else '9999-12-31 23:59:59+00'::timestamptz end
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_session_revocation on public.profiles;
create trigger on_profile_session_revocation
after update on public.profiles
for each row execute procedure public.handle_profile_session_revocation();

-- 3. Fungsi pembantu RLS
create or replace function public.current_peran()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select peran
  from public.profiles
  where id = (select auth.uid()) and aktif = true;
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and aktif = true
      and peran is not null
      and peran <> 'Karyawan'
  );
$$;

-- 4. Kebijakan RLS untuk profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and peran is not distinct from (select p.peran from public.profiles p where p.id = (select auth.uid()))
  and aktif is not distinct from (select p.aktif from public.profiles p where p.id = (select auth.uid()))
  and karyawan_id is not distinct from (select p.karyawan_id from public.profiles p where p.id = (select auth.uid()))
);

-- 5. Kebijakan RLS untuk tabel domain inti (satuan, produk, gudang)
alter table public.satuan enable row level security;
alter table public.produk enable row level security;
alter table public.gudang enable row level security;

drop policy if exists "Staff can view satuan" on public.satuan;
drop policy if exists "Produksi can insert satuan" on public.satuan;
drop policy if exists "Produksi can update satuan" on public.satuan;

create policy "Staff can view satuan"
on public.satuan for select
to authenticated
using (public.is_active_staff());

create policy "Produksi can insert satuan"
on public.satuan for insert
to authenticated
with check (public.current_peran() = 'Produksi');

create policy "Produksi can update satuan"
on public.satuan for update
to authenticated
using (public.current_peran() = 'Produksi')
with check (public.current_peran() = 'Produksi');

drop policy if exists "Staff can view produk" on public.produk;
drop policy if exists "Produksi can insert produk" on public.produk;
drop policy if exists "Produksi can update produk" on public.produk;

create policy "Staff can view produk"
on public.produk for select
to authenticated
using (public.is_active_staff());

create policy "Produksi can insert produk"
on public.produk for insert
to authenticated
with check (public.current_peran() = 'Produksi');

create policy "Produksi can update produk"
on public.produk for update
to authenticated
using (public.current_peran() = 'Produksi')
with check (public.current_peran() = 'Produksi');

drop policy if exists "Staff can view gudang" on public.gudang;
drop policy if exists "Gudang can insert gudang" on public.gudang;
drop policy if exists "Gudang can update gudang" on public.gudang;

create policy "Staff can view gudang"
on public.gudang for select
to authenticated
using (public.is_active_staff());

create policy "Gudang can insert gudang"
on public.gudang for insert
to authenticated
with check (public.current_peran() = 'Gudang');

create policy "Gudang can update gudang"
on public.gudang for update
to authenticated
using (public.current_peran() = 'Gudang')
with check (public.current_peran() = 'Gudang');
