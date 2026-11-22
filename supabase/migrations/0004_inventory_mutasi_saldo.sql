-- FND-005: Inventory — mutasi, saldo, dan valuasi rata-rata bergerak

create table public.saldo_stok (
    produk_id uuid not null references public.produk (id),
    gudang_id uuid not null references public.gudang (id),
    qty numeric(18,4) not null default 0,
    nilai numeric(18,2) not null default 0,
    harga_rata numeric(18,4) not null default 0,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint pk_saldo_stok primary key (produk_id, gudang_id),
    constraint ck_saldo_stok_qty_non_negative check (qty >= 0),
    constraint ck_saldo_stok_nilai_non_negative check (nilai >= 0),
    constraint ck_saldo_stok_harga_rata_non_negative check (harga_rata >= 0)
);

create index idx_saldo_stok_gudang on public.saldo_stok (gudang_id);

create table public.mutasi_stok (
    id uuid primary key default gen_random_uuid(),
    produk_id uuid not null references public.produk (id),
    gudang_id uuid not null references public.gudang (id),
    tanggal timestamptz not null,
    tipe text not null,
    qty numeric(18,4) not null,
    harga_satuan numeric(18,4) not null default 0,
    nilai numeric(18,2) not null,
    sumber_tipe text not null,
    sumber_id uuid not null,
    alasan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_mutasi_stok_tipe check (tipe in ('MASUK', 'KELUAR', 'TRANSFER_KELUAR', 'TRANSFER_MASUK', 'PENYESUAIAN')),
    constraint ck_mutasi_stok_qty_not_zero check (qty <> 0),
    constraint ck_mutasi_stok_nilai_non_negative check (nilai >= 0),
    constraint ck_mutasi_stok_harga_satuan_non_negative check (harga_satuan >= 0),
    constraint ck_mutasi_stok_alasan_penyesuaian check (
        tipe <> 'PENYESUAIAN' or (alasan is not null and length(btrim(alasan)) > 0)
    )
);

create index idx_mutasi_stok_produk_gudang_tanggal on public.mutasi_stok (produk_id, gudang_id, tanggal desc);
create index idx_mutasi_stok_sumber on public.mutasi_stok (sumber_tipe, sumber_id);

-- Immutability trigger on mutasi_stok (AC-09)
create or replace function public.trg_prevent_mutasi_stok_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Mutasi stok tidak bisa diubah atau dihapus. Koreksi dengan mutasi baru.';
end;
$$;

create trigger trg_mutasi_stok_immutable
before update or delete on public.mutasi_stok
for each row
execute function public.trg_prevent_mutasi_stok_mutation();

-- Row Level Security & permissions (AC-06 / ARCH-04)
alter table public.saldo_stok enable row level security;
alter table public.mutasi_stok enable row level security;

revoke insert, update, delete on public.saldo_stok from anon, authenticated;
revoke insert, update, delete on public.mutasi_stok from anon, authenticated;
revoke select on public.saldo_stok from anon;
revoke select on public.mutasi_stok from anon;

grant select on public.saldo_stok to authenticated;
grant select on public.mutasi_stok to authenticated;

grant all on public.saldo_stok to service_role;
grant all on public.mutasi_stok to service_role;

-- Depends on FND-003 migration 0003, which defines is_active_staff().
create policy "Staf aktif boleh baca saldo stok"
on public.saldo_stok for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca mutasi stok"
on public.mutasi_stok for select
to authenticated
using (public.is_active_staff());

