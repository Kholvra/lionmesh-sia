-- PD-003: Alokasi / Reservasi Stok untuk Pesanan Penjualan
-- Nomor migrasi: 0013 (melanjutkan 0012_pesanan_penjualan.sql).

create table if not exists public.alokasi_stok (
    id uuid primary key default gen_random_uuid(),
    pesanan_id uuid not null references public.pesanan(id),
    pesanan_item_id uuid not null references public.pesanan_item(id),
    produk_id uuid not null references public.produk(id),
    gudang_id uuid not null references public.gudang(id),
    qty numeric(15, 4) not null check (qty > 0),
    status text not null default 'teralokasi' check (status in ('teralokasi', 'dilepas')),
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_by uuid references auth.users(id),
    updated_at timestamptz not null default now()
);

create index if not exists idx_alokasi_stok_pesanan on public.alokasi_stok (pesanan_id);
create index if not exists idx_alokasi_stok_item on public.alokasi_stok (pesanan_item_id);
create index if not exists idx_alokasi_stok_produk_gudang on public.alokasi_stok (produk_id, gudang_id, status);

alter table public.alokasi_stok enable row level security;
revoke all on public.alokasi_stok from anon, authenticated;
grant select on public.alokasi_stok to anon, authenticated;
grant all on public.alokasi_stok to service_role;
