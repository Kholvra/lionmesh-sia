-- FND-006: Ledger — COA, postJournal(), dan periode akuntansi

create table public.akun (
    id uuid primary key default gen_random_uuid(),
    nomor text not null,
    nama text not null,
    peran text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_akun_nomor unique (nomor),
    constraint uq_akun_peran unique (peran),
    constraint ck_akun_nomor_not_blank check (length(btrim(nomor)) > 0),
    constraint ck_akun_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_akun_peran_format check (peran ~ '^[a-z][a-z0-9_]*$')
);

create table public.jenis_sumber_jurnal (
    kode text primary key,
    nama text not null,
    peran_berhak text[],
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_jenis_sumber_kode_format check (kode ~ '^[A-Z][A-Z0-9_]*$'),
    constraint ck_jenis_sumber_nama_not_blank check (length(btrim(nama)) > 0),
    constraint ck_jenis_sumber_peran_berhak check (
        peran_berhak is null or cardinality(peran_berhak) > 0
    )
);

create table public.periode_akuntansi (
    tahun integer not null,
    bulan integer not null,
    status text not null default 'buka',
    dikunci_at timestamptz,
    dikunci_oleh uuid,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint pk_periode_akuntansi primary key (tahun, bulan),
    constraint ck_periode_tahun check (tahun between 2000 and 9999),
    constraint ck_periode_bulan check (bulan between 1 and 12),
    constraint ck_periode_status check (status in ('buka', 'kunci'))
);

create table public.jurnal (
    id uuid primary key default gen_random_uuid(),
    tanggal timestamptz not null,
    sumber_tipe text not null references public.jenis_sumber_jurnal (kode),
    sumber_id uuid not null,
    sumber_nomor text not null,
    sumber_pemicu text not null,
    mata_uang text not null default 'IDR',
    jurnal_asal_id uuid unique references public.jurnal (id),
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_jurnal_sumber_nomor_not_blank check (length(btrim(sumber_nomor)) > 0),
    constraint ck_jurnal_sumber_pemicu_not_blank check (length(btrim(sumber_pemicu)) > 0),
    constraint ck_jurnal_mata_uang_idr check (mata_uang = 'IDR'),
    constraint ck_jurnal_bukan_pembalik_sendiri check (jurnal_asal_id is null or jurnal_asal_id <> id)
);

create index idx_jurnal_tanggal on public.jurnal (tanggal desc);
create index idx_jurnal_sumber on public.jurnal (sumber_tipe, sumber_id);

create table public.detail_jurnal (
    id uuid primary key default gen_random_uuid(),
    jurnal_id uuid not null references public.jurnal (id),
    akun_id uuid not null references public.akun (id),
    debit numeric(18,2) not null default 0,
    kredit numeric(18,2) not null default 0,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_detail_jurnal_debit_non_negative check (debit >= 0),
    constraint ck_detail_jurnal_kredit_non_negative check (kredit >= 0),
    constraint ck_detail_jurnal_satu_sisi check (
        (debit > 0 and kredit = 0) or (kredit > 0 and debit = 0)
    )
);

create index idx_detail_jurnal_jurnal on public.detail_jurnal (jurnal_id);
create index idx_detail_jurnal_akun on public.detail_jurnal (akun_id);

create or replace function public.format_uang(p_nilai numeric)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
    select trim(
        trailing '.' from trim(
            trailing '0' from to_char(coalesce(p_nilai, 0), 'FM999999999999999990.00')
        )
    );
$$;

create or replace function public.nama_bulan_akuntansi(p_bulan integer)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
    select case p_bulan
        when 1 then 'Januari'
        when 2 then 'Februari'
        when 3 then 'Maret'
        when 4 then 'April'
        when 5 then 'Mei'
        when 6 then 'Juni'
        when 7 then 'Juli'
        when 8 then 'Agustus'
        when 9 then 'September'
        when 10 then 'Oktober'
        when 11 then 'November'
        when 12 then 'Desember'
        else p_bulan::text
    end;
