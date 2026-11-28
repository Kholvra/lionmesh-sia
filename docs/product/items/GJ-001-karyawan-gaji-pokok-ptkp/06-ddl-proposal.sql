-- GJ-001: usulan DDL, bukan migrasi. Nomor migrasi ditetapkan tech lead (D-09).
-- Pemilik tabel: core (D-31). GJ-001 hanya item pertama yang membutuhkannya.
-- Konvensi: PK uuid, empat kolom audit dengan aktor uuid nullable tanpa FK
-- (D-32, FND-002 INV-05), uang numeric(18,2) (D-56), nama constraint uq_/ck_/fk_/idx_.

create table public.departemen (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_departemen_kode unique (kode),
    constraint ck_departemen_nama_not_blank check (length(btrim(nama)) > 0)
);

create table public.jabatan (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_jabatan_kode unique (kode),
    constraint ck_jabatan_nama_not_blank check (length(btrim(nama)) > 0)
);

-- Kategori PTKP (D-19); kode dipakai lookup kategori TER di GJ-004.
create table public.kategori_ptkp (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_kategori_ptkp_kode unique (kode),
    constraint ck_kategori_ptkp_kode check (kode ~ '^(TK|K)/[0-3]$'),
    constraint ck_kategori_ptkp_nama_not_blank check (length(btrim(nama)) > 0)
);

create table public.karyawan (
    id uuid primary key default gen_random_uuid(),
    nik text not null,
    nama text not null,
    departemen_id uuid not null,
    jabatan_id uuid not null,
    kategori_ptkp_id uuid not null,
    tipe text not null,
    tanggal_masuk date not null,
    tanggal_keluar date,
    status text not null default 'AKTIF',
    rekening_nama_bank text not null,
    rekening_nomor text not null,
    rekening_nama_pemilik text not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_karyawan_nik unique (nik),                                    -- AC-02
    constraint ck_karyawan_nik check (nik ~ '^[0-9]{16}$'),                     -- AC-14
    constraint ck_karyawan_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_karyawan_tipe check (tipe in ('PRODUKSI', 'NON_PRODUKSI')),
    constraint ck_karyawan_status check (status in ('AKTIF', 'NONAKTIF')),
    constraint ck_karyawan_keluar check (status = 'AKTIF' or tanggal_keluar is not null),
    constraint ck_karyawan_tanggal check (tanggal_keluar is null or tanggal_keluar >= tanggal_masuk),
    constraint ck_karyawan_bank_not_blank check (length(btrim(rekening_nama_bank)) > 0),   -- AC-15
    constraint ck_karyawan_rekening_nomor check (rekening_nomor ~ '^[0-9]+$'),
    constraint ck_karyawan_pemilik_not_blank check (length(btrim(rekening_nama_pemilik)) > 0),
    constraint fk_karyawan_departemen foreign key (departemen_id) references public.departemen (id),
    constraint fk_karyawan_jabatan foreign key (jabatan_id) references public.jabatan (id),
    constraint fk_karyawan_kategori_ptkp foreign key (kategori_ptkp_id) references public.kategori_ptkp (id)
);

create index idx_karyawan_departemen_id on public.karyawan (departemen_id);
create index idx_karyawan_jabatan_id on public.karyawan (jabatan_id);
create index idx_karyawan_kategori_ptkp_id on public.karyawan (kategori_ptkp_id);

-- Riwayat status karyawan (D-63, pola pemasok_riwayat_status di 0009): append-only.
-- public.riwayat_status tidak bisa dipakai karena terikat ke public.dokumen.
create table public.karyawan_riwayat_status (
    id uuid primary key default gen_random_uuid(),
    karyawan_id uuid not null references public.karyawan (id),
    aksi text not null,
    status_lama text,
    status_baru text not null,
    tanggal_keluar date,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_karyawan_riwayat_aksi check (aksi in ('BUAT', 'NONAKTIFKAN', 'AKTIFKAN')),
    constraint ck_karyawan_riwayat_status_baru check (status_baru in ('AKTIF', 'NONAKTIF')),
    constraint ck_karyawan_riwayat_buat check (
        (aksi <> 'BUAT' or status_lama is null)
        and (aksi = 'BUAT' or status_lama is not null)
    ),
    constraint ck_karyawan_riwayat_keluar check (aksi <> 'NONAKTIFKAN' or tanggal_keluar is not null)
);

