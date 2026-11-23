-- FND-004: document numbering, status machine, append-only history, and approval.

-- Reference data. A new status requires a locked decision and a forward migration;
-- module owners may only register statuses that already exist here.
create table public.status_dokumen_sah (
    status text primary key,
    sumber text not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_status_dokumen_sah_status check (status ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    constraint ck_status_dokumen_sah_sumber check (
        sumber in ('D-46', 'D-47', 'D-53', 'D-58', 'FND-004')
    )
);

insert into public.status_dokumen_sah (status, sumber) values
    ('DRAFT', 'FND-004'),
    ('DIAJUKAN', 'D-46'),
    ('DIPERIKSA', 'D-46'),
    ('DISETUJUI', 'D-46'),
    ('DIPROSES', 'FND-004'),
    ('SELESAI', 'D-46'),
    ('REVISI', 'D-46'),
    ('DITOLAK', 'D-46'),
    ('DIBATALKAN', 'D-46'),
    ('VERIFIED', 'D-46'),
    ('MENUNGGU_STOK', 'D-46'),
    ('SIAP_KIRIM', 'D-46'),
    ('TERKIRIM_SEBAGIAN', 'D-46'),
    ('TERKIRIM', 'D-46'),
    ('DIFAKTURKAN', 'D-46'),
    ('MENUNGGU_PERSETUJUAN', 'D-46'),
    ('PEMASOK_DITETAPKAN', 'D-46'),
    ('DITERBITKAN', 'D-46'),
    ('DITERIMA_SEBAGIAN', 'D-46'),
    ('DITERIMA', 'D-46'),
    ('QC_LULUS', 'D-46'),
    ('QC_GAGAL', 'D-46'),
    ('COCOK', 'D-46'),
    ('SELISIH', 'D-46'),
    ('TERCATAT', 'D-46'),
    ('DIBAYAR_SEBAGIAN', 'D-46'),
    ('LUNAS', 'D-46'),
    ('DIRENCANAKAN', 'D-46'),
    ('CEK_BAHAN', 'D-46'),
    ('BAHAN_CUKUP', 'D-46'),
    ('BAHAN_KURANG', 'D-46'),
    ('MENUNGGU_PEMBELIAN', 'D-46'),
    ('BAHAN_SIAP', 'D-46'),
    ('BERJALAN', 'D-46'),
    ('HASIL_DICATAT', 'D-46'),
    ('QC_PASSED', 'D-46'),
    ('REWORK', 'D-46'),
    ('REJECTED', 'D-46'),
    ('TERBUKA', 'D-46'),
    ('REKAP', 'D-46'),
    ('TERVALIDASI', 'D-46'),
    ('DRAFT_TERHITUNG', 'D-46'),
    ('DIBAYAR', 'D-46'),
    ('GAGAL_TRANSFER', 'D-46'),
    ('DIPOSTING', 'D-46'),
    ('MENUNGGU_PERSETUJUAN_KREDIT', 'D-47'),
    ('DIKIRIM', 'D-47'),
    ('DICATAT', 'D-58'),
    ('TERVERIFIKASI', 'D-58'),
    ('SEBAGIAN_LUNAS', 'D-58'),
    ('MENUNGGU_VALIDASI_SUPERVISOR', 'D-53'),
    ('BELUM_COCOK', 'D-58');

create table public.transisi_dokumen_sah (
    dari_status text not null references public.status_dokumen_sah (status),
    ke_status text not null references public.status_dokumen_sah (status),
    aksi text not null,
    butuh_alasan boolean not null default false,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint pk_transisi_dokumen_sah primary key (dari_status, ke_status, aksi),
    constraint ck_transisi_dokumen_sah_aksi check (aksi ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    constraint ck_transisi_dokumen_sah_self check (dari_status <> ke_status or aksi = 'SETUJUI')
);

-- The generic lifecycle in FND-004 plus the state machines in D-46/D-47.
-- A repeated pair with the same action is intentionally idempotent.
insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan) values
    ('DRAFT', 'DIAJUKAN', 'AJUKAN', false),
    ('DIAJUKAN', 'DIPERIKSA', 'PERIKSA', false),
    ('DIAJUKAN', 'DISETUJUI', 'PERIKSA', false),
    ('DIPERIKSA', 'DIPERIKSA', 'SETUJUI', false),
    ('DIPERIKSA', 'DISETUJUI', 'SETUJUI', false),
    ('DIPERIKSA', 'DITOLAK', 'TOLAK', true),
    ('DIAJUKAN', 'REVISI', 'REVISI', false),
    ('DIPERIKSA', 'REVISI', 'REVISI', false),
    ('REVISI', 'DRAFT', 'REVISI_SELESAI', false),
    ('DISETUJUI', 'DIPROSES', 'PROSES', false),
    ('DIPROSES', 'SELESAI', 'SELESAI', false),
    ('DRAFT', 'DIBATALKAN', 'BATAL', true),
    ('DIAJUKAN', 'DIBATALKAN', 'BATAL', true),
    ('REVISI', 'DIBATALKAN', 'BATAL', true),
    ('DIPERIKSA', 'DIBATALKAN', 'BATAL', true),
    ('DISETUJUI', 'DIBATALKAN', 'BATAL', true),
    ('DRAFT', 'VERIFIED', 'VERIFIKASI', false),
    ('DRAFT', 'REVISI', 'REVISI', false),
    ('REVISI', 'VERIFIED', 'VERIFIKASI', false),
    ('VERIFIED', 'MENUNGGU_STOK', 'CEK_STOK', false),
    ('VERIFIED', 'SIAP_KIRIM', 'CEK_STOK', false),
    ('MENUNGGU_STOK', 'SIAP_KIRIM', 'CEK_STOK', false),
    ('SIAP_KIRIM', 'TERKIRIM_SEBAGIAN', 'KIRIM', false),
    ('SIAP_KIRIM', 'TERKIRIM', 'KIRIM', false),
    ('TERKIRIM_SEBAGIAN', 'TERKIRIM', 'KIRIM', false),
    ('TERKIRIM', 'DIFAKTURKAN', 'FAKTURKAN', false),
    ('DIFAKTURKAN', 'SELESAI', 'SELESAI', false),
    ('VERIFIED', 'MENUNGGU_PERSETUJUAN_KREDIT', 'CEK_KREDIT', false),
    ('MENUNGGU_PERSETUJUAN_KREDIT', 'VERIFIED', 'OVERRIDE', false),
    ('MENUNGGU_PERSETUJUAN_KREDIT', 'DIBATALKAN', 'BATAL', true),
    ('DIKIRIM', 'DITERIMA', 'TERIMA', false),
    ('DIAJUKAN', 'MENUNGGU_PERSETUJUAN', 'PERIKSA', false),
    ('REVISI', 'DIAJUKAN', 'AJUKAN', false),
    ('MENUNGGU_PERSETUJUAN', 'MENUNGGU_PERSETUJUAN', 'SETUJUI', false),
    ('MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'SETUJUI', false),
    ('MENUNGGU_PERSETUJUAN', 'DITOLAK', 'TOLAK', true),
    ('DISETUJUI', 'PEMASOK_DITETAPKAN', 'PILIH_PEMASOK', false),
    ('PEMASOK_DITETAPKAN', 'DITERBITKAN', 'TERBITKAN', false),
    ('DITERBITKAN', 'DITERIMA_SEBAGIAN', 'TERIMA', false),
    ('DITERBITKAN', 'DITERIMA', 'TERIMA', false),
    ('DITERIMA_SEBAGIAN', 'DITERIMA', 'TERIMA', false),
    ('DITERIMA', 'QC_LULUS', 'QC', false),
    ('DITERIMA', 'QC_GAGAL', 'QC', false),
    ('QC_LULUS', 'COCOK', 'COCOK', false),
    ('QC_LULUS', 'SELISIH', 'COCOK', false),
    ('SELISIH', 'COCOK', 'KOREKSI', false),
    ('COCOK', 'TERCATAT', 'CATAT', false),
    ('TERCATAT', 'DIBAYAR_SEBAGIAN', 'BAYAR', false),
    ('TERCATAT', 'LUNAS', 'BAYAR', false),
    ('DIBAYAR_SEBAGIAN', 'LUNAS', 'BAYAR', false),
    ('DITERBITKAN', 'DIBATALKAN', 'BATAL', true),
    ('MENUNGGU_PERSETUJUAN', 'DIAJUKAN', 'REVISI', false),
    ('MENUNGGU_PERSETUJUAN', 'DIBATALKAN', 'BATAL', true),
    ('DISETUJUI', 'DIAJUKAN', 'REVISI', false),
    ('PEMASOK_DITETAPKAN', 'DIBATALKAN', 'BATAL', true),
    ('DIRENCANAKAN', 'CEK_BAHAN', 'CEK_BAHAN', false),
    ('CEK_BAHAN', 'BAHAN_CUKUP', 'CEK_BAHAN', false),
    ('CEK_BAHAN', 'BAHAN_KURANG', 'CEK_BAHAN', false),
    ('BAHAN_KURANG', 'MENUNGGU_PEMBELIAN', 'AJUKAN_PEMBELIAN', false),
    ('BAHAN_KURANG', 'DIBATALKAN', 'BATAL', true),
    ('MENUNGGU_PEMBELIAN', 'BAHAN_SIAP', 'TERIMA_BAHAN', false),
    ('BAHAN_CUKUP', 'BERJALAN', 'MULAI', false),
    ('BAHAN_SIAP', 'BERJALAN', 'MULAI', false),
    ('BERJALAN', 'HASIL_DICATAT', 'CATAT_HASIL', false),
    ('HASIL_DICATAT', 'QC_PASSED', 'QC', false),
    ('HASIL_DICATAT', 'REWORK', 'QC', false),
    ('HASIL_DICATAT', 'REJECTED', 'QC', false),
    ('REWORK', 'HASIL_DICATAT', 'CATAT_HASIL', false),
    ('QC_PASSED', 'SELESAI', 'SELESAI', false),
    ('DIRENCANAKAN', 'DIBATALKAN', 'BATAL', true),
    ('CEK_BAHAN', 'DIBATALKAN', 'BATAL', true),
    ('BAHAN_CUKUP', 'DIBATALKAN', 'BATAL', true),
    ('TERBUKA', 'REKAP', 'REKAP', false),
    ('REKAP', 'TERVALIDASI', 'VALIDASI', false),
    ('TERVALIDASI', 'DRAFT_TERHITUNG', 'HITUNG', false),
    ('DRAFT_TERHITUNG', 'DIPERIKSA', 'PERIKSA', false),
    ('DIPERIKSA', 'REVISI', 'REVISI', false),
    ('REVISI', 'DRAFT_TERHITUNG', 'REVISI_SELESAI', false),
    ('DIPERIKSA', 'DISETUJUI', 'SETUJUI', false),
    ('DISETUJUI', 'DIBAYAR', 'BAYAR', false),
    ('DISETUJUI', 'GAGAL_TRANSFER', 'BAYAR', false),
    ('GAGAL_TRANSFER', 'DIBAYAR', 'BAYAR', false),
    ('DIBAYAR', 'DIPOSTING', 'POSTING', false),
    ('REKAP', 'TERBUKA', 'REVISI', false),
    ('TERVALIDASI', 'REKAP', 'REVISI', false),
    ('DICATAT', 'TERVERIFIKASI', 'VERIFIKASI', false),
    ('DICATAT', 'DIBATALKAN', 'BATAL', true),
    ('TERVERIFIKASI', 'DIBATALKAN', 'BATAL', true),
    ('DITERBITKAN', 'SEBAGIAN_LUNAS', 'BAYAR', false),
    ('DITERBITKAN', 'LUNAS', 'BAYAR', false),
    ('SEBAGIAN_LUNAS', 'LUNAS', 'BAYAR', false),
    ('MENUNGGU_VALIDASI_SUPERVISOR', 'TERVALIDASI', 'VALIDASI', false),
    ('MENUNGGU_VALIDASI_SUPERVISOR', 'DIBATALKAN', 'BATAL', true),
    ('BELUM_COCOK', 'COCOK', 'COCOK', false),
    ('BELUM_COCOK', 'SELISIH', 'SELISIH', false),
    ('SELISIH', 'COCOK', 'COCOK', false)
on conflict (dari_status, ke_status, aksi) do nothing;

create table public.jenis_dokumen (
    tipe text primary key,
    nama text not null,
    status_awal text not null references public.status_dokumen_sah (status),
    perlu_approval boolean not null default false,
    status_menunggu_approval text references public.status_dokumen_sah (status),
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_jenis_dokumen_tipe check (tipe ~ '^[A-Z][A-Z0-9_]{0,31}$'),
    constraint ck_jenis_dokumen_nama check (length(btrim(nama)) > 0),
    constraint ck_jenis_dokumen_status_approval check (
        not perlu_approval or status_menunggu_approval is not null
    )
);

create table public.jenis_dokumen_status (
    tipe text not null references public.jenis_dokumen (tipe),
    status text not null references public.status_dokumen_sah (status),
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint pk_jenis_dokumen_status primary key (tipe, status),
    constraint uq_jenis_dokumen_status_urutan unique (tipe, urutan),
    constraint ck_jenis_dokumen_status_urutan check (urutan > 0)
);

create table public.dokumen_counter (
    tipe text not null references public.jenis_dokumen (tipe),
    periode date not null,
    urut_terakhir integer not null default 0,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint pk_dokumen_counter primary key (tipe, periode),
    constraint ck_dokumen_counter_periode check (periode = date_trunc('month', periode)::date),
    constraint ck_dokumen_counter_urut check (urut_terakhir >= 0)
);

create table public.dokumen (
    id uuid primary key default gen_random_uuid(),
    tipe text not null references public.jenis_dokumen (tipe),
    nomor text not null,
    periode date not null,
    status text not null references public.status_dokumen_sah (status),
    pembuat_id uuid not null,
    nominal numeric(18,2),
    approval_snapshot jsonb not null default '[]'::jsonb,
    siklus_approval integer not null default 0,
    diposting boolean not null default false,
    diposting_at timestamptz,
    versi bigint not null default 0,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_dokumen_nomor unique (tipe, periode, nomor),
    constraint uq_dokumen_id_tipe unique (id, tipe),
    constraint ck_dokumen_periode check (periode = date_trunc('month', periode)::date),
    constraint ck_dokumen_nominal check (nominal is null or nominal >= 0),
    constraint ck_dokumen_snapshot check (jsonb_typeof(approval_snapshot) = 'array'),
    constraint ck_dokumen_siklus check (siklus_approval >= 0),
    constraint ck_dokumen_diposting check (
        (diposting = false and diposting_at is null)
        or (diposting = true and diposting_at is not null)
    )
);

create index idx_dokumen_tipe_status on public.dokumen (tipe, status);
create index idx_dokumen_pembuat on public.dokumen (pembuat_id, created_at desc);

create table public.aturan_approval (
    id uuid primary key default gen_random_uuid(),
    tipe text not null references public.jenis_dokumen (tipe),
    level smallint not null,
    peran text not null,
    batas_bawah numeric(18,2) not null default 0,
    batas_atas numeric(18,2),
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_aturan_approval_level check (level > 0),
    constraint ck_aturan_approval_peran check (
        peran in (
            'Penjualan', 'Pengiriman', 'Gudang', 'Purchasing', 'QC', 'Produksi',
            'Accounting', 'Finance', 'Manajemen', 'Direksi', 'HR',
            'Supervisor Lapangan', 'Karyawan'
        )
    ),
    constraint ck_aturan_approval_batas_bawah check (batas_bawah >= 0),
    constraint ck_aturan_approval_batas_atas check (
        batas_atas is null or batas_atas > batas_bawah
    )
);

create unique index uq_aturan_approval_aktif_level
on public.aturan_approval (tipe, level)
where aktif;

create table public.riwayat_status (
    id uuid primary key default gen_random_uuid(),
    dokumen_id uuid not null,
    tipe_dokumen text not null,
    aksi text not null,
    status_asal text references public.status_dokumen_sah (status),
    status_tujuan text not null references public.status_dokumen_sah (status),
    level smallint,
    alasan text,
    siklus_approval integer not null default 0,
    actor_id uuid not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint fk_riwayat_status_dokumen foreign key (dokumen_id, tipe_dokumen)
        references public.dokumen (id, tipe),
    constraint ck_riwayat_status_aksi check (aksi ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    constraint ck_riwayat_status_level check (level is null or level > 0),
    constraint ck_riwayat_status_buat check (
        (aksi <> 'BUAT' or status_asal is null)
        and (aksi = 'BUAT' or status_asal is not null)
    ),
    constraint ck_riwayat_status_setujui_level check (
        (aksi = 'SETUJUI' and level is not null)
        or (aksi <> 'SETUJUI' and level is null)
    ),
    constraint ck_riwayat_status_siklus check (siklus_approval >= 0)
);

create index idx_riwayat_status_dokumen on public.riwayat_status (dokumen_id, created_at, id);
create index idx_riwayat_status_approval
on public.riwayat_status (dokumen_id, siklus_approval, level)
where aksi = 'SETUJUI';

-- Keep identity, number, period, and creator immutable. Status changes are only
-- written by the core functions below.
create or replace function public.trg_dokumen_immutable_fields()
returns trigger
language plpgsql
as $$
begin
    if new.id <> old.id
        or new.tipe <> old.tipe
        or new.nomor <> old.nomor
        or new.periode <> old.periode
        or new.pembuat_id <> old.pembuat_id
        or new.created_at <> old.created_at then
        raise exception 'Identitas dan nomor dokumen tidak bisa diubah.';
    end if;
    return new;
end;
$$;

create trigger trg_dokumen_immutable_fields
before update on public.dokumen
for each row execute function public.trg_dokumen_immutable_fields();

create or replace function public.trg_dokumen_no_delete()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Dokumen tidak bisa dihapus. Gunakan pembatalan.';
end;
$$;

create trigger trg_dokumen_no_delete
before delete on public.dokumen
for each row execute function public.trg_dokumen_no_delete();

create or replace function public.trg_riwayat_status_append_only()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Riwayat status tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_riwayat_status_append_only
before update or delete on public.riwayat_status
for each row execute function public.trg_riwayat_status_append_only();

create or replace function public.trg_validasi_status_jenis_dokumen()
returns trigger
language plpgsql
as $$
begin
    if not exists (
        select 1
        from public.jenis_dokumen_status
        where tipe = new.tipe and status = new.status
    ) then
        raise exception 'Status % tidak tersedia untuk jenis dokumen %.', new.status, new.tipe;
    end if;
    return new;
end;
$$;

create trigger trg_validasi_status_jenis_dokumen
before insert or update of tipe, status on public.dokumen
for each row execute function public.trg_validasi_status_jenis_dokumen();

alter table public.status_dokumen_sah enable row level security;
alter table public.transisi_dokumen_sah enable row level security;
alter table public.jenis_dokumen enable row level security;
alter table public.jenis_dokumen_status enable row level security;
alter table public.dokumen_counter enable row level security;
alter table public.dokumen enable row level security;
alter table public.aturan_approval enable row level security;
alter table public.riwayat_status enable row level security;

revoke all on public.status_dokumen_sah from anon, authenticated;
revoke all on public.transisi_dokumen_sah from anon, authenticated;
revoke all on public.jenis_dokumen from anon, authenticated;
revoke all on public.jenis_dokumen_status from anon, authenticated;
revoke all on public.dokumen_counter from anon, authenticated;
revoke all on public.dokumen from anon, authenticated;
revoke all on public.aturan_approval from anon, authenticated;
revoke all on public.riwayat_status from anon, authenticated;

grant all on public.status_dokumen_sah to service_role;
grant all on public.transisi_dokumen_sah to service_role;
grant all on public.jenis_dokumen to service_role;
grant all on public.jenis_dokumen_status to service_role;
grant all on public.dokumen_counter to service_role;
grant all on public.dokumen to service_role;
grant all on public.aturan_approval to service_role;
grant all on public.riwayat_status to service_role;

-- Core functions are SECURITY DEFINER and only callable by trusted server code.
create or replace function public.dokumen_json(p_dokumen public.dokumen)
returns jsonb
language sql
stable
set search_path = pg_catalog, public
as $$
    select jsonb_build_object(
        'id', p_dokumen.id,
        'tipe', p_dokumen.tipe,
        'nomor', p_dokumen.nomor,
        'periode', p_dokumen.periode,
        'status', p_dokumen.status,
        'pembuat_id', p_dokumen.pembuat_id,
        'nominal', p_dokumen.nominal::text,
        'approval_snapshot', p_dokumen.approval_snapshot,
        'siklus_approval', p_dokumen.siklus_approval,
        'diposting', p_dokumen.diposting,
        'diposting_at', p_dokumen.diposting_at,
        'versi', p_dokumen.versi,
        'created_by', p_dokumen.created_by,
        'created_at', p_dokumen.created_at,
        'updated_by', p_dokumen.updated_by,
        'updated_at', p_dokumen.updated_at
    );
$$;

create or replace function public.validasi_aktor_dokumen(p_aktor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor_id uuid := coalesce(auth.uid(), p_aktor_id);
begin
    if v_aktor_id is null then
        raise exception 'Aktor dokumen wajib diisi.';
    end if;

    if not exists (
        select 1
        from public.profiles
        where id = v_aktor_id and aktif = true
    ) then
        raise exception 'Aktor dokumen tidak ditemukan atau nonaktif.';
    end if;

    return v_aktor_id;
end;
$$;

create or replace function public.daftarkan_jenis_dokumen(
    p_tipe text,
    p_nama text,
    p_status_awal text,
    p_statuses text[],
    p_perlu_approval boolean default false,
    p_status_menunggu_approval text default null,
    p_aktor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_tipe text := btrim(p_tipe);
    v_status text;
    v_urutan smallint := 0;
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
begin
    if v_tipe !~ '^[A-Z][A-Z0-9_]{0,31}$' then
        raise exception 'Kode tipe dokumen tidak valid.';
    end if;
    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama jenis dokumen wajib diisi.';
    end if;
    if p_statuses is null or cardinality(p_statuses) = 0 then
        raise exception 'Daftar status jenis dokumen wajib diisi.';
    end if;
    if not exists (select 1 from public.status_dokumen_sah where status = p_status_awal) then
        raise exception 'Status % tidak tersedia.', p_status_awal;
    end if;

    insert into public.jenis_dokumen (
        tipe, nama, status_awal, perlu_approval, status_menunggu_approval,
        created_by, updated_by
    ) values (
        v_tipe, btrim(p_nama), p_status_awal, p_perlu_approval,
        p_status_menunggu_approval, v_aktor_id, v_aktor_id
    );

    foreach v_status in array p_statuses loop
        if not exists (select 1 from public.status_dokumen_sah where status = v_status) then
            raise exception 'Status % tidak tersedia.', v_status;
        end if;
        v_urutan := v_urutan + 1;
        insert into public.jenis_dokumen_status (tipe, status, urutan)
        values (v_tipe, v_status, v_urutan);
    end loop;

    if not exists (
        select 1 from public.jenis_dokumen_status
        where tipe = v_tipe and status = p_status_awal
    ) then
        insert into public.jenis_dokumen_status (tipe, status, urutan)
        values (v_tipe, p_status_awal, v_urutan + 1);
    end if;

    if p_perlu_approval and not exists (
        select 1 from public.jenis_dokumen_status
        where tipe = v_tipe and status = p_status_menunggu_approval
    ) then
        raise exception 'Status menunggu approval harus terdaftar pada jenis dokumen.';
    end if;

    return jsonb_build_object('tipe', v_tipe, 'nama', btrim(p_nama), 'status_awal', p_status_awal);
end;
$$;

create or replace function public.tambah_status_jenis_dokumen(
    p_tipe text,
    p_status text,
    p_aktor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_tipe text := btrim(p_tipe);
    v_status text := btrim(p_status);
    v_urutan smallint;
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
begin
    if not exists (select 1 from public.jenis_dokumen where tipe = v_tipe) then
        raise exception 'Jenis dokumen % tidak ditemukan.', v_tipe;
    end if;
    if not exists (select 1 from public.status_dokumen_sah where status = v_status) then
        raise exception 'Status % tidak tersedia.', v_status;
    end if;

    select coalesce(max(urutan), 0) + 1 into v_urutan
    from public.jenis_dokumen_status
    where tipe = v_tipe;

    insert into public.jenis_dokumen_status (tipe, status, urutan)
    values (v_tipe, v_status, v_urutan)
    on conflict (tipe, status) do nothing;

    return jsonb_build_object('tipe', v_tipe, 'status', v_status);
end;
$$;

create or replace function public.buat_dokumen(
    p_tipe text,
    p_aktor_id uuid,
    p_nominal numeric default null,
    p_tanggal date default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_tipe text := btrim(p_tipe);
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
    v_jenis record;
    v_tanggal date := coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date);
    v_periode date := date_trunc('month', coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date))::date;
    v_urut integer;
    v_nomor text;
    v_dokumen public.dokumen;
    v_riwayat_id uuid;
begin
    select * into v_jenis from public.jenis_dokumen where tipe = v_tipe;
    if not found then
        raise exception 'Jenis dokumen % tidak terdaftar.', v_tipe;
    end if;

    insert into public.dokumen_counter (tipe, periode, urut_terakhir, created_by, updated_by)
    values (v_tipe, v_periode, 1, v_aktor_id, v_aktor_id)
    on conflict (tipe, periode) do update set
        urut_terakhir = public.dokumen_counter.urut_terakhir + 1,
        updated_by = excluded.updated_by,
        updated_at = now()
    returning urut_terakhir into v_urut;

    v_nomor := v_tipe
        || '/' || to_char(v_tanggal, 'YYYY')
        || '/' || to_char(v_tanggal, 'MM')
        || '/' || lpad(v_urut::text, 4, '0');

    insert into public.dokumen (
        tipe, nomor, periode, status, pembuat_id, nominal,
        created_by, updated_by
    ) values (
        v_tipe, v_nomor, v_periode, v_jenis.status_awal, v_aktor_id, p_nominal,
        v_aktor_id, v_aktor_id
    ) returning * into v_dokumen;

    insert into public.riwayat_status (
        dokumen_id, tipe_dokumen, aksi, status_asal, status_tujuan,
        level, siklus_approval, actor_id, created_by, updated_by
    ) values (
        v_dokumen.id, v_dokumen.tipe, 'BUAT', null, v_dokumen.status,
        null, v_dokumen.siklus_approval, v_aktor_id, v_aktor_id, v_aktor_id
    ) returning id into v_riwayat_id;

    return jsonb_build_object(
        'dokumen', public.dokumen_json(v_dokumen),
        'riwayat_id', v_riwayat_id
    );
end;
$$;

create or replace function public.catat_transisi_dokumen_internal(
    p_dokumen_id uuid,
    p_versi bigint,
    p_status_tujuan text,
    p_aksi text,
    p_aktor_id uuid,
    p_alasan text default null,
    p_level smallint default null,
    p_diposting boolean default false,
    p_snapshot jsonb default null,
    p_reset_approval boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
    v_dokumen public.dokumen;
    v_butuh_alasan boolean;
    v_snapshot jsonb;
    v_siklus integer;
    v_status_asal text;
    v_riwayat_id uuid;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Dokumen tidak ditemukan.';
    end if;

    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;

    if v_dokumen.diposting and (p_aksi = 'BATAL' or p_aksi = 'REVISI' or p_aksi = 'REVISI_SELESAI') then
        raise exception 'Dokumen sudah diposting. Batalkan lewat jurnal pembalik.';
    end if;

    select butuh_alasan into v_butuh_alasan
    from public.transisi_dokumen_sah
    where dari_status = v_dokumen.status
      and ke_status = p_status_tujuan
      and aksi = p_aksi;

    if not found then
        raise exception 'Status % tidak bisa diubah menjadi %.', v_dokumen.status, p_status_tujuan;
    end if;

    if v_butuh_alasan and (p_alasan is null or length(btrim(p_alasan)) = 0) then
        if p_aksi = 'BATAL' then
            raise exception 'Isi alasan untuk membatalkan dokumen.';
        elsif p_aksi = 'TOLAK' then
            raise exception 'Isi alasan untuk menolak dokumen.';
        else
            raise exception 'Isi alasan untuk tindakan ini.';
        end if;
    end if;

    if not exists (
        select 1 from public.jenis_dokumen_status
        where tipe = v_dokumen.tipe and status = p_status_tujuan
    ) then
        raise exception 'Status % tidak tersedia untuk jenis dokumen %.', p_status_tujuan, v_dokumen.tipe;
    end if;

    if p_snapshot is not null and jsonb_typeof(p_snapshot) <> 'array' then
        raise exception 'Snapshot approval tidak valid.';
    end if;

    v_status_asal := v_dokumen.status;
    v_siklus := v_dokumen.siklus_approval;
    v_snapshot := v_dokumen.approval_snapshot;
    if p_reset_approval then
        v_siklus := v_siklus + 1;
        v_snapshot := '[]'::jsonb;
    elsif p_snapshot is not null then
        v_snapshot := p_snapshot;
    end if;

    update public.dokumen set
        status = p_status_tujuan,
        versi = versi + 1,
        siklus_approval = v_siklus,
        approval_snapshot = v_snapshot,
        diposting = coalesce(diposting, false) or p_diposting,
        diposting_at = case
            when p_diposting then coalesce(diposting_at, now())
            else diposting_at
        end,
        updated_by = v_aktor_id,
        updated_at = now()
    where id = p_dokumen_id and versi = p_versi
    returning * into v_dokumen;

    if not found then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;

    insert into public.riwayat_status (
        dokumen_id, tipe_dokumen, aksi, status_asal, status_tujuan,
        level, alasan, siklus_approval, actor_id, created_by, updated_by
    ) values (
        v_dokumen.id, v_dokumen.tipe, p_aksi, v_status_asal, p_status_tujuan,
        p_level, nullif(btrim(p_alasan), ''), v_siklus, v_aktor_id, v_aktor_id, v_aktor_id
    ) returning id into v_riwayat_id;

    return jsonb_build_object(
        'dokumen', public.dokumen_json(v_dokumen),
        'riwayat_id', v_riwayat_id
    );
end;
$$;

create or replace function public.ajukan_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
    select public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'DIAJUKAN', 'AJUKAN', p_aktor_id, p_alasan
    );
$$;

create or replace function public.periksa_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_dokumen public.dokumen;
    v_jenis public.jenis_dokumen;
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
    v_snapshot jsonb := '[]'::jsonb;
    v_target text;
    v_nominal numeric(18,2);
    v_count integer;
    v_min integer;
    v_max integer;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Dokumen tidak ditemukan.';
    end if;
    select * into v_jenis from public.jenis_dokumen where tipe = v_dokumen.tipe;

    if v_dokumen.pembuat_id = v_aktor_id then
        raise exception 'Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.';
    end if;

    if v_jenis.perlu_approval then
        v_nominal := coalesce(v_dokumen.nominal, 0);
        select jsonb_agg(
            jsonb_build_object(
                'level', a.level,
                'peran', a.peran,
                'batas_bawah', a.batas_bawah::text,
                'batas_atas', a.batas_atas::text
            ) order by a.level
        )
        into v_snapshot
        from public.aturan_approval a
        where a.tipe = v_dokumen.tipe
          and a.aktif
          and v_nominal >= a.batas_bawah
          and (a.batas_atas is null or v_nominal < a.batas_atas);

        if v_snapshot is null then
            raise exception 'Aturan approval untuk nilai ini belum ada.';
        end if;

        select count(*), min((elem->>'level')::integer), max((elem->>'level')::integer)
        into v_count, v_min, v_max
        from jsonb_array_elements(v_snapshot) elem;

        if v_min <> 1 or v_max <> v_count then
            raise exception 'Aturan approval untuk nilai ini belum lengkap.';
        end if;

        v_target := v_jenis.status_menunggu_approval;
        if v_target is null then
            raise exception 'Status menunggu approval belum dikonfigurasi.';
        end if;
    else
        v_target := 'DISETUJUI';
    end if;

    return public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, v_target, 'PERIKSA', v_aktor_id, p_alasan,
        null, false, v_snapshot, false
    );
end;
$$;

create or replace function public.setujui_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_dokumen public.dokumen;
    v_jenis public.jenis_dokumen;
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
    v_aktor record;
    v_count integer;
    v_approved integer;
    v_next integer;
    v_peran_level text;
    v_prev_actor uuid;
    v_target text;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Dokumen tidak ditemukan.';
    end if;
    select * into v_jenis from public.jenis_dokumen where tipe = v_dokumen.tipe;
    select id, peran into v_aktor from public.profiles where id = v_aktor_id and aktif = true;

    if v_dokumen.pembuat_id = v_aktor_id then
        raise exception 'Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.';
    end if;

    if not v_jenis.perlu_approval
        or v_jenis.status_menunggu_approval is null
        or v_dokumen.status <> v_jenis.status_menunggu_approval then
        raise exception 'Status % tidak bisa diubah menjadi DISETUJUI.', v_dokumen.status;
    end if;

    v_count := jsonb_array_length(v_dokumen.approval_snapshot);
    if v_count = 0 then
        raise exception 'Dokumen ini tidak memerlukan persetujuan berjenjang.';
    end if;

    select count(distinct level) into v_approved
    from public.riwayat_status
    where dokumen_id = p_dokumen_id
      and siklus_approval = v_dokumen.siklus_approval
      and aksi = 'SETUJUI'
      and level is not null;

    if v_approved >= v_count then
        raise exception 'Persetujuan dokumen sudah lengkap.';
    end if;

    v_next := v_approved + 1;
    select elem->>'peran' into v_peran_level
    from jsonb_array_elements(v_dokumen.approval_snapshot) elem
    where (elem->>'level')::integer = v_next;

    if v_peran_level is null then
        raise exception 'Aturan approval level % belum ada.', v_next;
    end if;
    if v_aktor.peran is distinct from v_peran_level then
        raise exception 'Peran Anda tidak berwenang menyetujui level %.', v_next;
    end if;

    select actor_id into v_prev_actor
    from public.riwayat_status
    where dokumen_id = p_dokumen_id
      and siklus_approval = v_dokumen.siklus_approval
      and aksi = 'SETUJUI'
      and level = v_next - 1
    order by created_at desc, id desc
    limit 1;

    if v_prev_actor = v_aktor_id then
        raise exception 'Jenjang berikutnya harus disetujui orang yang berbeda.';
    end if;

    v_target := case when v_next = v_count then 'DISETUJUI' else v_dokumen.status end;

    return public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, v_target, 'SETUJUI', v_aktor_id, p_alasan,
        v_next::smallint, false, null, false
    );
end;
$$;

create or replace function public.revisi_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
    select public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'REVISI', 'REVISI', p_aktor_id, p_alasan,
        null, false, null, true
    );
$$;

create or replace function public.selesaikan_revisi_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
    select public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'DRAFT', 'REVISI_SELESAI', p_aktor_id, p_alasan
    );
$$;

create or replace function public.tolak_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_dokumen public.dokumen;
    v_jenis public.jenis_dokumen;
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
    v_aktor record;
    v_count integer;
    v_approved integer;
    v_next integer;
    v_peran_level text;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Dokumen tidak ditemukan.';
    end if;
    select * into v_jenis from public.jenis_dokumen where tipe = v_dokumen.tipe;
    select id, peran into v_aktor from public.profiles where id = v_aktor_id and aktif = true;

    if v_dokumen.pembuat_id = v_aktor_id then
        raise exception 'Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.';
    end if;
    if not v_jenis.perlu_approval
        or v_jenis.status_menunggu_approval is null
        or v_dokumen.status <> v_jenis.status_menunggu_approval then
        raise exception 'Status % tidak bisa diubah menjadi DITOLAK.', v_dokumen.status;
    end if;

    v_count := jsonb_array_length(v_dokumen.approval_snapshot);
    if v_count = 0 then
        raise exception 'Aturan approval untuk nilai ini belum ada.';
    end if;

    select count(distinct level) into v_approved
    from public.riwayat_status
    where dokumen_id = p_dokumen_id
      and siklus_approval = v_dokumen.siklus_approval
      and aksi = 'SETUJUI'
      and level is not null;

    v_next := least(v_approved + 1, v_count);
    select elem->>'peran' into v_peran_level
    from jsonb_array_elements(v_dokumen.approval_snapshot) elem
    where (elem->>'level')::integer = v_next;

    if v_aktor.peran is distinct from v_peran_level then
        raise exception 'Peran Anda tidak berwenang menyetujui level %.', v_next;
    end if;

    return public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'DITOLAK', 'TOLAK', v_aktor_id, p_alasan,
        null, false, null, false
    );
