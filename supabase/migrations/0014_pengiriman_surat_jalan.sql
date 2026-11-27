-- PD-004: Pengiriman dan Surat Jalan
-- Nomor migrasi: 0014 (melanjutkan 0013_alokasi_stok.sql).

-- 1. Daftarkan jenis dokumen 'SJ' di core/dokumen jika belum ada
insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('SJ', 'Surat Jalan / Pengiriman', 'DRAFT', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('SJ', 'DRAFT', 1),
    ('SJ', 'DIKIRIM', 2),
    ('SJ', 'DITERIMA', 3),
    ('SJ', 'DIBATALKAN', 4)
on conflict (tipe, status) do nothing;

-- Daftarkan transisi dokumen sah untuk pengiriman jika belum ada
insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan)
values
    ('DRAFT', 'DIKIRIM', 'KIRIM', false),
    ('DIKIRIM', 'DITERIMA', 'TERIMA', false),
    ('DRAFT', 'DIBATALKAN', 'BATAL', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- 2. Buat tabel header pengiriman
create table if not exists public.pengiriman (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid references public.dokumen (id),
    nomor text not null,
    pesanan_id uuid not null references public.pesanan (id),
    tanggal_pengiriman date not null default current_date,
    status text not null default 'DRAFT' references public.status_dokumen_sah (status),
    keterangan text,
    tanggal_terima date,
    nama_penerima text,
    alasan_batal text,
    created_by uuid references auth.users (id),
    created_at timestamptz not null default now(),
    updated_by uuid references auth.users (id),
    updated_at timestamptz not null default now(),

    constraint uq_pengiriman_nomor unique (nomor),
    constraint ck_pengiriman_status check (status in ('DRAFT', 'DIKIRIM', 'DITERIMA', 'DIBATALKAN')),
    constraint ck_pengiriman_batal check (
        (status = 'DIBATALKAN' and alasan_batal is not null and length(btrim(alasan_batal)) > 0)
        or (status <> 'DIBATALKAN')
    ),
    constraint ck_pengiriman_terima check (
        (status = 'DITERIMA' and tanggal_terima is not null and nama_penerima is not null and length(btrim(nama_penerima)) > 0)
        or (status <> 'DITERIMA')
    )
);

create index if not exists idx_pengiriman_dokumen on public.pengiriman (dokumen_id);
create index if not exists idx_pengiriman_pesanan on public.pengiriman (pesanan_id);
create index if not exists idx_pengiriman_status on public.pengiriman (status);
create index if not exists idx_pengiriman_tanggal on public.pengiriman (tanggal_pengiriman desc);

-- 3. Buat tabel rincian item pengiriman
create table if not exists public.pengiriman_item (
    id uuid primary key default gen_random_uuid(),
    pengiriman_id uuid not null references public.pengiriman (id) on delete cascade,
    pesanan_item_id uuid not null references public.pesanan_item (id),
    produk_id uuid not null references public.produk (id),
    gudang_id uuid not null references public.gudang (id),
    qty numeric(15, 4) not null check (qty > 0),
    created_at timestamptz not null default now()
);

create index if not exists idx_pengiriman_item_pengiriman on public.pengiriman_item (pengiriman_id);
create index if not exists idx_pengiriman_item_pesanan_item on public.pengiriman_item (pesanan_item_id);
create index if not exists idx_pengiriman_item_produk_gudang on public.pengiriman_item (produk_id, gudang_id);

-- 4. Anti-delete dan anti-update trigger untuk menjaga invariant pengiriman (INV-03)
create or replace function public.fn_guard_pengiriman_integrity()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'DELETE' then
        if old.status in ('DIKIRIM', 'DITERIMA') then
            raise exception 'Pengiriman yang sudah dikirim tidak dapat dihapus.';
        end if;
        return old;
    elsif tg_op = 'UPDATE' then
        if old.status in ('DIKIRIM', 'DITERIMA') then
            if old.status = 'DIKIRIM' and new.status = 'DITERIMA' then
                if old.pesanan_id <> new.pesanan_id or old.nomor <> new.nomor then
                    raise exception 'Data inti pengiriman yang sudah dikirim tidak dapat diubah.';
                end if;
            elsif old.status = new.status then
                if old.pesanan_id <> new.pesanan_id or old.nomor <> new.nomor then
                    raise exception 'Pengiriman sudah dikirim dan tidak dapat diubah.';
                end if;
            else
                raise exception 'Pengiriman sudah dikirim dan tidak dapat diubah statusnya secara langsung.';
            end if;
        end if;
        return new;
    end if;
    return null;
end;
$$;

drop trigger if exists trg_guard_pengiriman_integrity on public.pengiriman;
create trigger trg_guard_pengiriman_integrity
before update or delete on public.pengiriman
for each row execute function public.fn_guard_pengiriman_integrity();

create or replace function public.fn_guard_pengiriman_item_integrity()
returns trigger
language plpgsql
as $$
declare
    v_status text;
begin
    if tg_op = 'DELETE' then
        select status into v_status from public.pengiriman where id = old.pengiriman_id;
        if v_status in ('DIKIRIM', 'DITERIMA') then
            raise exception 'Item pengiriman yang sudah dikirim tidak dapat dihapus.';
        end if;
        return old;
    elsif tg_op in ('UPDATE', 'INSERT') then
        select status into v_status from public.pengiriman where id = new.pengiriman_id;
        if v_status in ('DIKIRIM', 'DITERIMA') then
            raise exception 'Pengiriman sudah dikirim dan item tidak dapat diubah.';
        end if;
        return new;
    end if;
    return null;
end;
$$;

drop trigger if exists trg_guard_pengiriman_item_integrity on public.pengiriman_item;
create trigger trg_guard_pengiriman_item_integrity
before insert or update or delete on public.pengiriman_item
for each row execute function public.fn_guard_pengiriman_item_integrity();

-- 5. RLS
alter table public.pengiriman enable row level security;
alter table public.pengiriman_item enable row level security;

revoke all on public.pengiriman from anon, authenticated;
grant select on public.pengiriman to anon, authenticated;
grant all on public.pengiriman to service_role;

revoke all on public.pengiriman_item from anon, authenticated;
grant select on public.pengiriman_item to anon, authenticated;
grant all on public.pengiriman_item to service_role;