create index idx_karyawan_riwayat_status_karyawan
on public.karyawan_riwayat_status (karyawan_id, created_at, id);

create or replace function public.trg_karyawan_riwayat_status_immutable()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Riwayat status karyawan tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_karyawan_riwayat_status_immutable
before update or delete on public.karyawan_riwayat_status
for each row
execute function public.trg_karyawan_riwayat_status_immutable();

-- Histori gaji pokok: hanya tambah (AC-03, AC-04). Koreksi = entri baru dengan
-- tanggal berlaku sesudahnya. Nominal rupiah bulat (D-51 b) disimpan numeric(18,2).
create table public.gaji_pokok_histori (
    id uuid primary key default gen_random_uuid(),
    karyawan_id uuid not null,
    nominal numeric(18,2) not null,
    tanggal_berlaku date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_gaji_pokok_histori_tanggal unique (karyawan_id, tanggal_berlaku),   -- AC-11
    constraint ck_gaji_pokok_histori_nominal check (nominal > 0 and nominal = trunc(nominal)),
    constraint fk_gaji_pokok_histori_karyawan foreign key (karyawan_id) references public.karyawan (id)
);

create or replace function public.trg_prevent_gaji_pokok_histori_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Histori gaji pokok tidak boleh diubah atau dihapus. Tambahkan entri baru.';
end;
$$;

create trigger trg_gaji_pokok_histori_immutable
before update or delete on public.gaji_pokok_histori
for each row execute function public.trg_prevent_gaji_pokok_histori_mutation();

-- Akses (P-06, AC-08, AC-13), mengikuti pola 0009:
--   * tabel dasar di-revoke dari anon dan authenticated;
--   * baca lewat view security_barrier yang menyembunyikan kolom per peran;
--   * tulis hanya lewat fungsi security definer dengan guard peran HR.
-- Karyawan (peran ke-13, D-53) tidak membaca data karyawan lain; datanya sendiri
-- dibaca modul presensi (GJ-002), bukan view ini.

create or replace view public.karyawan_aman
with (security_barrier = true)
as
select
    k.id,
    k.nik,
    k.nama,
    k.departemen_id,
    k.jabatan_id,
    k.tipe,
    k.tanggal_masuk,
    k.tanggal_keluar,
    k.status,
    case when public.current_peran() in ('HR', 'Accounting') then k.kategori_ptkp_id end as kategori_ptkp_id,
    case when public.current_peran() in ('HR', 'Finance') then k.rekening_nama_bank end as rekening_nama_bank,
    case when public.current_peran() in ('HR', 'Finance') then k.rekening_nomor end as rekening_nomor,
    case when public.current_peran() in ('HR', 'Finance') then k.rekening_nama_pemilik end as rekening_nama_pemilik,
    k.created_at,
    k.updated_at
from public.karyawan k
where public.current_peran() in ('HR', 'Accounting', 'Finance');

create or replace view public.gaji_pokok_aman
with (security_barrier = true)
as
select g.id, g.karyawan_id, g.nominal, g.tanggal_berlaku, g.created_by,
       coalesce(pr.display_name, 'Sistem') as created_by_nama, g.created_at
from public.gaji_pokok_histori g
left join public.profiles pr on pr.id = g.created_by
where public.current_peran() in ('HR', 'Accounting');