end;
$$;

create or replace function public.batalkan_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
    select public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'DIBATALKAN', 'BATAL', p_aktor_id, p_alasan
    );
$$;

create or replace function public.proses_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
    select public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'DIPROSES', 'PROSES', p_aktor_id, p_alasan
    );
$$;

create or replace function public.selesaikan_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
    select public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, 'SELESAI', 'SELESAI', p_aktor_id, p_alasan
    );
$$;

create or replace function public.pindah_status_dokumen(
    p_dokumen_id uuid,
    p_versi bigint,
    p_status_tujuan text,
    p_aksi text,
    p_aktor_id uuid,
    p_alasan text default null,
    p_diposting boolean default false,
    p_reset_approval boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_dokumen public.dokumen;
    v_jenis public.jenis_dokumen;
    v_aktor_id uuid := public.validasi_aktor_dokumen(p_aktor_id);
    v_count integer;
    v_approved integer;
    v_missing integer;
    v_reset boolean;
begin
    if p_status_tujuan is null or p_aksi is null then
        raise exception 'Status dan aksi tujuan wajib diisi.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Dokumen tidak ditemukan.';
    end if;
    select * into v_jenis from public.jenis_dokumen where tipe = v_dokumen.tipe;

    if p_status_tujuan = 'DISETUJUI' and v_jenis.perlu_approval then
        v_count := jsonb_array_length(v_dokumen.approval_snapshot);
        select count(distinct level) into v_approved
        from public.riwayat_status
        where dokumen_id = p_dokumen_id
          and siklus_approval = v_dokumen.siklus_approval
          and aksi = 'SETUJUI'
          and level is not null;

        if v_count = 0 then
            raise exception 'Aturan approval untuk nilai ini belum ada.';
        end if;
        if v_approved < v_count then
            v_missing := v_approved + 1;
            raise exception 'Persetujuan level % belum lengkap.', v_missing;
        end if;
    end if;

    v_reset := coalesce(p_reset_approval, p_aksi = 'REVISI');

    return public.catat_transisi_dokumen_internal(
        p_dokumen_id, p_versi, p_status_tujuan, p_aksi, v_aktor_id, p_alasan,
        null, p_diposting, case when v_reset then '[]'::jsonb else null end, v_reset
    );
end;
$$;

revoke all on function public.dokumen_json(public.dokumen) from public, anon, authenticated, service_role;
revoke all on function public.validasi_aktor_dokumen(uuid) from public, anon, authenticated, service_role;
revoke all on function public.daftarkan_jenis_dokumen(text, text, text, text[], boolean, text, uuid) from public, anon, authenticated;
revoke all on function public.tambah_status_jenis_dokumen(text, text, uuid) from public, anon, authenticated;
revoke all on function public.buat_dokumen(text, uuid, numeric, date) from public, anon, authenticated;
revoke all on function public.catat_transisi_dokumen_internal(uuid, bigint, text, text, uuid, text, smallint, boolean, jsonb, boolean) from public, anon, authenticated, service_role;
revoke all on function public.ajukan_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.periksa_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.setujui_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.revisi_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.selesaikan_revisi_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.tolak_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.batalkan_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.proses_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.selesaikan_dokumen(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.pindah_status_dokumen(uuid, bigint, text, text, uuid, text, boolean, boolean) from public, anon, authenticated;

grant execute on function public.daftarkan_jenis_dokumen(text, text, text, text[], boolean, text, uuid) to service_role;
grant execute on function public.tambah_status_jenis_dokumen(text, text, uuid) to service_role;
grant execute on function public.buat_dokumen(text, uuid, numeric, date) to service_role;
grant execute on function public.ajukan_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.periksa_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.setujui_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.revisi_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.selesaikan_revisi_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.tolak_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.batalkan_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.proses_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.selesaikan_dokumen(uuid, bigint, uuid, text) to service_role;
grant execute on function public.pindah_status_dokumen(uuid, bigint, text, text, uuid, text, boolean, boolean) to service_role;
