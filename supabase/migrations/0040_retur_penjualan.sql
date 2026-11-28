-- Migrasi 0017: Tabel Retur Penjualan dan Kredit Memo (PD-007)

-- 1. Daftarkan jenis dokumen 'RJ' di core/dokumen jika belum ada
insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('RJ', 'Retur Penjualan', 'DIAJUKAN', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('RJ', 'DIAJUKAN', 1),
    ('RJ', 'DISETUJUI', 2),
    ('RJ', 'SELESAI', 3),
    ('RJ', 'DITOLAK', 4),
    ('RJ', 'DIBATALKAN', 5)
on conflict (tipe, status) do nothing;

-- 2. Daftarkan transisi dokumen sah untuk RJ
insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan)
values
    ('DIAJUKAN', 'DISETUJUI', 'SETUJUI', false),
    ('DIAJUKAN', 'DITOLAK', 'TOLAK', true),
    ('DIAJUKAN', 'DIBATALKAN', 'BATAL', true),
    ('DISETUJUI', 'DIBATALKAN', 'BATAL', true),
    ('DISETUJUI', 'SELESAI', 'SELESAI', false),
    ('DISETUJUI', 'DITOLAK', 'TOLAK', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- 3. Daftarkan sumber jurnal 'RETUR' di jenis_sumber_jurnal
insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('RETUR', 'Retur Penjualan', array['Accounting', 'QC'])
on conflict (kode) do nothing;

-- 4. Pastikan akun peran untuk retur & HPP tersedia
insert into public.akun (nomor, nama, peran, aktif)
values
    ('401', 'Penjualan', 'penjualan', true),
    ('114', 'Persediaan Barang Jadi', 'persediaan_barang_jadi', true),
    ('501', 'Harga Pokok Penjualan', 'hpp', true)
on conflict (peran) do nothing;

-- 5. Buat tabel retur_penjualan
create table if not exists public.retur_penjualan (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid references public.dokumen (id),
    nomor text not null,
    faktur_id uuid not null references public.faktur (id),
    pelanggan_id uuid not null references public.pelanggan (id),
    tanggal date not null default current_date,
    alasan text not null,
    status text not null default 'DIAJUKAN' references public.status_dokumen_sah (status),
    disetujui_oleh uuid references auth.users (id),
    disetujui_at timestamptz,
    ditolak_oleh uuid references auth.users (id),
    ditolak_at timestamptz,
    alasan_tolak text,
    qc_diperiksa_oleh uuid references auth.users (id),
    qc_diperiksa_at timestamptz,
    qc_catatan text,
    total_dpp numeric(18, 2) not null default 0,
    total_ppn numeric(18, 2) not null default 0,
    total_kredit_memo numeric(18, 2) not null default 0,
    jurnal_kredit_memo_id uuid references public.jurnal (id),
    jurnal_hpp_id uuid references public.jurnal (id),
    created_by uuid references auth.users (id),
    created_at timestamptz not null default now(),
    updated_by uuid references auth.users (id),
    updated_at timestamptz not null default now(),
    constraint uq_retur_nomor unique (nomor),
    constraint ck_retur_status check (status in ('DIAJUKAN', 'DISETUJUI', 'SELESAI', 'DITOLAK', 'DIBATALKAN'))
);

create index if not exists idx_retur_faktur on public.retur_penjualan (faktur_id);
create index if not exists idx_retur_pelanggan on public.retur_penjualan (pelanggan_id);
create index if not exists idx_retur_status on public.retur_penjualan (status);

-- 6. Buat tabel retur_penjualan_item
create table if not exists public.retur_penjualan_item (
    id uuid primary key default gen_random_uuid(),
    retur_id uuid not null references public.retur_penjualan (id) on delete cascade,
    faktur_item_id uuid not null references public.faktur_item (id),
    produk_id uuid not null references public.produk (id),
    gudang_id uuid not null references public.gudang (id),
    qty_retur numeric(15, 4) not null,
    qty_lulus numeric(15, 4) not null default 0,
    harga_satuan numeric(18, 4) not null default 0,
    diskon_persen numeric(5, 2) not null default 0,
    dpp numeric(18, 2) not null default 0,
    ppn numeric(18, 2) not null default 0,
    total numeric(18, 2) not null default 0,
    nilai_masuk_stok numeric(18, 2) not null default 0,
    created_at timestamptz not null default now(),
    constraint ck_retur_item_qty check (qty_retur > 0),
    constraint ck_retur_item_qty_lulus check (qty_lulus >= 0 and qty_lulus <= qty_retur)
);

create index if not exists idx_retur_item_retur on public.retur_penjualan_item (retur_id);
create index if not exists idx_retur_item_faktur_item on public.retur_penjualan_item (faktur_item_id);

-- 7. RLS & Permissions
alter table public.retur_penjualan enable row level security;
alter table public.retur_penjualan_item enable row level security;

revoke all on public.retur_penjualan from public, anon, authenticated;
revoke all on public.retur_penjualan_item from public, anon, authenticated;

grant select on public.retur_penjualan to authenticated;
grant select on public.retur_penjualan_item to authenticated;
grant all on public.retur_penjualan to service_role;
grant all on public.retur_penjualan_item to service_role;

create policy "Staf aktif boleh baca retur penjualan"
on public.retur_penjualan for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca item retur penjualan"
on public.retur_penjualan_item for select
to authenticated
using (public.is_active_staff());