-- Functions for atomic inventory operations (SECURITY DEFINER)
create or replace function public.catat_mutasi_stok(
    p_produk_id uuid,
    p_gudang_id uuid,
    p_tanggal timestamptz,
    p_tipe text,
    p_qty numeric,
    p_harga_satuan numeric default null,
    p_sumber_tipe text default 'MANUAL',
    p_sumber_id uuid default null,
    p_alasan text default null,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer set search_path = pg_catalog, public
as $$
declare
    v_produk record;
    v_gudang record;
    v_saldo record;
    v_last_tanggal timestamptz;
    v_qty_lama numeric(18,4) := 0;
    v_nilai_lama numeric(18,2) := 0;
    v_harga_rata_lama numeric(18,4) := 0;
    v_qty_in numeric(18,4);
    v_harga_in numeric(18,4);
    v_nilai_in numeric(18,2);
    v_qty_out numeric(18,4);
    v_nilai_out numeric(18,2);
    v_qty_baru numeric(18,4);
    v_nilai_baru numeric(18,2);
    v_harga_rata_baru numeric(18,4);
    v_mutasi_qty numeric(18,4);
    v_mutasi_harga numeric(18,4);
    v_mutasi_nilai numeric(18,2);
    v_mutasi_id uuid;
    v_sumber_id uuid := coalesce(p_sumber_id, gen_random_uuid());
    v_actor_id uuid := coalesce(auth.uid(), p_actor_id);
begin
    if auth.role() = 'authenticated' and auth.uid() is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    if auth.uid() is not null then
        v_actor_id := auth.uid();
    end if;

    -- Serialize all writes and date checks for this product/warehouse, including
    -- the first movement where no saldo_stok row exists yet.
    perform pg_advisory_xact_lock(hashtextextended(p_produk_id::text || ':' || p_gudang_id::text, 0));

    if p_qty is null or p_qty = 0 then
        raise exception 'Qty harus bukan nol.';
    end if;

    if p_tipe not in ('MASUK', 'KELUAR', 'TRANSFER_KELUAR', 'TRANSFER_MASUK', 'PENYESUAIAN') then
        raise exception 'Tipe mutasi % tidak sah.', p_tipe;
    end if;

    if p_tipe = 'PENYESUAIAN' and (p_alasan is null or length(btrim(p_alasan)) = 0) then
        raise exception 'Isi alasan penyesuaian stok.';
    end if;

    if p_tipe = 'MASUK' and coalesce(p_harga_satuan, 0) <= 0 then
        raise exception 'Harga satuan harus lebih dari nol.';
    end if;

    select kode, aktif into v_produk from public.produk where id = p_produk_id;
    if not found or not v_produk.aktif then
        raise exception 'Produk % tidak ditemukan atau nonaktif.', coalesce(v_produk.kode, p_produk_id::text);
    end if;

    select kode, aktif into v_gudang from public.gudang where id = p_gudang_id;
    if not found or not v_gudang.aktif then
        raise exception 'Gudang % tidak ditemukan atau nonaktif.', coalesce(v_gudang.kode, p_gudang_id::text);
    end if;

    -- Validate backdate against last mutasi (PRE-03 / AC-07)
    select tanggal into v_last_tanggal
    from public.mutasi_stok
    where produk_id = p_produk_id and gudang_id = p_gudang_id
    order by tanggal desc, created_at desc
    limit 1;

    if v_last_tanggal is not null and p_tanggal < v_last_tanggal then
        raise exception 'Tanggal mutasi tidak boleh mendahului mutasi terakhir (%).', v_last_tanggal;
    end if;

    -- Lock saldo row
    select * into v_saldo
    from public.saldo_stok
    where produk_id = p_produk_id and gudang_id = p_gudang_id
    for update;

    if found then
        v_qty_lama := v_saldo.qty;
        v_nilai_lama := v_saldo.nilai;
        v_harga_rata_lama := v_saldo.harga_rata;
    end if;

    if p_tipe in ('MASUK', 'TRANSFER_MASUK') or (p_tipe = 'PENYESUAIAN' and p_qty > 0) then
        v_qty_in := abs(p_qty);
        v_harga_in := case
            when p_harga_satuan is not null and p_harga_satuan > 0 then p_harga_satuan
            else v_harga_rata_lama
        end;
        v_nilai_in := round(v_qty_in * v_harga_in, 2);
        v_qty_baru := v_qty_lama + v_qty_in;
        v_nilai_baru := v_nilai_lama + v_nilai_in;
        v_harga_rata_baru := round(v_nilai_baru / v_qty_baru, 4);

        v_mutasi_qty := v_qty_in;
        v_mutasi_harga := v_harga_in;
        v_mutasi_nilai := v_nilai_in;
    else
        v_qty_out := abs(p_qty);
        if v_qty_out > v_qty_lama then
            raise exception 'Qty keluar % melebihi stok tersedia %.',
                trim(trailing '.' from trim(trailing '0' from to_char(v_qty_out, 'FM999999999999999990.9999'))),
                trim(trailing '.' from trim(trailing '0' from to_char(v_qty_lama, 'FM999999999999999990.9999')));
        end if;

        if v_qty_out = v_qty_lama then
            v_nilai_out := v_nilai_lama;
            v_qty_baru := 0;
            v_nilai_baru := 0;
            v_harga_rata_baru := v_harga_rata_lama;
        else
            v_nilai_out := round(v_qty_out * v_harga_rata_lama, 2);
            v_qty_baru := v_qty_lama - v_qty_out;
            v_nilai_baru := v_nilai_lama - v_nilai_out;
            v_harga_rata_baru := v_harga_rata_lama;
        end if;

        v_mutasi_qty := -v_qty_out;
        v_mutasi_harga := v_harga_rata_lama;
        v_mutasi_nilai := v_nilai_out;
    end if;

    -- Update or insert saldo_stok
    insert into public.saldo_stok (
        produk_id, gudang_id, qty, nilai, harga_rata, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_id, v_qty_baru, v_nilai_baru, v_harga_rata_baru, v_actor_id, v_actor_id
    )
    on conflict (produk_id, gudang_id) do update set
        qty = excluded.qty,
        nilai = excluded.nilai,
        harga_rata = excluded.harga_rata,
        updated_by = excluded.updated_by,
        updated_at = now();

    -- Insert mutasi_stok
    insert into public.mutasi_stok (
        produk_id, gudang_id, tanggal, tipe, qty, harga_satuan, nilai,
        sumber_tipe, sumber_id, alasan, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_id, p_tanggal, p_tipe, v_mutasi_qty, v_mutasi_harga, v_mutasi_nilai,
        p_sumber_tipe, v_sumber_id, p_alasan, v_actor_id, v_actor_id
    ) returning id into v_mutasi_id;

    return jsonb_build_object(
        'mutasi_id', v_mutasi_id,
        'tipe', p_tipe,
        'qty', v_mutasi_qty,
        'harga_satuan', v_mutasi_harga,
        'nilai', v_mutasi_nilai,
        'saldo', jsonb_build_object('qty', v_qty_baru, 'nilai', v_nilai_baru, 'harga_rata', v_harga_rata_baru)
    );
end;
$$;

create or replace function public.transfer_stok(
    p_produk_id uuid,
    p_gudang_asal_id uuid,
    p_gudang_tujuan_id uuid,
    p_qty numeric,
    p_tanggal timestamptz default now(),
    p_sumber_id uuid default null,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer set search_path = pg_catalog, public
as $$
declare
    v_produk record;
    v_gudang_asal record;
    v_gudang_tujuan record;
    v_transfer_id uuid := coalesce(p_sumber_id, gen_random_uuid());
    v_saldo_asal record;
    v_saldo_tujuan record;
    v_last_tanggal_asal timestamptz;
    v_last_tanggal_tujuan timestamptz;
    v_qty_out numeric(18,4);
    v_nilai_out numeric(18,2);
    v_harga_asal numeric(18,4);
    v_qty_asal_baru numeric(18,4);
    v_nilai_asal_baru numeric(18,2);
    v_harga_asal_baru numeric(18,4);
    v_qty_tujuan_lama numeric(18,4) := 0;
    v_nilai_tujuan_lama numeric(18,2) := 0;
    v_harga_tujuan_lama numeric(18,4) := 0;
    v_qty_tujuan_baru numeric(18,4);
    v_nilai_tujuan_baru numeric(18,2);
    v_harga_tujuan_baru numeric(18,4);
    v_mutasi_keluar_id uuid;
    v_mutasi_masuk_id uuid;
    v_actor_id uuid := coalesce(auth.uid(), p_actor_id);
begin
    if auth.role() = 'authenticated' and auth.uid() is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    if auth.uid() is not null then
        v_actor_id := auth.uid();
    end if;

    -- Acquire both inventory locks in a stable order to prevent lost updates,
    -- backdated transfers, and deadlocks between opposite-direction transfers.
    if p_gudang_asal_id::text < p_gudang_tujuan_id::text then
        perform pg_advisory_xact_lock(hashtextextended(p_produk_id::text || ':' || p_gudang_asal_id::text, 0));
        perform pg_advisory_xact_lock(hashtextextended(p_produk_id::text || ':' || p_gudang_tujuan_id::text, 0));
    else
        perform pg_advisory_xact_lock(hashtextextended(p_produk_id::text || ':' || p_gudang_tujuan_id::text, 0));
        perform pg_advisory_xact_lock(hashtextextended(p_produk_id::text || ':' || p_gudang_asal_id::text, 0));
    end if;

    if p_qty is null or p_qty <= 0 then
        raise exception 'Qty harus bukan nol.';
    end if;

    if p_gudang_asal_id = p_gudang_tujuan_id then
        raise exception 'Gudang asal dan tujuan tidak boleh sama.';
    end if;

    select kode, aktif into v_produk from public.produk where id = p_produk_id;
    if not found or not v_produk.aktif then
        raise exception 'Produk % tidak ditemukan atau nonaktif.', coalesce(v_produk.kode, p_produk_id::text);
    end if;

    select kode, aktif into v_gudang_asal from public.gudang where id = p_gudang_asal_id;
    if not found or not v_gudang_asal.aktif then
        raise exception 'Gudang % tidak ditemukan atau nonaktif.', coalesce(v_gudang_asal.kode, p_gudang_asal_id::text);
    end if;

    select kode, aktif into v_gudang_tujuan from public.gudang where id = p_gudang_tujuan_id;
    if not found or not v_gudang_tujuan.aktif then
        raise exception 'Gudang % tidak ditemukan atau nonaktif.', coalesce(v_gudang_tujuan.kode, p_gudang_tujuan_id::text);
    end if;

    -- Check last mutasi dates
    select tanggal into v_last_tanggal_asal from public.mutasi_stok where produk_id = p_produk_id and gudang_id = p_gudang_asal_id order by tanggal desc, created_at desc limit 1;
    if v_last_tanggal_asal is not null and p_tanggal < v_last_tanggal_asal then
        raise exception 'Tanggal mutasi tidak boleh mendahului mutasi terakhir (%).', v_last_tanggal_asal;
    end if;

    select tanggal into v_last_tanggal_tujuan from public.mutasi_stok where produk_id = p_produk_id and gudang_id = p_gudang_tujuan_id order by tanggal desc, created_at desc limit 1;
    if v_last_tanggal_tujuan is not null and p_tanggal < v_last_tanggal_tujuan then
        raise exception 'Tanggal mutasi tidak boleh mendahului mutasi terakhir (%).', v_last_tanggal_tujuan;
    end if;

    -- Lock source warehouse row
    select * into v_saldo_asal from public.saldo_stok where produk_id = p_produk_id and gudang_id = p_gudang_asal_id for update;
    if not found or v_saldo_asal.qty < p_qty then
        raise exception 'Qty keluar % melebihi stok tersedia %.',
            trim(trailing '.' from trim(trailing '0' from to_char(p_qty, 'FM999999999999999990.9999'))),
            trim(trailing '.' from trim(trailing '0' from to_char(coalesce(v_saldo_asal.qty, 0), 'FM999999999999999990.9999')));
    end if;

    v_qty_out := p_qty;
    v_harga_asal := v_saldo_asal.harga_rata;
    if v_qty_out = v_saldo_asal.qty then
        v_nilai_out := v_saldo_asal.nilai;
        v_qty_asal_baru := 0;
        v_nilai_asal_baru := 0;
        v_harga_asal_baru := v_harga_asal;
    else
        v_nilai_out := round(v_qty_out * v_harga_asal, 2);
        v_qty_asal_baru := v_saldo_asal.qty - v_qty_out;
        v_nilai_asal_baru := v_saldo_asal.nilai - v_nilai_out;
        v_harga_asal_baru := v_harga_asal;
    end if;

    -- Update source saldo
    update public.saldo_stok set
        qty = v_qty_asal_baru,
        nilai = v_nilai_asal_baru,
        harga_rata = v_harga_asal_baru,
        updated_by = v_actor_id,
        updated_at = now()
    where produk_id = p_produk_id and gudang_id = p_gudang_asal_id;

    -- Insert source mutasi (TRANSFER_KELUAR)
    insert into public.mutasi_stok (
        produk_id, gudang_id, tanggal, tipe, qty, harga_satuan, nilai,
        sumber_tipe, sumber_id, alasan, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_asal_id, p_tanggal, 'TRANSFER_KELUAR', -v_qty_out, v_harga_asal, v_nilai_out,
        'TRANSFER', v_transfer_id, null, v_actor_id, v_actor_id
    ) returning id into v_mutasi_keluar_id;

    -- Lock target warehouse row
    select * into v_saldo_tujuan from public.saldo_stok where produk_id = p_produk_id and gudang_id = p_gudang_tujuan_id for update;
    if found then
        v_qty_tujuan_lama := v_saldo_tujuan.qty;
        v_nilai_tujuan_lama := v_saldo_tujuan.nilai;
        v_harga_tujuan_lama := v_saldo_tujuan.harga_rata;
    end if;

    v_qty_tujuan_baru := v_qty_tujuan_lama + v_qty_out;
    v_nilai_tujuan_baru := v_nilai_tujuan_lama + v_nilai_out;
    v_harga_tujuan_baru := round(v_nilai_tujuan_baru / v_qty_tujuan_baru, 4);

    -- Update or insert target saldo
    insert into public.saldo_stok (
        produk_id, gudang_id, qty, nilai, harga_rata, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_tujuan_id, v_qty_tujuan_baru, v_nilai_tujuan_baru, v_harga_tujuan_baru, v_actor_id, v_actor_id
    )
    on conflict (produk_id, gudang_id) do update set
        qty = excluded.qty,
        nilai = excluded.nilai,
        harga_rata = excluded.harga_rata,
        updated_by = excluded.updated_by,
        updated_at = now();

    -- Insert target mutasi (TRANSFER_MASUK)
    insert into public.mutasi_stok (
        produk_id, gudang_id, tanggal, tipe, qty, harga_satuan, nilai,
        sumber_tipe, sumber_id, alasan, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_tujuan_id, p_tanggal, 'TRANSFER_MASUK', v_qty_out, round(v_nilai_out / v_qty_out, 4), v_nilai_out,
        'TRANSFER', v_transfer_id, null, v_actor_id, v_actor_id
    ) returning id into v_mutasi_masuk_id;

    return jsonb_build_object(
        'transfer_id', v_transfer_id,
        'mutasi_keluar_id', v_mutasi_keluar_id,
        'mutasi_masuk_id', v_mutasi_masuk_id,
        'nilai_transfer', v_nilai_out,
        'saldo_asal', jsonb_build_object('qty', v_qty_asal_baru, 'nilai', v_nilai_asal_baru, 'harga_rata', v_harga_asal_baru),
        'saldo_tujuan', jsonb_build_object('qty', v_qty_tujuan_baru, 'nilai', v_nilai_tujuan_baru, 'harga_rata', v_harga_tujuan_baru)
    );
end;
$$;

create or replace function public.opname_stok(
    p_produk_id uuid,
    p_gudang_id uuid,
    p_qty_fisik numeric,
    p_alasan text,
    p_tanggal timestamptz default now(),
    p_sumber_id uuid default null,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer set search_path = pg_catalog, public
as $$
declare
    v_produk record;
    v_gudang record;
    v_saldo record;
    v_last_tanggal timestamptz;
    v_qty_lama numeric(18,4) := 0;
    v_nilai_lama numeric(18,2) := 0;
    v_harga_rata_lama numeric(18,4) := 0;
    v_selisih numeric(18,4);
    v_qty_baru numeric(18,4);
    v_nilai_baru numeric(18,2);
    v_harga_rata_baru numeric(18,4);
    v_mutasi_qty numeric(18,4);
    v_mutasi_harga numeric(18,4);
    v_mutasi_nilai numeric(18,2);
    v_mutasi_id uuid;
    v_opname_id uuid := coalesce(p_sumber_id, gen_random_uuid());
    v_actor_id uuid := coalesce(auth.uid(), p_actor_id);
begin
    if auth.role() = 'authenticated' and auth.uid() is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    if auth.uid() is not null then
        v_actor_id := auth.uid();
    end if;

    perform pg_advisory_xact_lock(hashtextextended(p_produk_id::text || ':' || p_gudang_id::text, 0));

    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Isi alasan penyesuaian stok.';
    end if;

    if p_qty_fisik is null or p_qty_fisik < 0 then
        raise exception 'Qty fisik tidak boleh negatif.';
    end if;

    select kode, aktif into v_produk from public.produk where id = p_produk_id;
    if not found or not v_produk.aktif then
        raise exception 'Produk % tidak ditemukan atau nonaktif.', coalesce(v_produk.kode, p_produk_id::text);
    end if;

    select kode, aktif into v_gudang from public.gudang where id = p_gudang_id;
    if not found or not v_gudang.aktif then
        raise exception 'Gudang % tidak ditemukan atau nonaktif.', coalesce(v_gudang.kode, p_gudang_id::text);
    end if;

    select tanggal into v_last_tanggal from public.mutasi_stok where produk_id = p_produk_id and gudang_id = p_gudang_id order by tanggal desc, created_at desc limit 1;
    if v_last_tanggal is not null and p_tanggal < v_last_tanggal then
        raise exception 'Tanggal mutasi tidak boleh mendahului mutasi terakhir (%).', v_last_tanggal;
    end if;

    select * into v_saldo from public.saldo_stok where produk_id = p_produk_id and gudang_id = p_gudang_id for update;
    if found then
        v_qty_lama := v_saldo.qty;
        v_nilai_lama := v_saldo.nilai;
        v_harga_rata_lama := v_saldo.harga_rata;
    end if;

    v_selisih := p_qty_fisik - v_qty_lama;
    if v_selisih = 0 then
        return jsonb_build_object(
            'opname_id', v_opname_id,
            'mutasi_id', null,
            'selisih', 0,
            'nilai_penyesuaian', 0,
            'saldo', jsonb_build_object('qty', v_qty_lama, 'nilai', v_nilai_lama, 'harga_rata', v_harga_rata_lama)
        );
    end if;

    if v_selisih > 0 then
        v_mutasi_qty := v_selisih;
        v_mutasi_harga := v_harga_rata_lama;
        v_mutasi_nilai := round(v_mutasi_qty * v_mutasi_harga, 2);
        v_qty_baru := v_qty_lama + v_mutasi_qty;
        v_nilai_baru := v_nilai_lama + v_mutasi_nilai;
        v_harga_rata_baru := round(v_nilai_baru / v_qty_baru, 4);
    else
        v_mutasi_qty := v_selisih;
        v_mutasi_harga := v_harga_rata_lama;
        if p_qty_fisik = 0 then
            v_mutasi_nilai := v_nilai_lama;
            v_qty_baru := 0;
            v_nilai_baru := 0;
            v_harga_rata_baru := v_harga_rata_lama;
        else
            v_mutasi_nilai := round(abs(v_mutasi_qty) * v_harga_rata_lama, 2);
            v_qty_baru := p_qty_fisik;
            v_nilai_baru := v_nilai_lama - v_mutasi_nilai;
            v_harga_rata_baru := v_harga_rata_lama;
        end if;
    end if;

    insert into public.saldo_stok (
        produk_id, gudang_id, qty, nilai, harga_rata, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_id, v_qty_baru, v_nilai_baru, v_harga_rata_baru, v_actor_id, v_actor_id
    )
    on conflict (produk_id, gudang_id) do update set
        qty = excluded.qty,
        nilai = excluded.nilai,
        harga_rata = excluded.harga_rata,
        updated_by = excluded.updated_by,
        updated_at = now();

    insert into public.mutasi_stok (
        produk_id, gudang_id, tanggal, tipe, qty, harga_satuan, nilai,
        sumber_tipe, sumber_id, alasan, created_by, updated_by
    ) values (
        p_produk_id, p_gudang_id, p_tanggal, 'PENYESUAIAN', v_mutasi_qty, v_mutasi_harga, v_mutasi_nilai,
        'OPNAME', v_opname_id, p_alasan, v_actor_id, v_actor_id
    ) returning id into v_mutasi_id;

    return jsonb_build_object(
        'opname_id', v_opname_id,
        'mutasi_id', v_mutasi_id,
        'selisih', v_selisih,
        'nilai_penyesuaian', v_mutasi_nilai,
        'saldo', jsonb_build_object('qty', v_qty_baru, 'nilai', v_nilai_baru, 'harga_rata', v_harga_rata_baru)
    );
end;
$$;

-- These SECURITY DEFINER entry points bypass table RLS. Until FND-003 defines
-- per-action authorization, only trusted server code holding service_role may call them.
revoke all on function public.catat_mutasi_stok(uuid, uuid, timestamptz, text, numeric, numeric, text, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.transfer_stok(uuid, uuid, uuid, numeric, timestamptz, uuid, uuid) from public, anon, authenticated;
revoke all on function public.opname_stok(uuid, uuid, numeric, text, timestamptz, uuid, uuid) from public, anon, authenticated;
grant execute on function public.catat_mutasi_stok(uuid, uuid, timestamptz, text, numeric, numeric, text, uuid, text, uuid) to service_role;
grant execute on function public.transfer_stok(uuid, uuid, uuid, numeric, timestamptz, uuid, uuid) to service_role;
grant execute on function public.opname_stok(uuid, uuid, numeric, text, timestamptz, uuid, uuid) to service_role;
