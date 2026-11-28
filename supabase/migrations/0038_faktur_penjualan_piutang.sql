-- PD-005: Faktur Penjualan dan Piutang Usaha
-- Nomor migrasi: 0015 (melanjutkan 0014_pengiriman_surat_jalan.sql).

-- 1. Daftarkan jenis dokumen 'FP' di core/dokumen jika belum ada
insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('FP', 'Faktur Penjualan', 'DRAFT', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('FP', 'DRAFT', 1),
    ('FP', 'DITERBITKAN', 2),
    ('FP', 'SEBAGIAN_LUNAS', 3),
    ('FP', 'LUNAS', 4),
    ('FP', 'DIBATALKAN', 5)
on conflict (tipe, status) do nothing;

-- 2. Daftarkan transisi dokumen sah untuk faktur
insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan)
values
    ('DRAFT', 'DITERBITKAN', 'TERBITKAN', false),
    ('DITERBITKAN', 'SEBAGIAN_LUNAS', 'BAYAR', false),
    ('DITERBITKAN', 'LUNAS', 'BAYAR', false),
    ('SEBAGIAN_LUNAS', 'LUNAS', 'BAYAR', false),
    ('DRAFT', 'DIBATALKAN', 'BATAL', true),
    ('DITERBITKAN', 'DIBATALKAN', 'BATAL', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- 3. Pastikan akun peran 'ppn_keluaran' terdaftar di COA ledger dan sumber jurnal 'FAKTUR'
insert into public.akun (nomor, nama, peran, aktif)
values ('205', 'PPN Keluaran', 'ppn_keluaran', true)
on conflict (peran) do nothing;

insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('FAKTUR', 'Faktur Penjualan', array['Accounting'])
on conflict (kode) do nothing;

grant all on public.periode_akuntansi to service_role;

-- 4. Buat tabel header faktur penjualan
create table if not exists public.faktur (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid references public.dokumen (id),
    nomor text not null,
    pengiriman_id uuid not null references public.pengiriman (id),
    pesanan_id uuid not null references public.pesanan (id),
    pelanggan_id uuid not null references public.pelanggan (id),
    tanggal_faktur date not null default current_date,
    termin_hari integer not null default 30,
    jatuh_tempo date not null,
    nomor_faktur_pajak text,
    dpp numeric(18, 2) not null default 0,
    tarif_ppn numeric(5, 4) not null default 0.1100,
    ppn numeric(18, 2) not null default 0,
    total numeric(18, 2) not null default 0,
    sisa_piutang numeric(18, 2) not null default 0,
    status text not null default 'DRAFT' references public.status_dokumen_sah (status),
    jurnal_id uuid references public.jurnal (id),
    jurnal_pembalik_id uuid references public.jurnal (id),
    alasan_batal text,
    created_by uuid references auth.users (id),
    created_at timestamptz not null default now(),
    updated_by uuid references auth.users (id),
    updated_at timestamptz not null default now(),

    constraint uq_faktur_nomor unique (nomor),
    constraint ck_faktur_termin check (termin_hari >= 0),
    constraint ck_faktur_nilai check (
        dpp >= 0 and ppn >= 0 and total >= 0 and sisa_piutang >= 0 and sisa_piutang <= total
    ),
    constraint ck_faktur_status check (
        status in ('DRAFT', 'DITERBITKAN', 'SEBAGIAN_LUNAS', 'LUNAS', 'DIBATALKAN')
    ),
    constraint ck_faktur_batal check (
        (status = 'DIBATALKAN' and alasan_batal is not null and length(btrim(alasan_batal)) > 0)
        or (status <> 'DIBATALKAN')
    )
);

-- Enforce INV-01: Satu pengiriman hanya boleh memiliki satu faktur aktif (non-DIBATALKAN)
create unique index if not exists uq_faktur_pengiriman_aktif
on public.faktur (pengiriman_id)
where status <> 'DIBATALKAN';

create index if not exists idx_faktur_dokumen on public.faktur (dokumen_id);
create index if not exists idx_faktur_pengiriman on public.faktur (pengiriman_id);
create index if not exists idx_faktur_pesanan on public.faktur (pesanan_id);
create index if not exists idx_faktur_pelanggan on public.faktur (pelanggan_id);
create index if not exists idx_faktur_status on public.faktur (status);
create index if not exists idx_faktur_jatuh_tempo on public.faktur (jatuh_tempo);
create index if not exists idx_faktur_piutang on public.faktur (pelanggan_id, status, jatuh_tempo);

-- 5. Buat tabel rincian item faktur penjualan
create table if not exists public.faktur_item (
    id uuid primary key default gen_random_uuid(),
    faktur_id uuid not null references public.faktur (id) on delete cascade,
    pengiriman_item_id uuid not null references public.pengiriman_item (id),
    pesanan_item_id uuid not null references public.pesanan_item (id),
    produk_id uuid not null references public.produk (id),
    qty numeric(15, 4) not null check (qty > 0),
    harga_satuan numeric(18, 4) not null check (harga_satuan >= 0),
    diskon_persen numeric(5, 2) not null default 0 check (diskon_persen >= 0 and diskon_persen <= 100),
    nilai_kotor numeric(18, 2) not null check (nilai_kotor >= 0),
    nilai_diskon numeric(18, 2) not null default 0 check (nilai_diskon >= 0),
    dpp numeric(18, 2) not null check (dpp >= 0),
    ppn numeric(18, 2) not null check (ppn >= 0),
    total numeric(18, 2) not null check (total >= 0),
    created_at timestamptz not null default now()
);

create index if not exists idx_faktur_item_faktur on public.faktur_item (faktur_id);
create index if not exists idx_faktur_item_pengiriman_item on public.faktur_item (pengiriman_item_id);
create index if not exists idx_faktur_item_produk on public.faktur_item (produk_id);

-- 6. Trigger anti-delete faktur (INV-03)
create or replace function public.fn_guard_faktur_integrity()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'DELETE' then
        if old.status in ('DITERBITKAN', 'SEBAGIAN_LUNAS', 'LUNAS') then
            raise exception 'Faktur yang sudah diterbitkan tidak dapat dihapus.';
        end if;
        return old;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_guard_faktur_integrity on public.faktur;
create trigger trg_guard_faktur_integrity
before delete on public.faktur
for each row execute function public.fn_guard_faktur_integrity();

-- 7. RLS
alter table public.faktur enable row level security;
alter table public.faktur_item enable row level security;

revoke all on public.faktur from anon, authenticated;
grant select on public.faktur to anon, authenticated;
grant all on public.faktur to service_role;

revoke all on public.faktur_item from anon, authenticated;
grant select on public.faktur_item to anon, authenticated;
grant all on public.faktur_item to service_role;
