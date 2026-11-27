-- PG-007: QC bahan dan retur ke pemasok.
--
-- QC lulus (mutasi stok + jurnal) sudah ada di C-013 (`catat_qc_penerimaan`).
-- Migrasi ini menambah: lokasi pemisahan barang gagal, jenis dokumen retur
-- pemasok beserta statusnya, dan entry point retur (ajukan, putuskan, batal).

-- ---------------------------------------------------------------------------
-- Barang gagal: lokasi pemisahan sebagai teks (R-04, AC-18)
-- ---------------------------------------------------------------------------

alter table public.penerimaan_item
    add column lokasi_pemisahan text;

-- ---------------------------------------------------------------------------
-- Jenis dokumen retur pemasok (R-05)
-- ---------------------------------------------------------------------------

insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('RETUR_PEMASOK', 'Retur pemasok', 'DIAJUKAN', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('RETUR_PEMASOK', 'DIAJUKAN', 1),
    ('RETUR_PEMASOK', 'DISETUJUI', 2),
    ('RETUR_PEMASOK', 'DITOLAK', 3),
    ('RETUR_PEMASOK', 'DIBATALKAN', 4)
on conflict (tipe, status) do nothing;

insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan) values
    ('DIAJUKAN', 'DISETUJUI', 'SETUJUI', false),
    ('DIAJUKAN', 'DITOLAK', 'TOLAK', true),
    ('DIAJUKAN', 'DIBATALKAN', 'BATAL', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.retur_pemasok (
    dokumen_id uuid primary key references public.dokumen (id),
    penerimaan_id uuid not null references public.penerimaan (dokumen_id),
    pemasok_id uuid not null references public.pemasok (id),
    alasan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now()
);

create index idx_retur_pemasok_penerimaan on public.retur_pemasok (penerimaan_id);
create index idx_retur_pemasok_pemasok on public.retur_pemasok (pemasok_id);

create table public.retur_pemasok_item (
    id uuid primary key default gen_random_uuid(),
    retur_id uuid not null references public.retur_pemasok (dokumen_id),
    penerimaan_item_id uuid not null references public.penerimaan_item (id),
    qty numeric(18,4) not null,
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_retur_item_urutan unique (retur_id, urutan),
    constraint uq_retur_item_baris unique (retur_id, penerimaan_item_id),
    constraint ck_retur_item_qty check (qty > 0),
    constraint ck_retur_item_urutan check (urutan > 0)
);

create index idx_retur_item_retur on public.retur_pemasok_item (retur_id);
create index idx_retur_item_penerimaan_item on public.retur_pemasok_item (penerimaan_item_id);

-- ---------------------------------------------------------------------------
-- Lokasi pemisahan barang gagal
-- ---------------------------------------------------------------------------

create or replace function public.catat_lokasi_pemisahan(
    p_penerimaan_item_id uuid,
    p_lokasi text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Gudang']);
    v_qty_diterima numeric(18,4);
    v_qty_lulus numeric(18,4);
begin
    if p_lokasi is null or length(btrim(p_lokasi)) = 0 then
        raise exception 'Lokasi pemisahan wajib diisi';
    end if;

    select qty_diterima, qty_lulus into v_qty_diterima, v_qty_lulus
    from public.penerimaan_item
    where id = p_penerimaan_item_id
    for update;

    if not found then
        raise exception 'Baris penerimaan tidak ditemukan.';
    end if;

    if v_qty_lulus is null then
        raise exception 'Hasil QC untuk baris ini belum dicatat';
    end if;

    if v_qty_diterima - v_qty_lulus <= 0 then
        raise exception 'Baris ini tidak punya qty gagal untuk dipisahkan';
    end if;

    update public.penerimaan_item
    set lokasi_pemisahan = btrim(p_lokasi),
        updated_by = v_aktor,
        updated_at = now()
    where id = p_penerimaan_item_id;

    return jsonb_build_object(
        'penerimaan_item_id', p_penerimaan_item_id,
        'lokasi_pemisahan', btrim(p_lokasi)
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Retur pemasok
-- ---------------------------------------------------------------------------

create or replace function public.ajukan_retur_pemasok(
    p_dokumen_id uuid,
    p_baris jsonb,
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
    v_penerimaan public.penerimaan;
    v_dokumen public.dokumen;
    v_pemasok_id uuid;
    v_hasil jsonb;
    v_retur_id uuid;
    v_i integer := 0;
    v_elem jsonb;
    v_item_id uuid;
    v_qty numeric(18,4);
    v_qty_diterima numeric(18,4);
    v_qty_lulus numeric(18,4);
    v_sudah numeric(18,4);
    v_tipe_produk text;
begin
    select * into v_penerimaan from public.penerimaan where dokumen_id = p_dokumen_id for update;
    if not found then
        raise exception 'Penerimaan tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if v_dokumen.status not in ('QC_LULUS', 'QC_GAGAL') then
        raise exception 'Retur hanya bisa diajukan untuk penerimaan yang sudah di-QC. Status saat ini: %.', v_dokumen.status;
    end if;

    select p.pemasok_id into v_pemasok_id
    from public.po p
    where p.dokumen_id = v_penerimaan.po_id;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Retur harus merujuk minimal satu baris penerimaan';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        v_item_id := nullif(v_elem->>'penerimaan_item_id', '')::uuid;
        if v_item_id is null then
            raise exception 'Baris retur % wajib merujuk baris penerimaan', v_i;
        end if;

        if coalesce(v_elem->>'qty', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Qty retur baris % harus lebih dari 0', v_i;
        end if;
        v_qty := (v_elem->>'qty')::numeric(18,4);
        if v_qty <= 0 then
            raise exception 'Qty retur baris % harus lebih dari 0', v_i;
        end if;

        select qi.qty_diterima, qi.qty_lulus, pr.tipe
        into v_qty_diterima, v_qty_lulus, v_tipe_produk
        from public.penerimaan_item qi
        join public.po_item pi on pi.id = qi.po_item_id
        join public.produk pr on pr.id = pi.produk_id
        where qi.id = v_item_id and qi.penerimaan_id = p_dokumen_id
        for update of qi;

        if not found then
            raise exception 'Baris retur % bukan bagian dari penerimaan ini', v_i;
        end if;

        if v_tipe_produk <> 'bahan' then
            raise exception 'Retur pemasok hanya untuk bahan';
        end if;

        if v_qty_lulus is null then
            raise exception 'Hasil QC baris % belum dicatat', v_i;
        end if;

        select coalesce(sum(ri.qty), 0) into v_sudah
        from public.retur_pemasok_item ri
        join public.dokumen d on d.id = ri.retur_id
        where ri.penerimaan_item_id = v_item_id
          and d.status in ('DIAJUKAN', 'DISETUJUI');

        if v_qty > (v_qty_diterima - v_qty_lulus) - v_sudah then
            raise exception 'Qty retur baris % melebihi qty gagal yang tersedia (%)',
                v_i, (v_qty_diterima - v_qty_lulus) - v_sudah;
        end if;
    end loop;

    v_hasil := public.buat_dokumen(
        'RETUR_PEMASOK', v_aktor, null, (now() at time zone 'Asia/Jakarta')::date
    );
    v_retur_id := (v_hasil->'dokumen'->>'id')::uuid;

    insert into public.retur_pemasok (
        dokumen_id, penerimaan_id, pemasok_id, alasan, created_by, updated_by
    ) values (
        v_retur_id, p_dokumen_id, v_pemasok_id, nullif(btrim(coalesce(p_alasan, '')), ''),
        v_aktor, v_aktor
    );

    v_i := 0;
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;
        insert into public.retur_pemasok_item (
            retur_id, penerimaan_item_id, qty, urutan, created_by, updated_by
        ) values (
            v_retur_id,
            (v_elem->>'penerimaan_item_id')::uuid,
            (v_elem->>'qty')::numeric(18,4),
            v_i,
            v_aktor,
            v_aktor
        );
    end loop;

    return v_hasil || jsonb_build_object('retur_id', v_retur_id);
end;
$$;

create or replace function public.putuskan_retur_pemasok(
    p_dokumen_id uuid,
    p_versi bigint,
    p_setuju boolean,
    p_alasan text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_dokumen public.dokumen;
    v_alasan text := nullif(btrim(coalesce(p_alasan, '')), '');
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found or not exists (
        select 1 from public.retur_pemasok where dokumen_id = p_dokumen_id
    ) then
        raise exception 'Retur pemasok tidak ditemukan.';
    end if;

    if v_dokumen.pembuat_id = v_aktor then
        raise exception 'Pengaju retur tidak bisa memutuskan retur sendiri.';
    end if;

    if v_dokumen.status <> 'DIAJUKAN' then
        raise exception 'Retur berstatus % tidak bisa diputuskan.', v_dokumen.status;
    end if;

    if not p_setuju and v_alasan is null then
        raise exception 'Alasan penolakan wajib diisi';
    end if;

    return public.pindah_status_dokumen(
        p_dokumen_id,
        p_versi,
        case when p_setuju then 'DISETUJUI' else 'DITOLAK' end,
        case when p_setuju then 'SETUJUI' else 'TOLAK' end,
        v_aktor,
        v_alasan
    );
end;
$$;

create or replace function public.batalkan_retur_pemasok(
    p_dokumen_id uuid,
    p_versi bigint,
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
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pembatalan wajib diisi';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found or not exists (
        select 1 from public.retur_pemasok where dokumen_id = p_dokumen_id
    ) then
        raise exception 'Retur pemasok tidak ditemukan.';
    end if;

    if v_dokumen.pembuat_id <> v_aktor then
        raise exception 'Hanya pengaju retur yang bisa membatalkan retur ini.';
    end if;

    if v_dokumen.status <> 'DIAJUKAN' then
        raise exception 'Retur berstatus % tidak bisa dibatalkan.', v_dokumen.status;
    end if;

    return public.batalkan_dokumen(p_dokumen_id, p_versi, v_aktor, btrim(p_alasan));
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.retur_pemasok enable row level security;
alter table public.retur_pemasok_item enable row level security;

revoke all on public.retur_pemasok from anon, authenticated;
revoke all on public.retur_pemasok_item from anon, authenticated;

grant select on public.retur_pemasok to authenticated;
grant select on public.retur_pemasok_item to authenticated;
grant all on public.retur_pemasok to service_role;
grant all on public.retur_pemasok_item to service_role;

create policy "Staf aktif boleh baca retur pemasok"
on public.retur_pemasok for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca baris retur pemasok"
on public.retur_pemasok_item for select to authenticated
using (public.is_active_staff());

revoke all on function public.catat_lokasi_pemisahan(uuid, text, uuid)
from public, anon, authenticated;
revoke all on function public.ajukan_retur_pemasok(uuid, jsonb, text, uuid)
from public, anon, authenticated;
revoke all on function public.putuskan_retur_pemasok(uuid, bigint, boolean, text, uuid)
from public, anon, authenticated;
revoke all on function public.batalkan_retur_pemasok(uuid, bigint, text, uuid)
from public, anon, authenticated;

grant execute on function public.catat_lokasi_pemisahan(uuid, text, uuid) to service_role;
grant execute on function public.ajukan_retur_pemasok(uuid, jsonb, text, uuid) to service_role;
grant execute on function public.putuskan_retur_pemasok(uuid, bigint, boolean, text, uuid) to service_role;
grant execute on function public.batalkan_retur_pemasok(uuid, bigint, text, uuid) to service_role;
