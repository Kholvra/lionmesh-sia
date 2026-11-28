-- C-010 — Usulan DDL (disetujui; diterapkan sebagai migrasi 0015)
-- Item: C-010 Tutup buku dan jurnal penutup
-- Status: disetujui; diterapkan sebagai supabase/migrations/0015_c010_tutup_buku.sql.
--
-- Ruang lingkup proposal:
--   1. public.tahun_buku
--   2. public.periode_akuntansi_riwayat_status (pola D-63)
--   3. public.tahun_buku_riwayat_status (pola D-63)
--   4. baris public.jenis_sumber_jurnal 'TUTUP_BUKU'
--
-- Tidak termasuk:
--   - perubahan tabel/RPC FND-006 (periode_akuntansi, jurnal, detail_jurnal,
--     akun, post_journal, reverse_journal);
--   - RPC tutup_periode() dan tutup_buku_tahunan() diimplementasikan di
--     supabase/migrations/0015_c010_tutup_buku.sql; kontraknya ada di bagian 6.
--
-- Catatan: bagian 1-5 adalah DDL yang sama dengan migrasi 0015; bagian 6
-- adalah kontrak RPC, bukan salinan implementasi SQL.
--
-- Aturan yang mendasari: D-07, D-32, D-41, D-43, D-44 (4)-(5), D-50, D-58,
-- D-63, dan D-68.

-- ---------------------------------------------------------------------------
-- 1. Tahun buku
-- ---------------------------------------------------------------------------

create table public.tahun_buku (
    id uuid primary key default gen_random_uuid(),
    tahun integer not null,
    status text not null default 'terbuka',
    ditutup_at timestamptz,
    ditutup_oleh uuid,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_tahun_buku_tahun unique (tahun),
    constraint ck_tahun_buku_tahun check (tahun between 2000 and 9999),
    constraint ck_tahun_buku_status check (status in ('terbuka', 'ditutup')),
    constraint ck_tahun_buku_ditutup check (
        (status = 'terbuka' and ditutup_at is null and ditutup_oleh is null)
        or (status = 'ditutup' and ditutup_at is not null and ditutup_oleh is not null)
    )
);

comment on table public.tahun_buku is
    'Status tahun buku C-010. Baris dibuat saat tutup tahun dimulai; status awal terbuka.';

-- ---------------------------------------------------------------------------
-- 2. Riwayat status periode akuntansi (append-only, pola D-63)
-- ---------------------------------------------------------------------------

create table public.periode_akuntansi_riwayat_status (
    id uuid primary key default gen_random_uuid(),
    tahun integer not null,
    bulan integer not null,
    aksi text not null,
    status_lama text,
    status_baru text not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint fk_periode_riwayat_periode foreign key (tahun, bulan)
        references public.periode_akuntansi (tahun, bulan),
    constraint ck_periode_riwayat_bulan check (bulan between 1 and 12),
    constraint ck_periode_riwayat_aksi check (aksi in ('BUAT', 'TUTUP_PERIODE')),
    constraint ck_periode_riwayat_status_lama check (
        status_lama is null or status_lama in ('buka', 'kunci')
    ),
    constraint ck_periode_riwayat_status_baru check (
        status_baru in ('buka', 'kunci')
    ),
    constraint ck_periode_riwayat_buat check (
        (aksi <> 'BUAT' or status_lama is null)
        and (aksi = 'BUAT' or status_lama is not null)
    ),
    constraint ck_periode_riwayat_tutup check (
        aksi <> 'TUTUP_PERIODE'
        or (status_lama = 'buka' and status_baru = 'kunci')
    )
);

create index idx_periode_riwayat_status_periode
on public.periode_akuntansi_riwayat_status (tahun, bulan, created_at, id);

comment on table public.periode_akuntansi_riwayat_status is
    'Jejak transisi status periode akuntansi; append-only, bukan riwayat_status dokumen (D-63, D-68).';

create or replace function public.trg_periode_akuntansi_riwayat_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    raise exception 'Riwayat status periode akuntansi tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_periode_akuntansi_riwayat_immutable
before update or delete on public.periode_akuntansi_riwayat_status
for each row execute function public.trg_periode_akuntansi_riwayat_immutable();

-- ---------------------------------------------------------------------------
-- 3. Riwayat status tahun buku (append-only, pola D-63)
-- ---------------------------------------------------------------------------

create table public.tahun_buku_riwayat_status (
    id uuid primary key default gen_random_uuid(),
    tahun_buku_id uuid not null references public.tahun_buku (id),
    aksi text not null,
    status_lama text,
    status_baru text not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_tahun_buku_riwayat_aksi check (aksi in ('BUAT', 'TUTUP_TAHUN')),
    constraint ck_tahun_buku_riwayat_status_lama check (
        status_lama is null or status_lama in ('terbuka', 'ditutup')
    ),
    constraint ck_tahun_buku_riwayat_status_baru check (
        status_baru in ('terbuka', 'ditutup')
    ),
    constraint ck_tahun_buku_riwayat_buat check (
        (aksi <> 'BUAT' or status_lama is null)
        and (aksi = 'BUAT' or status_lama is not null)
    ),
    constraint ck_tahun_buku_riwayat_tutup check (
        aksi <> 'TUTUP_TAHUN'
        or (status_lama = 'terbuka' and status_baru = 'ditutup')
    )
);