$$;

create or replace function public.trg_prevent_jurnal_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    raise exception 'Jurnal yang sudah diposting tidak bisa diubah atau dihapus. Koreksi dengan jurnal pembalik.';
end;
$$;

create trigger trg_jurnal_immutable
before update or delete on public.jurnal
for each row
execute function public.trg_prevent_jurnal_mutation();

create trigger trg_detail_jurnal_immutable
before update or delete on public.detail_jurnal
for each row
execute function public.trg_prevent_jurnal_mutation();

create or replace function public.trg_prevent_delete_akun_terpakai()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if exists (
        select 1 from public.detail_jurnal where akun_id = old.id
    ) then
        raise exception 'Akun yang sudah dipakai di jurnal tidak bisa dihapus. Nonaktifkan akun.';
    end if;
    return old;
end;
$$;

create trigger trg_akun_prevent_delete_terpakai
before delete on public.akun
for each row
execute function public.trg_prevent_delete_akun_terpakai();

create or replace function public.check_jurnal_balance()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_jurnal_id uuid;
    v_jumlah_baris integer;
    v_total_debit numeric(18,2);
    v_total_kredit numeric(18,2);
begin
    if tg_table_name = 'jurnal' then
        v_jurnal_id := new.id;
    elsif tg_op = 'DELETE' then
        v_jurnal_id := old.jurnal_id;
    else
        v_jurnal_id := new.jurnal_id;
    end if;

    select
        count(*)::integer,
        coalesce(sum(debit), 0)::numeric(18,2),
        coalesce(sum(kredit), 0)::numeric(18,2)
    into v_jumlah_baris, v_total_debit, v_total_kredit
    from public.detail_jurnal
    where jurnal_id = v_jurnal_id;

    if v_jumlah_baris < 2 then
        raise exception 'Jurnal minimal dua baris.';
    end if;

    if v_total_debit <> v_total_kredit then
        raise exception 'Jurnal tidak seimbang: debit %, kredit %.',
            public.format_uang(v_total_debit),
            public.format_uang(v_total_kredit);
    end if;

    return null;
end;
$$;

create constraint trigger trg_jurnal_balance
after insert on public.jurnal
deferrable initially deferred
for each row
execute function public.check_jurnal_balance();

create constraint trigger trg_detail_jurnal_balance
after insert or update or delete on public.detail_jurnal
deferrable initially deferred
for each row
execute function public.check_jurnal_balance();

