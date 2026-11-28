-- PD-006: Penerimaan Pembayaran Pelanggan
-- Nomor migrasi: 0016 (melanjutkan 0015_faktur_penjualan_piutang.sql).

-- 1. Daftarkan jenis dokumen 'BKM' di core/dokumen jika belum ada
insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('BKM', 'Bukti Kas Masuk', 'DICATAT', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('BKM', 'DICATAT', 1),
    ('BKM', 'TERVERIFIKASI', 2),
    ('BKM', 'DIBATALKAN', 3)
on conflict (tipe, status) do nothing;

-- 2. Daftarkan transisi dokumen sah untuk BKM
insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan)
values
    ('DICATAT', 'TERVERIFIKASI', 'VERIFIKASI', false),
    ('DICATAT', 'DIBATALKAN', 'BATAL', true),
    ('TERVERIFIKASI', 'DIBATALKAN', 'BATAL', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- 3. Daftarkan sumber jurnal 'PENERIMAAN' di jenis_sumber_jurnal
insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('PENERIMAAN', 'Penerimaan Pembayaran Pelanggan', array['Accounting'])
on conflict (kode) do nothing;

-- 4. Buat tabel header pembayaran
create table if not exists public.pembayaran (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid references public.dokumen (id),
    nomor text not null,
    pelanggan_id uuid not null references public.pelanggan (id),
    tanggal date not null default current_date,
    nominal numeric(18, 2) not null,
    metode text not null,
    nomor_referensi text,
    status text not null default 'DICATAT' references public.status_dokumen_sah (status),
    jurnal_id uuid references public.jurnal (id),
    jurnal_pembalik_id uuid references public.jurnal (id),
    alasan_batal text,
    dibatalkan_oleh uuid references auth.users (id),
    dibatalkan_at timestamptz,
    diverifikasi_oleh uuid references auth.users (id),
    diverifikasi_at timestamptz,
    created_by uuid references auth.users (id),
    created_at timestamptz not null default now(),
    updated_by uuid references auth.users (id),
    updated_at timestamptz not null default now(),
    constraint ck_pembayaran_nominal_positif check (nominal > 0),
    constraint ck_pembayaran_metode check (metode in ('Transfer', 'Giro')),
    constraint ck_pembayaran_status check (status in ('DICATAT', 'TERVERIFIKASI', 'DIBATALKAN'))
);

create index if not exists idx_pembayaran_pelanggan on public.pembayaran (pelanggan_id);
create index if not exists idx_pembayaran_status on public.pembayaran (status);
create index if not exists idx_pembayaran_tanggal on public.pembayaran (tanggal);

-- 5. Buat tabel pembayaran_alokasi
create table if not exists public.pembayaran_alokasi (
    id uuid primary key default gen_random_uuid(),
    pembayaran_id uuid not null references public.pembayaran (id) on delete cascade,
    faktur_id uuid not null references public.faktur (id),
    nominal numeric(18, 2) not null,
    created_at timestamptz not null default now(),
    constraint ck_alokasi_nominal_positif check (nominal > 0)
);

create index if not exists idx_pembayaran_alokasi_pembayaran on public.pembayaran_alokasi (pembayaran_id);
create index if not exists idx_pembayaran_alokasi_faktur on public.pembayaran_alokasi (faktur_id);

-- 6. RLS & Permissions
alter table public.pembayaran enable row level security;
alter table public.pembayaran_alokasi enable row level security;

revoke all on public.pembayaran from public, anon, authenticated;
revoke all on public.pembayaran_alokasi from public, anon, authenticated;

grant select on public.pembayaran to authenticated;
grant select on public.pembayaran_alokasi to authenticated;
grant all on public.pembayaran to service_role;
grant all on public.pembayaran_alokasi to service_role;