create index idx_tahun_buku_riwayat_status_tahun
on public.tahun_buku_riwayat_status (tahun_buku_id, created_at, id);

comment on table public.tahun_buku_riwayat_status is
    'Jejak transisi status tahun buku; append-only, pola D-63.';

create or replace function public.trg_tahun_buku_riwayat_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    raise exception 'Riwayat status tahun buku tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_tahun_buku_riwayat_immutable
before update or delete on public.tahun_buku_riwayat_status
for each row execute function public.trg_tahun_buku_riwayat_immutable();

-- ---------------------------------------------------------------------------
-- 4. Sumber jurnal penutup
-- ---------------------------------------------------------------------------

insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('TUTUP_BUKU', 'Tutup buku tahunan', array['Accounting'])
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------------
-- 5. RLS dan grant
-- ---------------------------------------------------------------------------

alter table public.tahun_buku enable row level security;
alter table public.periode_akuntansi_riwayat_status enable row level security;
alter table public.tahun_buku_riwayat_status enable row level security;

revoke all on public.tahun_buku, public.periode_akuntansi_riwayat_status,
    public.tahun_buku_riwayat_status
from public, anon, authenticated, service_role;

grant select on public.tahun_buku, public.periode_akuntansi_riwayat_status,
    public.tahun_buku_riwayat_status
to authenticated, service_role;

create policy "Staf aktif boleh baca tahun buku"
on public.tahun_buku for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca riwayat periode akuntansi"
on public.periode_akuntansi_riwayat_status for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca riwayat tahun buku"
on public.tahun_buku_riwayat_status for select
to authenticated
using (public.is_active_staff());

-- ---------------------------------------------------------------------------
-- 6. Kontrak RPC (implementasi di migrasi 0015)
-- ---------------------------------------------------------------------------
--
-- public.tutup_periode(p_tahun integer, p_bulan integer, p_actor_id uuid)
--   returns jsonb
--   - Aktor aktif dan berperan Accounting; selain itu ditolak.
--   - p_tahun 2000-9999, p_bulan 1-12.
--   - Desember ditolak: "Desember ditutup lewat tutup buku tahunan." (D-68)
--   - Target yang sudah 'kunci' ditolak; status tidak berubah.
--   - Januari menuntut tahun_buku tahun sebelumnya 'ditutup' bila tahun itu
--     punya aktivitas (periode_akuntansi atau tahun_buku). Tahun pertama tanpa
--     aktivitas sebelumnya boleh.
--   - Bulan < target yang belum punya baris periode_akuntansi dibuat 'buka'
--     (riwayat BUAT) lalu langsung dikunci (riwayat TUTUP_PERIODE). Bulan yang
--     ada dan masih 'buka' menolak; pesan menyebut bulan pemblokir paling awal.
--   - Prasyarat D-50 untuk bulan target: neraca saldo balance sampai akhir
--     bulan; tidak ada dokumen setengah posting di bulan itu.
--   - Target dikunci, dikunci_at/dikunci_oleh diisi, riwayat TUTUP_PERIODE
--     dicatat. Satu transaksi.
--
-- public.tutup_buku_tahunan(p_tahun integer, p_actor_id uuid)
--   returns jsonb
--   - Aktor aktif dan berperan Accounting; selain itu ditolak.
--   - Tahun yang sudah 'ditutup' ditolak.
--   - Januari-November: bulan tanpa baris dibuat + dikunci; bulan 'buka'
--     menolak dengan pesan bulan pemblokir paling awal.
--   - Desember: harus 'buka' atau belum ada. Desember 'kunci' ditolak karena
--     jurnal penutup tidak bisa masuk ke periode terkunci (D-68).
--   - Prasyarat D-50 untuk Desember dan bulan yang baru dikunci: neraca saldo
--     balance sampai 31 Desember; tidak ada dokumen setengah posting.
--   - Hitung saldo akun nominal 401/501/601/602/701 (peran penjualan, hpp,
--     tenaga_kerja_langsung, overhead_pabrik, beban_gaji_admin) sampai
--     31 Desember. 702 dicadangkan dan tidak diikutkan.
--   - Bila ada saldo: panggil public.post_journal() dengan sumber TUTUP_BUKU,
--     sumber_id = tahun_buku.id, tanggal 31 Desember 23:59:59 Asia/Jakarta,
--     dan baris penutup ke 302 Laba ditahan. Bila semua saldo nol: tidak ada
--     jurnal penutup (bukan jurnal bernilai nol).
--   - Kunci Desember (riwayat TUTUP_PERIODE); ubah tahun_buku menjadi 'ditutup'
--     (riwayat TUTUP_TAHUN). Satu transaksi dengan post_journal().
--
-- Kedua RPC: security definer, search_path = pg_catalog, public; revoke dari
-- public/anon/authenticated; grant execute hanya ke service_role.
