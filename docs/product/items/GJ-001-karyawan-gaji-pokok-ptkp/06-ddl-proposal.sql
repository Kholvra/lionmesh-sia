-- GJ-001 — usulan DDL (bukan migrasi). Tabel karyawan milik core (D-31).

create table public.departemen (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  aktif boolean not null default true
);

create table public.jabatan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  aktif boolean not null default true
);

-- Daftar kategori PTKP berversi (D-19); kode dipakai lookup TER di GJ-004.
create table public.kategori_ptkp (
  kode text primary key check (kode ~ '^(TK|K)/[0-3]$'),
  keterangan text not null,
  aktif boolean not null default true
);

create table public.karyawan (
  id uuid primary key default gen_random_uuid(),
  nik char(16) not null unique check (nik ~ '^[0-9]{16}$'),              -- AC-02, AC-14
  nama text not null check (length(trim(nama)) > 0),
  departemen_id uuid not null references public.departemen (id),
  jabatan_id uuid not null references public.jabatan (id),
  tipe text not null check (tipe in ('PRODUKSI', 'NON_PRODUKSI')),
  ptkp_kode text not null references public.kategori_ptkp (kode),        -- AC-05, AC-06
  tanggal_masuk date not null,
  tanggal_keluar date,
  status text not null default 'AKTIF' check (status in ('AKTIF', 'NONAKTIF')),
  rekening_nama_bank text not null check (length(trim(rekening_nama_bank)) > 0),   -- AC-15, D-51 d
  rekening_nomor text not null check (rekening_nomor ~ '^[0-9]+$'),
  rekening_nama_pemilik text not null check (length(trim(rekening_nama_pemilik)) > 0),
  check (status = 'AKTIF' or tanggal_keluar is not null)
);

-- Histori gaji pokok: hanya tambah, tidak ada update atau delete (AC-03, AC-04).
create table public.gaji_pokok_histori (
  id uuid primary key default gen_random_uuid(),
  karyawan_id uuid not null references public.karyawan (id),
  nominal numeric(18, 0) not null check (nominal > 0),
  tanggal_berlaku date not null,
  dicatat_oleh uuid not null references public.profiles (id),
  dicatat_pada timestamptz not null default now(),
  unique (karyawan_id, tanggal_berlaku)                                   -- AC-11
);

-- RLS (P-06): HR baca dan tulis semua kolom; Accounting baca identitas, gaji,
-- dan PTKP lewat view tanpa rekening; Finance baca nama dan rekening lewat view;
-- peran lain, termasuk Karyawan, tidak membaca apa pun (AC-08, AC-13).
alter table public.karyawan enable row level security;
alter table public.gaji_pokok_histori enable row level security;
revoke update, delete on public.gaji_pokok_histori from authenticated;
