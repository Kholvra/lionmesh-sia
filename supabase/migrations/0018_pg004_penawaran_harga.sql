-- PG-004: harga pembanding per barang per pemasok, lalu penetapan satu pemasok.
--
-- Aturan harga terendah: bandingkan total harga seluruh barang permintaan per
-- pemasok. Pemasok hanya bisa ditetapkan bila mengutip harga untuk semua barang.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

alter table public.permintaan_pembelian
    add column alasan_pemilihan text;

create table public.penawaran_harga (
    id uuid primary key default gen_random_uuid(),
    permintaan_id uuid not null references public.permintaan_pembelian (dokumen_id),
    item_id uuid not null references public.permintaan_pembelian_item (id),
    pemasok_id uuid not null references public.pemasok (id),
    harga numeric(18,2) not null,
    tanggal date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_penawaran_harga_positif check (harga > 0)
);

create index idx_penawaran_permintaan on public.penawaran_harga (permintaan_id);
create index idx_penawaran_riwayat on public.penawaran_harga (item_id, pemasok_id, tanggal desc);

-- Satu harga per barang, pemasok, dan tanggal. Harga baru pada tanggal lain
-- menambah riwayat; koreksi pada tanggal yang sama memperbarui baris.
create unique index uq_penawaran_item_pemasok_tanggal
on public.penawaran_harga (item_id, pemasok_id, tanggal);

-- ---------------------------------------------------------------------------
-- Entry points
-- ---------------------------------------------------------------------------

create or replace function public.simpan_penawaran_harga(
    p_dokumen_id uuid,
    p_item_id uuid,
    p_pemasok_id uuid,
    p_harga numeric,
    p_tanggal date,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Purchasing']);
    v_dokumen public.dokumen;
    v_id uuid;
begin
    if p_harga is null or p_harga <= 0 then
        raise exception 'Harga harus lebih dari 0';
    end if;

    if p_tanggal is null then
        raise exception 'Tanggal harga wajib diisi';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found
        or not exists (select 1 from public.permintaan_pembelian where dokumen_id = p_dokumen_id)
    then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if v_dokumen.status <> 'DISETUJUI' then
        raise exception 'Harga pembanding hanya bisa diisi untuk permintaan yang sudah disetujui';
    end if;

    if not exists (
        select 1 from public.permintaan_pembelian_item
        where id = p_item_id and permintaan_id = p_dokumen_id
    ) then
        raise exception 'Barang tidak termasuk permintaan ini';
    end if;

    if not exists (select 1 from public.pemasok where id = p_pemasok_id and aktif = true) then
        raise exception 'Pemasok nonaktif tidak bisa dipilih';
    end if;

    insert into public.penawaran_harga (
        permintaan_id, item_id, pemasok_id, harga, tanggal, created_by, updated_by
    ) values (
        p_dokumen_id, p_item_id, p_pemasok_id, round(p_harga, 2), p_tanggal, v_aktor, v_aktor
    )
    on conflict (item_id, pemasok_id, tanggal) do update
    set harga = excluded.harga,
        updated_by = excluded.updated_by,
        updated_at = now()
    returning id into v_id;

    return jsonb_build_object('id', v_id, 'dokumen_id', p_dokumen_id);
end;
$$;

create or replace function public.tetapkan_pemasok_pr_dengan_alasan(
    p_dokumen_id uuid,
    p_versi bigint,
    p_pemasok_id uuid,
    p_alasan text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Purchasing']);
    v_dokumen public.dokumen;
    v_alasan text := nullif(btrim(coalesce(p_alasan, '')), '');
    v_jumlah_item integer;
    v_jumlah_dikutip integer;
    v_total_pemasok numeric(18,2);
    v_total_terendah numeric(18,2);
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found
        or not exists (select 1 from public.permintaan_pembelian where dokumen_id = p_dokumen_id)
    then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if v_dokumen.status <> 'DISETUJUI' then
        raise exception 'Pemasok hanya bisa dipilih untuk permintaan yang sudah disetujui';
    end if;

    if not exists (select 1 from public.pemasok where id = p_pemasok_id and aktif = true) then
        raise exception 'Pemasok nonaktif tidak bisa dipilih';
    end if;

    select count(*) into v_jumlah_item
    from public.permintaan_pembelian_item
    where permintaan_id = p_dokumen_id;

    if v_jumlah_item = 0 then
        raise exception 'Permintaan tidak punya barang untuk dipasok';
    end if;

    -- Harga terbaru per barang adalah harga berlaku pemasok itu.
    with terbaru as (
        select distinct on (item_id) item_id, harga
        from public.penawaran_harga
        where permintaan_id = p_dokumen_id and pemasok_id = p_pemasok_id
        order by item_id, tanggal desc, created_at desc
    )
    select count(*), coalesce(sum(harga), 0)
    into v_jumlah_dikutip, v_total_pemasok
    from terbaru;

    if v_jumlah_dikutip <> v_jumlah_item then
        raise exception 'Pemasok harus punya harga untuk semua barang permintaan';
    end if;

    with terbaru as (
        select distinct on (pemasok_id, item_id) pemasok_id, item_id, harga
        from public.penawaran_harga
        where permintaan_id = p_dokumen_id
        order by pemasok_id, item_id, tanggal desc, created_at desc
    ),
    lengkap as (
        select pemasok_id, sum(harga) as total
        from terbaru
        group by pemasok_id
        having count(*) = v_jumlah_item
    )
    select min(total) into v_total_terendah from lengkap;

    if v_total_pemasok > v_total_terendah and v_alasan is null then
        raise exception 'Alasan pemilihan wajib diisi karena bukan harga terendah';
    end if;

    update public.permintaan_pembelian
    set pemasok_id = p_pemasok_id,
        alasan_pemilihan = v_alasan,
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    return public.pindah_status_dokumen(
        p_dokumen_id, p_versi, 'PEMASOK_DITETAPKAN', 'PILIH_PEMASOK', v_aktor, null
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.penawaran_harga enable row level security;

revoke all on public.penawaran_harga from anon, authenticated;

grant select on public.penawaran_harga to authenticated;
grant all on public.penawaran_harga to service_role;

create policy "Staf aktif boleh baca harga pembanding"
on public.penawaran_harga for select to authenticated
using (public.is_active_staff());

revoke all on function public.simpan_penawaran_harga(uuid, uuid, uuid, numeric, date, uuid)
from public, anon, authenticated;
revoke all on function public.tetapkan_pemasok_pr_dengan_alasan(uuid, bigint, uuid, text, uuid)
from public, anon, authenticated;

grant execute on function public.simpan_penawaran_harga(uuid, uuid, uuid, numeric, date, uuid)
to service_role;
grant execute on function public.tetapkan_pemasok_pr_dengan_alasan(uuid, bigint, uuid, text, uuid)
to service_role;
