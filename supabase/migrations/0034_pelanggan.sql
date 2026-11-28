-- PD-001: Master pelanggan, termin, dan batas kredit (core-owned).
-- Nomor migrasi: 0011 (melanjutkan 0010_pg001_nominal_as_text.sql).

create sequence if not exists public.pelanggan_kode_seq;

create table if not exists public.pelanggan (
    id uuid primary key default gen_random_uuid(),
    kode_pelanggan text not null default (
        'PLG-' || lpad(nextval('public.pelanggan_kode_seq')::text, 6, '0')
    ),
    nama text not null,
    termin_hari integer not null default 30,
    batas_kredit numeric(18, 2) not null default 0,
    npwp text,
    alamat text,
    telepon text,
    email text,
    status text not null default 'aktif',
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_pelanggan_kode unique (kode_pelanggan),
    constraint ck_pelanggan_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_pelanggan_termin check (termin_hari >= 0),
    constraint ck_pelanggan_batas_kredit check (batas_kredit >= 0),
    constraint ck_pelanggan_status check (status in ('aktif', 'nonaktif'))
);

create index if not exists idx_pelanggan_nama on public.pelanggan (lower(nama));
create index if not exists idx_pelanggan_status on public.pelanggan (status);

create or replace function public.trg_pelanggan_no_delete()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Pelanggan tidak bisa dihapus. Nonaktifkan pelanggan.';
end;
$$;

drop trigger if exists trg_pelanggan_no_delete on public.pelanggan;
create trigger trg_pelanggan_no_delete
before delete on public.pelanggan
for each row execute function public.trg_pelanggan_no_delete();

create or replace function public.trg_pelanggan_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_pelanggan_updated_at on public.pelanggan;
create trigger trg_pelanggan_updated_at
before update on public.pelanggan
for each row execute function public.trg_pelanggan_updated_at();

alter table public.pelanggan enable row level security;

revoke all on public.pelanggan from anon, authenticated;
grant all on public.pelanggan to service_role;

revoke all on sequence public.pelanggan_kode_seq from anon, authenticated;
grant usage, select on sequence public.pelanggan_kode_seq to service_role;