create or replace function public.post_journal(
    p_tanggal timestamptz,
    p_sumber_tipe text,
    p_sumber_id uuid,
    p_sumber_nomor text,
    p_sumber_pemicu text,
    p_baris jsonb,
    p_mata_uang text default 'IDR',
    p_actor_id uuid default null,
    p_jurnal_asal_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_actor_id uuid;
    v_actor_peran text;
    v_sumber public.jenis_sumber_jurnal%rowtype;
    v_line record;
    v_baris jsonb;
    v_akun record;
    v_debit numeric(18,2);
    v_kredit numeric(18,2);
    v_total_debit numeric(18,2) := 0;
    v_total_kredit numeric(18,2) := 0;
    v_jurnal_id uuid;
    v_tahun integer;
    v_bulan integer;
    v_nama_bulan text;
    v_status text;
begin
    if auth.role() = 'authenticated' and auth.uid() is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    v_actor_id := coalesce(auth.uid(), p_actor_id);
    if v_actor_id is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    select peran into v_actor_peran
    from public.profiles
    where id = v_actor_id and aktif = true;

    if not found or v_actor_peran is null or v_actor_peran = 'Karyawan' then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    if p_sumber_tipe is null or length(btrim(p_sumber_tipe)) = 0
        or p_sumber_id is null
        or p_sumber_nomor is null or length(btrim(p_sumber_nomor)) = 0
        or p_sumber_pemicu is null or length(btrim(p_sumber_pemicu)) = 0 then
        raise exception 'Sumber jurnal wajib diisi dan harus jenis yang terdaftar.';
    end if;

    select * into v_sumber
    from public.jenis_sumber_jurnal
    where kode = p_sumber_tipe;

    if not found or not v_sumber.aktif then
        raise exception 'Sumber jurnal wajib diisi dan harus jenis yang terdaftar.';
    end if;

    if v_sumber.peran_berhak is not null
        and not (v_actor_peran = any(v_sumber.peran_berhak)) then
        raise exception 'Anda tidak berwenang memposting transaksi ini.';
    end if;

    if p_mata_uang is distinct from 'IDR' then
        raise exception 'Jurnal hanya boleh dalam mata uang IDR.';
    end if;

    if p_tanggal is null then
        raise exception 'Tanggal jurnal wajib diisi.';
    end if;

    v_tahun := extract(year from (p_tanggal at time zone 'Asia/Jakarta'))::integer;
    v_bulan := extract(month from (p_tanggal at time zone 'Asia/Jakarta'))::integer;
    v_nama_bulan := public.nama_bulan_akuntansi(v_bulan);

    insert into public.periode_akuntansi (
        tahun, bulan, status, created_by, updated_by
    ) values (
        v_tahun, v_bulan, 'buka', v_actor_id, v_actor_id
    )
    on conflict (tahun, bulan) do nothing;

    select status into v_status
    from public.periode_akuntansi
    where tahun = v_tahun and bulan = v_bulan
    for update;

    if v_status is distinct from 'buka' then
        raise exception 'Periode % % sudah dikunci; posting ditolak.', v_nama_bulan, v_tahun;
    end if;

    if p_sumber_tipe = 'PEMBALIKAN' and p_jurnal_asal_id is null then
        raise exception 'Jurnal pembalik wajib merujuk jurnal asal.';
    end if;

    if p_jurnal_asal_id is not null then
        if p_sumber_tipe is distinct from 'PEMBALIKAN' then
            raise exception 'Jurnal pembalik harus memakai sumber PEMBALIKAN.';
        end if;

        if not exists (
            select 1 from public.jurnal
            where id = p_jurnal_asal_id and jurnal_asal_id is null
        ) then
            raise exception 'Jurnal asal tidak ditemukan atau bukan jurnal asli.';
        end if;

        if exists (
            select 1 from public.jurnal where jurnal_asal_id = p_jurnal_asal_id
        ) then
            raise exception 'Jurnal asal sudah dibalik.';
        end if;

        select jsonb_agg(
            jsonb_build_object(
                'akun_peran', a.peran,
                'debit', d.kredit,
                'kredit', d.debit
            )
            order by d.id
        )
        into v_baris
        from public.detail_jurnal d
        join public.akun a on a.id = d.akun_id
        where d.jurnal_id = p_jurnal_asal_id;

        if v_baris is null then
            raise exception 'Jurnal asal tidak memiliki baris.';
        end if;
    else
        v_baris := p_baris;
    end if;

    if v_baris is null
        or jsonb_typeof(v_baris) <> 'array'
        or jsonb_array_length(v_baris) < 2 then
        raise exception 'Jurnal minimal dua baris.';
    end if;

    for v_line in
        select * from jsonb_to_recordset(v_baris)
            as x(akun_peran text, debit numeric, kredit numeric)
    loop
        v_debit := coalesce(v_line.debit, 0);
        v_kredit := coalesce(v_line.kredit, 0);

        if v_debit < 0 or v_kredit < 0 then
            raise exception 'Nilai debit dan kredit tidak boleh negatif.';
        end if;

        if v_debit <> round(v_debit, 2) or v_kredit <> round(v_kredit, 2) then
            raise exception 'Nilai jurnal maksimal dua desimal.';
        end if;

        if not (
            (v_debit > 0 and v_kredit = 0)
            or (v_kredit > 0 and v_debit = 0)
        ) then
            raise exception 'Setiap baris jurnal harus berisi debit atau kredit, bukan keduanya.';
        end if;

        select id, nomor, aktif into v_akun
        from public.akun
        where peran = v_line.akun_peran;

        if not found or not v_akun.aktif then
            raise exception 'Akun % tidak ditemukan atau tidak aktif.',
                coalesce(v_akun.nomor, v_line.akun_peran, '-');
        end if;

        v_total_debit := v_total_debit + v_debit;
        v_total_kredit := v_total_kredit + v_kredit;
    end loop;

    if v_total_debit <> v_total_kredit then
        raise exception 'Jurnal tidak seimbang: debit %, kredit %.',
            public.format_uang(v_total_debit),
            public.format_uang(v_total_kredit);
    end if;

    insert into public.jurnal (
        tanggal, sumber_tipe, sumber_id, sumber_nomor, sumber_pemicu,
        mata_uang, jurnal_asal_id, created_by, updated_by
    ) values (
        p_tanggal, p_sumber_tipe, p_sumber_id, p_sumber_nomor, p_sumber_pemicu,
        p_mata_uang, p_jurnal_asal_id, v_actor_id, v_actor_id
    )
    returning id into v_jurnal_id;

    for v_line in
        select * from jsonb_to_recordset(v_baris)
            as x(akun_peran text, debit numeric, kredit numeric)
    loop
        v_debit := coalesce(v_line.debit, 0);
        v_kredit := coalesce(v_line.kredit, 0);

        select id, nomor into v_akun
        from public.akun
        where peran = v_line.akun_peran and aktif = true;

        if not found then
            raise exception 'Akun % tidak ditemukan atau tidak aktif.',
                coalesce(v_akun.nomor, v_line.akun_peran, '-');
        end if;

        insert into public.detail_jurnal (
            jurnal_id, akun_id, debit, kredit, created_by, updated_by
        ) values (
            v_jurnal_id, v_akun.id, v_debit, v_kredit, v_actor_id, v_actor_id
        );
    end loop;

    return jsonb_build_object(
        'jurnal_id', v_jurnal_id,
        'total_debit', v_total_debit::text,
        'total_kredit', v_total_kredit::text
    );
end;
$$;

create or replace function public.reverse_journal(
    p_jurnal_id uuid,
    p_tanggal timestamptz,
    p_sumber_id uuid,
    p_sumber_nomor text,
    p_sumber_pemicu text,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    return public.post_journal(
        p_tanggal,
        'PEMBALIKAN',
        p_sumber_id,
        p_sumber_nomor,
        p_sumber_pemicu,
        null::jsonb,
        'IDR',
        p_actor_id,
        p_jurnal_id
    );
end;
$$;

alter table public.akun enable row level security;
alter table public.jenis_sumber_jurnal enable row level security;
alter table public.periode_akuntansi enable row level security;
alter table public.jurnal enable row level security;
alter table public.detail_jurnal enable row level security;

revoke all on public.akun, public.jenis_sumber_jurnal, public.periode_akuntansi,
    public.jurnal, public.detail_jurnal
from public, anon, authenticated, service_role;

grant select on public.akun, public.jenis_sumber_jurnal, public.periode_akuntansi,
    public.jurnal, public.detail_jurnal
to authenticated, service_role;

create policy "Staf aktif boleh baca akun"
on public.akun for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca jenis sumber jurnal"
on public.jenis_sumber_jurnal for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca periode akuntansi"
on public.periode_akuntansi for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca jurnal"
on public.jurnal for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca detail jurnal"
on public.detail_jurnal for select
to authenticated
using (public.is_active_staff());

revoke all on function public.post_journal(
    timestamptz, text, uuid, text, text, jsonb, text, uuid, uuid
) from public, anon, authenticated;
revoke all on function public.reverse_journal(
    uuid, timestamptz, uuid, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.post_journal(
    timestamptz, text, uuid, text, text, jsonb, text, uuid, uuid
) to service_role;
grant execute on function public.reverse_journal(
    uuid, timestamptz, uuid, text, text, uuid
) to service_role;