create or replace view public.karyawan_riwayat
with (security_barrier = true)
as
select r.id, r.karyawan_id, r.aksi, r.status_lama, r.status_baru, r.tanggal_keluar,
       r.actor_id, coalesce(pr.display_name, 'Sistem') as actor_nama, r.created_at
from public.karyawan_riwayat_status r
left join public.profiles pr on pr.id = r.actor_id
where public.current_peran() = 'HR';

alter table public.departemen enable row level security;
alter table public.jabatan enable row level security;
alter table public.kategori_ptkp enable row level security;
alter table public.karyawan enable row level security;
alter table public.gaji_pokok_histori enable row level security;
alter table public.karyawan_riwayat_status enable row level security;

revoke all on public.karyawan, public.gaji_pokok_histori, public.karyawan_riwayat_status
    from anon, authenticated;
revoke all on public.karyawan_aman, public.gaji_pokok_aman, public.karyawan_riwayat from public, anon;
grant select on public.karyawan_aman, public.gaji_pokok_aman, public.karyawan_riwayat to authenticated;

create policy "Staf aktif boleh baca departemen" on public.departemen
    for select to authenticated using (public.is_active_staff());
create policy "Staf aktif boleh baca jabatan" on public.jabatan
    for select to authenticated using (public.is_active_staff());
create policy "Staf aktif boleh baca kategori PTKP" on public.kategori_ptkp
    for select to authenticated using (public.is_active_staff());

-- Defense in depth: bila grant tabel dasar dibuka kembali, RLS tetap membatasi.
create policy "Peran payroll boleh baca karyawan" on public.karyawan
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting', 'Finance'));
create policy "HR dan Accounting boleh baca gaji pokok" on public.gaji_pokok_histori
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting'));
create policy "HR boleh baca riwayat status karyawan" on public.karyawan_riwayat_status
    for select to authenticated using (public.current_peran() = 'HR');

-- Guard peran untuk semua penulisan data karyawan (P-06).
create or replace function public.gj001_assert_hr()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
    -- `is distinct from`: current_peran() bernilai null saat sesi tidak berlaku.
    if auth.uid() is null or public.current_peran() is distinct from 'HR' then
        raise exception 'Anda tidak punya izin mengubah data karyawan.' using errcode = '42501';
    end if;
end;
$$;

revoke all on function public.gj001_assert_hr() from public, anon;
grant execute on function public.gj001_assert_hr() to authenticated;

-- Fungsi tulis (security definer, memanggil gj001_assert_hr(), satu transaksi).
-- Badan fungsi ditulis bersama migrasi setelah nomor ditetapkan:
--   create_karyawan(p_nik, p_nama, p_departemen_id, p_jabatan_id, p_kategori_ptkp_id,
--                   p_tipe, p_tanggal_masuk, p_rekening_nama_bank, p_rekening_nomor,
--                   p_rekening_nama_pemilik, p_gaji_pokok numeric, p_tanggal_berlaku date)
--       -> insert karyawan + gaji_pokok_histori pertama + riwayat BUAT (AC-01, AC-03)
--   update_karyawan(p_id, ...kolom yang boleh diubah, tanpa NIK dan gaji)      (AC-07)
--   tambah_gaji_pokok(p_karyawan_id, p_nominal numeric, p_tanggal_berlaku date) (AC-03, AC-11)
--   nonaktifkan_karyawan(p_id, p_tanggal_keluar date) -> status + riwayat NONAKTIFKAN (AC-09)

-- Pertanyaan untuk tech lead:
-- Q-DDL-01: profiles.karyawan_id (0003) belum ber-FK. Tambah
--           fk_profiles_karyawan -> karyawan(id) di migrasi ini, atau di GJ-002
--           saat peran Karyawan mulai membaca presensinya sendiri?
-- Q-DDL-02: departemen dan jabatan perlu seed awal (Produksi, Administrasi,
--           Penjualan; Operator, Staf, ...). Masuk seed FND-008 atau seed item ini?
