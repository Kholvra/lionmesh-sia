-- PD-002: Pesanan Penjualan dan Cek Batas Kredit
-- Nomor migrasi: 0012 (melanjutkan 0011_pelanggan.sql).

-- 1. Konfigurasi Pajak (PPN berversi D-51a)
create table if not exists public.konfigurasi_pajak (
    id uuid primary key default gen_random_uuid(),
    kode text not null unique,
    nama text not null,
    tarif numeric(5, 4) not null,
    berlaku_mulai date not null,
    berlaku_sampai date,
    aktif boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_pajak_tarif check (tarif >= 0 and tarif <= 1)
);

insert into public.konfigurasi_pajak (kode, nama, tarif, berlaku_mulai, aktif)
values ('PPN', 'Pajak Pertambahan Nilai', 0.1100, '2022-04-01', true)
on conflict (kode) do nothing;

-- 2. Daftarkan jenis dokumen 'SO' di core/dokumen jika belum ada
insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('SO', 'Pesanan Penjualan', 'DRAFT', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('SO', 'DRAFT', 1),
    ('SO', 'REVISI', 2),
    ('SO', 'VERIFIED', 3),
    ('SO', 'MENUNGGU_PERSETUJUAN_KREDIT', 4),
    ('SO', 'MENUNGGU_STOK', 5),
    ('SO', 'SIAP_KIRIM', 6),
    ('SO', 'TERKIRIM_SEBAGIAN', 7),
    ('SO', 'TERKIRIM', 8),
    ('SO', 'DIFAKTURKAN', 9),
    ('SO', 'SELESAI', 10),
    ('SO', 'DIBATALKAN', 11)
on conflict (tipe, status) do nothing;

-- 3. Header Pesanan Penjualan
create table if not exists public.pesanan (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid references public.dokumen (id),
    nomor text not null,
    tanggal date not null default current_date,
    pelanggan_id uuid not null references public.pelanggan (id),
    termin_hari integer not null default 30,
    status text not null default 'DRAFT' references public.status_dokumen_sah (status),
    nilai_kotor numeric(18, 2) not null default 0,
    diskon_total numeric(18, 2) not null default 0,
    dpp numeric(18, 2) not null default 0,
    ppn numeric(18, 2) not null default 0,
    total numeric(18, 2) not null default 0,
    tarif_ppn numeric(5, 4) not null default 0.1100,
    alasan_batal text,
    alasan_revisi text,
    alasan_override text,
    created_by uuid not null,
    created_at timestamptz not null default now(),
    verified_by uuid,
    verified_at timestamptz,
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_pesanan_nomor unique (nomor),
    constraint ck_pesanan_termin check (termin_hari >= 0),
    constraint ck_pesanan_nilai check (
        nilai_kotor >= 0 and diskon_total >= 0 and dpp >= 0 and ppn >= 0 and total >= 0
    )
);

create index if not exists idx_pesanan_pelanggan on public.pesanan (pelanggan_id);
create index if not exists idx_pesanan_status on public.pesanan (status);
create index if not exists idx_pesanan_tanggal on public.pesanan (tanggal desc);

-- 4. Detail Baris Pesanan
create table if not exists public.pesanan_item (
    id uuid primary key default gen_random_uuid(),
    pesanan_id uuid not null references public.pesanan (id) on delete cascade,
    produk_id uuid not null references public.produk (id),
    urutan integer not null default 1,
    qty numeric(18, 4) not null,
    harga_satuan numeric(18, 4) not null,
    diskon_persen numeric(5, 2) not null default 0,
    nilai_kotor numeric(18, 2) not null default 0,
    diskon_nilai numeric(18, 2) not null default 0,
    dpp numeric(18, 2) not null default 0,
    ppn numeric(18, 2) not null default 0,
    total numeric(18, 2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ck_pesanan_item_qty check (qty > 0),
    constraint ck_pesanan_item_harga check (harga_satuan >= 0),
    constraint ck_pesanan_item_diskon check (diskon_persen >= 0 and diskon_persen <= 100)
);

create index if not exists idx_pesanan_item_pesanan on public.pesanan_item (pesanan_id, urutan);

-- 5. Anti-delete trigger: Dokumen pesanan tidak boleh di-delete fisik (INV-02)
create or replace function public.trg_pesanan_no_delete()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Pesanan tidak bisa dihapus. Batalkan pesanan.';
end;
$$;

drop trigger if exists trg_pesanan_no_delete on public.pesanan;
create trigger trg_pesanan_no_delete
before delete on public.pesanan
for each row execute function public.trg_pesanan_no_delete();

-- 6. Immutability trigger: Pesanan VERIFIED tidak boleh diubah baris atau nilainya (INV-05)
create or replace function public.trg_pesanan_lock_verified()
returns trigger
language plpgsql
as $$
begin
    if old.status in ('VERIFIED', 'MENUNGGU_STOK', 'SIAP_KIRIM', 'TERKIRIM_SEBAGIAN', 'TERKIRIM', 'DIFAKTURKAN', 'SELESAI') then
        if new.nilai_kotor != old.nilai_kotor or new.total != old.total or new.pelanggan_id != old.pelanggan_id then
            raise exception 'Pesanan yang sudah diverifikasi tidak dapat diubah isinya.';
        end if;
    end if;
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_pesanan_lock_verified on public.pesanan;
create trigger trg_pesanan_lock_verified
before update on public.pesanan
for each row execute function public.trg_pesanan_lock_verified();

create or replace function public.trg_pesanan_item_lock_verified()
returns trigger
language plpgsql
as $$
declare
    v_status text;
begin
    select status into v_status from public.pesanan where id = coalesce(new.pesanan_id, old.pesanan_id);
    if v_status in ('VERIFIED', 'MENUNGGU_STOK', 'SIAP_KIRIM', 'TERKIRIM_SEBAGIAN', 'TERKIRIM', 'DIFAKTURKAN', 'SELESAI') then
        raise exception 'Pesanan yang sudah diverifikasi tidak dapat diubah barisnya.';
    end if;
    return coalesce(new, old);
end;
$$;

drop trigger if exists trg_pesanan_item_lock_verified on public.pesanan_item;
create trigger trg_pesanan_item_lock_verified
before insert or update or delete on public.pesanan_item
for each row execute function public.trg_pesanan_item_lock_verified();

-- 7. Permissions & RLS
alter table public.konfigurasi_pajak enable row level security;
alter table public.pesanan enable row level security;
alter table public.pesanan_item enable row level security;

revoke all on public.konfigurasi_pajak from anon, authenticated;
grant select on public.konfigurasi_pajak to anon, authenticated;
grant all on public.konfigurasi_pajak to service_role;

revoke all on public.pesanan from anon, authenticated;
grant all on public.pesanan to service_role;

revoke all on public.pesanan_item from anon, authenticated;
grant all on public.pesanan_item to service_role;
