-- C-010: Tutup buku dan jurnal penutup.
--
-- Menambah tahun buku, jejak transisi periode/tahun (pola D-63), sumber jurnal
-- TUTUP_BUKU, dan dua RPC: tutup_periode() serta tutup_buku_tahunan().
-- Tidak mengubah tabel/RPC FND-006; jurnal penutup tetap ditulis lewat
-- public.post_journal() di dalam transaksi tutup tahun.

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
-- 5. RLS dan grant tabel
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
-- 6. Helper internal
-- ---------------------------------------------------------------------------

create or replace function public.c010_validasi_aktor(p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_actor uuid;
    v_peran text;
begin
    v_actor := coalesce(auth.uid(), p_actor_id);
    if v_actor is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    select peran into v_peran
    from public.profiles
    where id = v_actor and aktif = true;

    if not found or v_peran is distinct from 'Accounting' then
        raise exception 'Anda tidak berwenang menutup periode akuntansi.';
    end if;

    return v_actor;
end;
$$;

-- Daftar dokumen setengah posting pada satu bulan. Definisi D-68 simetris:
-- diposting harus sama dengan ada-tidaknya jurnal dengan sumber_id dokumen itu
-- di bulan tersebut.
create or replace function public.c010_daftar_setengah_posting(
    p_tahun integer,
    p_bulan integer
)
returns table (nomor text, tipe text)
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
    select d.nomor, d.tipe
    from public.dokumen d
    where d.periode = make_date(p_tahun, p_bulan, 1)
      and d.diposting <> exists (
          select 1
          from public.jurnal j
          where j.sumber_id = d.id
            and j.tanggal >= make_timestamptz(
                p_tahun, p_bulan, 1, 0, 0, 0, 'Asia/Jakarta'
            )
            and j.tanggal < make_timestamptz(
                p_tahun, p_bulan, 1, 0, 0, 0, 'Asia/Jakarta'
            ) + interval '1 month'
      )
    order by d.nomor;
$$;

create or replace function public.c010_hitung_setengah_posting(
    p_tahun integer,
    p_bulan integer
)
returns integer
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
    select count(*)::integer
    from public.c010_daftar_setengah_posting(p_tahun, p_bulan);
$$;

create or replace function public.c010_cek_setengah_posting(
    p_tahun integer,
    p_bulan integer
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_contoh record;
begin
    select * into v_contoh
    from public.c010_daftar_setengah_posting(p_tahun, p_bulan)
    limit 1;

    if found then
        raise exception 'Dokumen setengah posting pada % %: % (%).',
            public.nama_bulan_akuntansi(p_bulan), p_tahun,
            v_contoh.nomor, v_contoh.tipe;
    end if;
end;
$$;

create or replace function public.c010_cek_neraca_saldo(
    p_tahun integer,
    p_bulan integer
)
returns numeric
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_debit numeric(18,2);
    v_kredit numeric(18,2);
    v_selesai timestamptz := make_timestamptz(
        p_tahun, p_bulan, 1, 0, 0, 0, 'Asia/Jakarta'
    ) + interval '1 month';
begin
    select coalesce(sum(d.debit), 0), coalesce(sum(d.kredit), 0)
    into v_debit, v_kredit
    from public.detail_jurnal d
    join public.jurnal j on j.id = d.jurnal_id
    where j.tanggal < v_selesai;

    if v_debit <> v_kredit then
        raise exception 'Neraca saldo per akhir % % tidak seimbang: debit %, kredit %.',
            public.nama_bulan_akuntansi(p_bulan), p_tahun,
            public.format_uang(v_debit), public.format_uang(v_kredit);
    end if;

    return v_debit;
end;
$$;

-- Memastikan baris periode ada dan mengunci barisnya. Baris yang dibuat helper
-- ini mendapat riwayat BUAT; baris yang sudah ada hanya dikunci oleh pemanggil.
create or replace function public.c010_siapkan_bulan(
    p_tahun integer,
    p_bulan integer,
    p_actor uuid
)
returns table (status text, dibuat boolean)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_status text;
begin
    insert into public.periode_akuntansi (
        tahun, bulan, status, created_by, updated_by
    ) values (
        p_tahun, p_bulan, 'buka', p_actor, p_actor
    )
    on conflict (tahun, bulan) do nothing
    returning public.periode_akuntansi.status into v_status;

    if v_status is not null then
        insert into public.periode_akuntansi_riwayat_status (
            tahun, bulan, aksi, status_lama, status_baru, actor_id
        ) values (
            p_tahun, p_bulan, 'BUAT', null, 'buka', p_actor
        );
        return query select 'buka'::text, true;
    end if;

    select p.status into v_status
    from public.periode_akuntansi p
    where p.tahun = p_tahun and p.bulan = p_bulan
    for update;

    if v_status is null then
        raise exception 'Periode % % tidak ditemukan.',
            public.nama_bulan_akuntansi(p_bulan), p_tahun;
    end if;

    return query select v_status, false;
end;
$$;

create or replace function public.c010_kunci_bulan(
    p_tahun integer,
    p_bulan integer,
    p_actor uuid,
    p_sekarang timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    update public.periode_akuntansi
    set status = 'kunci',
        dikunci_at = p_sekarang,
        dikunci_oleh = p_actor,
        updated_by = p_actor,
        updated_at = p_sekarang
    where tahun = p_tahun and bulan = p_bulan and status = 'buka';

    if not found then
        raise exception 'Periode % % tidak dalam status buka.',
            public.nama_bulan_akuntansi(p_bulan), p_tahun;
    end if;

    insert into public.periode_akuntansi_riwayat_status (
        tahun, bulan, aksi, status_lama, status_baru, actor_id
    ) values (
        p_tahun, p_bulan, 'TUTUP_PERIODE', 'buka', 'kunci', p_actor
    );
end;
$$;

create or replace function public.c010_cek_tahun_sebelumnya(p_tahun integer)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_ada boolean;
    v_status text;
begin
    select (
        exists (select 1 from public.periode_akuntansi where tahun = p_tahun - 1)
        or exists (select 1 from public.tahun_buku where tahun = p_tahun - 1)
    ) into v_ada;

    if not v_ada then
        return;
    end if;

    select status into v_status
    from public.tahun_buku
    where tahun = p_tahun - 1;

    if v_status is distinct from 'ditutup' then
        raise exception 'Tahun buku % belum ditutup; selesaikan tutup tahun itu sebelum menutup Januari %.',
            p_tahun - 1, p_tahun;
    end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. RPC tutup periode bulanan
-- ---------------------------------------------------------------------------

create or replace function public.tutup_periode(
    p_tahun integer,
    p_bulan integer,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_actor uuid;
    v_sekarang timestamptz := now();
    v_info record;
    v_bulan integer;
    v_januari text;
begin
    v_actor := public.c010_validasi_aktor(p_actor_id);

    if p_tahun is null or p_tahun < 2000 or p_tahun > 9999 then
        raise exception 'Tahun periode tidak valid.';
    end if;
    if p_bulan is null or p_bulan < 1 or p_bulan > 12 then
        raise exception 'Bulan periode tidak valid.';
    end if;
    if p_bulan = 12 then
        raise exception 'Desember ditutup lewat tutup buku tahunan, bukan tutup periode bulanan.';
    end if;

    select status into v_januari
    from public.periode_akuntansi
    where tahun = p_tahun and bulan = 1;

    if v_januari is distinct from 'kunci' then
        perform public.c010_cek_tahun_sebelumnya(p_tahun);
    end if;

    for v_bulan in 1..(p_bulan - 1) loop
        select * into v_info
        from public.c010_siapkan_bulan(p_tahun, v_bulan, v_actor);

        if v_info.status = 'buka' and not v_info.dibuat then
            raise exception 'Periode % % belum ditutup; tutup periode % % ditolak.',
                public.nama_bulan_akuntansi(v_bulan), p_tahun,
                public.nama_bulan_akuntansi(p_bulan), p_tahun;
        end if;

        if v_info.status = 'buka' and v_info.dibuat then
            perform public.c010_cek_setengah_posting(p_tahun, v_bulan);
            perform public.c010_kunci_bulan(p_tahun, v_bulan, v_actor, v_sekarang);
        end if;
    end loop;

    select * into v_info
    from public.c010_siapkan_bulan(p_tahun, p_bulan, v_actor);

    if v_info.status = 'kunci' then
        raise exception 'Periode % % sudah ditutup.',
            public.nama_bulan_akuntansi(p_bulan), p_tahun;
    end if;

    perform public.c010_cek_setengah_posting(p_tahun, p_bulan);
    perform public.c010_cek_neraca_saldo(p_tahun, p_bulan);
    perform public.c010_kunci_bulan(p_tahun, p_bulan, v_actor, v_sekarang);

    return jsonb_build_object(
        'tahun', p_tahun,
        'bulan', p_bulan,
        'status', 'kunci',
        'dikunci_at', v_sekarang
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC tutup buku tahunan
-- ---------------------------------------------------------------------------

create or replace function public.tutup_buku_tahunan(
    p_tahun integer,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_actor uuid;
    v_sekarang timestamptz := now();
    v_info record;
    v_bulan integer;
    v_tahun public.tahun_buku%rowtype;
    v_baris jsonb;
    v_total_debit numeric(18,2);
    v_total_kredit numeric(18,2);
    v_hasil jsonb;
    v_jurnal_id text;
    v_hasil_debit text;
    v_hasil_kredit text;
begin
    v_actor := public.c010_validasi_aktor(p_actor_id);

    if p_tahun is null or p_tahun < 2000 or p_tahun > 9999 then
        raise exception 'Tahun buku tidak valid.';
    end if;

    perform public.c010_cek_tahun_sebelumnya(p_tahun);

    select * into v_tahun
    from public.tahun_buku
    where tahun = p_tahun
    for update;

    if not found then
        insert into public.tahun_buku (
            tahun, status, created_by, updated_by
        ) values (
            p_tahun, 'terbuka', v_actor, v_actor
        )
        on conflict (tahun) do nothing
        returning * into v_tahun;

        if v_tahun.id is not null then
            insert into public.tahun_buku_riwayat_status (
                tahun_buku_id, aksi, status_lama, status_baru, actor_id
            ) values (
                v_tahun.id, 'BUAT', null, 'terbuka', v_actor
            );
        else
            select * into v_tahun
            from public.tahun_buku
            where tahun = p_tahun
            for update;
        end if;
    end if;

    if v_tahun.status = 'ditutup' then
        raise exception 'Tahun buku % sudah ditutup.', p_tahun;
    end if;

    for v_bulan in 1..11 loop
        select * into v_info
        from public.c010_siapkan_bulan(p_tahun, v_bulan, v_actor);

        if v_info.status = 'buka' and not v_info.dibuat then
            raise exception 'Periode % % belum ditutup; tutup buku tahunan % ditolak.',
                public.nama_bulan_akuntansi(v_bulan), p_tahun, p_tahun;
        end if;

        if v_info.status = 'buka' and v_info.dibuat then
            perform public.c010_kunci_bulan(p_tahun, v_bulan, v_actor, v_sekarang);
        end if;
    end loop;

    -- Desember harus masih buka; baris ini juga mengunci Desember sebelum
    -- saldo dibaca, sehingga posting Desember yang bersamaan ikut menunggu.
    select * into v_info
    from public.c010_siapkan_bulan(p_tahun, 12, v_actor);

    if v_info.status = 'kunci' then
        raise exception 'Desember % sudah ditutup; tutup buku tahunan tidak bisa membuat jurnal penutup.',
            p_tahun;
    end if;

    for v_bulan in 1..12 loop
        perform public.c010_cek_setengah_posting(p_tahun, v_bulan);
    end loop;
    perform public.c010_cek_neraca_saldo(p_tahun, 12);

    select
        coalesce(sum(case when x.neto < 0 then -x.neto else 0 end), 0),
        coalesce(sum(case when x.neto > 0 then x.neto else 0 end), 0),
        coalesce(
            jsonb_agg(
                case
                    when x.neto > 0 then jsonb_build_object(
                        'akun_peran', x.peran,
                        'debit', '0.00',
                        'kredit', x.neto::text
                    )
                    else jsonb_build_object(
                        'akun_peran', x.peran,
                        'debit', (-x.neto)::text,
                        'kredit', '0.00'
                    )
                end
                order by x.peran
            ),
            '[]'::jsonb
        )
    into v_total_debit, v_total_kredit, v_baris
    from (
        select a.peran, sum(d.debit) - sum(d.kredit) as neto
        from public.detail_jurnal d
        join public.jurnal j on j.id = d.jurnal_id
        join public.akun a on a.id = d.akun_id
        where j.tanggal >= make_timestamptz(
                p_tahun, 1, 1, 0, 0, 0, 'Asia/Jakarta'
            )
          and j.tanggal < make_timestamptz(
                p_tahun + 1, 1, 1, 0, 0, 0, 'Asia/Jakarta'
            )
          and a.peran in (
              'penjualan', 'hpp', 'tenaga_kerja_langsung',
              'overhead_pabrik', 'beban_gaji_admin'
          )
        group by a.peran
        having sum(d.debit) - sum(d.kredit) <> 0
    ) x;

    if v_total_debit > v_total_kredit then
        v_baris := v_baris || jsonb_build_array(jsonb_build_object(
            'akun_peran', 'laba_ditahan',
            'debit', '0.00',
            'kredit', (v_total_debit - v_total_kredit)::text
        ));
    elsif v_total_kredit > v_total_debit then
        v_baris := v_baris || jsonb_build_array(jsonb_build_object(
            'akun_peran', 'laba_ditahan',
            'debit', (v_total_kredit - v_total_debit)::text,
            'kredit', '0.00'
        ));
    end if;

    if jsonb_array_length(v_baris) >= 2 then
        v_hasil := public.post_journal(
            make_timestamptz(p_tahun, 12, 31, 23, 59, 59, 'Asia/Jakarta'),
            'TUTUP_BUKU',
            v_tahun.id,
            'TUTUP-BUKU/' || p_tahun::text,
            'TUTUP_BUKU_' || p_tahun::text,
            v_baris,
            'IDR',
            v_actor,
            null
        );

        if v_hasil is null then
            raise exception 'Jurnal penutup gagal dibuat.';
        end if;

        v_jurnal_id := v_hasil->>'jurnal_id';
        v_hasil_debit := v_hasil->>'total_debit';
        v_hasil_kredit := v_hasil->>'total_kredit';
    end if;

    perform public.c010_kunci_bulan(p_tahun, 12, v_actor, v_sekarang);

    update public.tahun_buku
    set status = 'ditutup',
        ditutup_at = v_sekarang,
        ditutup_oleh = v_actor,
        updated_by = v_actor,
        updated_at = v_sekarang
    where id = v_tahun.id;

    insert into public.tahun_buku_riwayat_status (
        tahun_buku_id, aksi, status_lama, status_baru, actor_id
    ) values (
        v_tahun.id, 'TUTUP_TAHUN', 'terbuka', 'ditutup', v_actor
    );

    return jsonb_build_object(
        'tahun', p_tahun,
        'status', 'ditutup',
        'jurnal_id', v_jurnal_id,
        'total_debit', v_hasil_debit,
        'total_kredit', v_hasil_kredit
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Grant fungsi
-- ---------------------------------------------------------------------------

revoke all on function public.c010_validasi_aktor(uuid)
from public, anon, authenticated;
grant execute on function public.c010_validasi_aktor(uuid) to service_role;

revoke all on function public.c010_daftar_setengah_posting(integer, integer)
from public, anon, authenticated;
grant execute on function public.c010_daftar_setengah_posting(integer, integer)
to service_role;

revoke all on function public.c010_hitung_setengah_posting(integer, integer)
from public, anon, authenticated;
grant execute on function public.c010_hitung_setengah_posting(integer, integer)
to service_role;

revoke all on function public.c010_cek_setengah_posting(integer, integer)
from public, anon, authenticated;
grant execute on function public.c010_cek_setengah_posting(integer, integer)
to service_role;

revoke all on function public.c010_cek_neraca_saldo(integer, integer)
from public, anon, authenticated;
grant execute on function public.c010_cek_neraca_saldo(integer, integer)
to service_role;

revoke all on function public.c010_siapkan_bulan(integer, integer, uuid)
from public, anon, authenticated;
grant execute on function public.c010_siapkan_bulan(integer, integer, uuid)
to service_role;

revoke all on function public.c010_kunci_bulan(integer, integer, uuid, timestamptz)
from public, anon, authenticated;
grant execute on function public.c010_kunci_bulan(integer, integer, uuid, timestamptz)
to service_role;

revoke all on function public.c010_cek_tahun_sebelumnya(integer)
from public, anon, authenticated;
grant execute on function public.c010_cek_tahun_sebelumnya(integer)
to service_role;

revoke all on function public.tutup_periode(integer, integer, uuid)
from public, anon, authenticated;
grant execute on function public.tutup_periode(integer, integer, uuid)
to service_role;

revoke all on function public.tutup_buku_tahunan(integer, uuid)
from public, anon, authenticated;
grant execute on function public.tutup_buku_tahunan(integer, uuid)
to service_role;
