create table public.satuan (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_satuan_kode unique (kode),
    constraint ck_satuan_nama_not_blank check (length(btrim(nama)) > 0)
);

create table public.produk (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    satuan_dasar_id uuid not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_produk_kode unique (kode),
    constraint ck_produk_nama_not_blank check (length(btrim(nama)) > 0),
    constraint fk_produk_satuan_dasar foreign key (satuan_dasar_id) references public.satuan (id)
);

create index idx_produk_satuan_dasar_id on public.produk (satuan_dasar_id);

create table public.gudang (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_gudang_kode unique (kode),
    constraint ck_gudang_nama_not_blank check (length(btrim(nama)) > 0)
);
