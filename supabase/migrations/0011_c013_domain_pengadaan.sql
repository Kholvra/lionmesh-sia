-- C-013: domain pengadaan — permintaan pembelian, purchase order, penerimaan, QC.
--
-- Tables and status rules live in core (D-05, ARCH-06); screens belong to
-- modules/pengeluaran. Stock enters only after QC lulus (D-36) through
-- catat_mutasi_stok, and the journal goes through post_journal (D-44 (1)).
-- Physical table names follow D-61: po, penerimaan.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.permintaan_pembelian (
    dokumen_id uuid primary key references public.dokumen (id),
    -- Nullable without a foreign key in this item; PR-002 adds the FK (PT-05).
    wo_id uuid,
    gudang_id uuid not null references public.gudang (id),
    pemasok_id uuid references public.pemasok (id),
    keterangan text,
    tanggal_butuh date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now()
);

create index idx_permintaan_pembelian_gudang on public.permintaan_pembelian (gudang_id);
create index idx_permintaan_pembelian_wo on public.permintaan_pembelian (wo_id)
where wo_id is not null;

create table public.permintaan_pembelian_item (
    id uuid primary key default gen_random_uuid(),
    permintaan_id uuid not null references public.permintaan_pembelian (dokumen_id),
    produk_id uuid not null references public.produk (id),
    satuan_id uuid not null references public.satuan (id),
    qty numeric(18,4) not null,
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_permintaan_item_urutan unique (permintaan_id, urutan),
    constraint ck_permintaan_item_qty check (qty > 0),
    constraint ck_permintaan_item_urutan check (urutan > 0)
);

create index idx_permintaan_item_permintaan on public.permintaan_pembelian_item (permintaan_id);

create table public.po (
    dokumen_id uuid primary key references public.dokumen (id),
    permintaan_id uuid not null unique references public.permintaan_pembelian (dokumen_id),
    pemasok_id uuid not null references public.pemasok (id),
    tanggal date not null,
    catatan_konfirmasi text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now()
);

create index idx_po_pemasok on public.po (pemasok_id);

create table public.po_item (
    id uuid primary key default gen_random_uuid(),
    po_id uuid not null references public.po (dokumen_id),
    produk_id uuid not null references public.produk (id),
    qty numeric(18,4) not null,
    harga_satuan numeric(18,4) not null,
    ppn_persen numeric(5,2) not null default 0,
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_po_item_urutan unique (po_id, urutan),
    constraint ck_po_item_qty check (qty > 0),
    constraint ck_po_item_harga check (harga_satuan >= 0),
    constraint ck_po_item_ppn check (ppn_persen between 0 and 100),
    constraint ck_po_item_urutan check (urutan > 0)
);

create index idx_po_item_po on public.po_item (po_id);

create table public.penerimaan (
    dokumen_id uuid primary key references public.dokumen (id),
    po_id uuid not null references public.po (dokumen_id),
    gudang_id uuid not null references public.gudang (id),
    jenis text not null,
    tanggal date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_penerimaan_jenis check (jenis in ('SEBAGIAN', 'PENUH'))
);

create index idx_penerimaan_po on public.penerimaan (po_id);

create table public.penerimaan_item (
    id uuid primary key default gen_random_uuid(),
    penerimaan_id uuid not null references public.penerimaan (dokumen_id),
    po_item_id uuid not null references public.po_item (id),
    qty_diterima numeric(18,4) not null,
    qty_lulus numeric(18,4),
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_penerimaan_item unique (penerimaan_id, po_item_id),
    constraint ck_penerimaan_item_qty check (qty_diterima > 0),
    constraint ck_penerimaan_item_lulus check (
        qty_lulus is null or (qty_lulus >= 0 and qty_lulus <= qty_diterima)
    )
);

create index idx_penerimaan_item_po_item on public.penerimaan_item (po_item_id);

-- Quantity exceptions are recorded even when the receipt itself is rejected
-- (D-49, AC-05), so the row never carries a foreign key to a missing receipt.
create table public.pengadaan_exception (
    id uuid primary key default gen_random_uuid(),
    tipe text not null,
    po_id uuid not null references public.po (dokumen_id),
    po_item_id uuid references public.po_item (id),
    penerimaan_id uuid references public.penerimaan (dokumen_id),
    qty_po numeric(18,4) not null,
    qty_diterima numeric(18,4) not null,
    selisih numeric(18,4) not null,
    alasan text,
    status text not null default 'TERBUKA',
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_pengadaan_exception_tipe check (tipe in ('SELISIH_QTY', 'KELEBIHAN_QTY')),
    constraint ck_pengadaan_exception_status check (status in ('TERBUKA', 'DITUTUP')),
    constraint ck_pengadaan_exception_selisih check (selisih > 0)
);

create index idx_pengadaan_exception_po on public.pengadaan_exception (po_id, status);

-- ---------------------------------------------------------------------------
-- Document types, status lists, and journal source
-- ---------------------------------------------------------------------------

insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values
    ('PURCHASE_ORDER', 'Purchase order', 'DITERBITKAN', false, null),
    ('PENERIMAAN_BARANG', 'Penerimaan barang', 'DITERIMA', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('PURCHASE_ORDER', 'DITERBITKAN', 1),
    ('PURCHASE_ORDER', 'DITERIMA_SEBAGIAN', 2),
    ('PURCHASE_ORDER', 'DITERIMA', 3),
    ('PURCHASE_ORDER', 'DIBATALKAN', 4),
    ('PENERIMAAN_BARANG', 'DITERIMA', 1),
    ('PENERIMAAN_BARANG', 'QC_LULUS', 2),
    ('PENERIMAAN_BARANG', 'QC_GAGAL', 3),
    ('PENERIMAAN_BARANG', 'DIBATALKAN', 4)
on conflict (tipe, status) do nothing;

-- QC lulus is the source of the Dr persediaan_bahan / Cr gr_ir journal (D-44 (1)).
insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('PENERIMAAN_BARANG', 'Penerimaan barang (QC lulus)', array['QC'])
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------------
-- Guards: documents are cancelled, never deleted (D-50, INV-03)
-- ---------------------------------------------------------------------------

create or replace function public.trg_pengadaan_no_delete()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    raise exception 'Dokumen pengadaan tidak bisa dihapus. Gunakan pembatalan.';
end;
$$;

create trigger trg_permintaan_pembelian_no_delete
before delete on public.permintaan_pembelian
for each row execute function public.trg_pengadaan_no_delete();

create trigger trg_permintaan_item_no_delete
before delete on public.permintaan_pembelian_item
for each row execute function public.trg_pengadaan_no_delete();

create trigger trg_po_no_delete
before delete on public.po
for each row execute function public.trg_pengadaan_no_delete();

create trigger trg_po_item_no_delete
before delete on public.po_item
for each row execute function public.trg_pengadaan_no_delete();

create trigger trg_penerimaan_no_delete
before delete on public.penerimaan
for each row execute function public.trg_pengadaan_no_delete();

create trigger trg_penerimaan_item_no_delete
before delete on public.penerimaan_item
for each row execute function public.trg_pengadaan_no_delete();

create or replace function public.trg_permintaan_identity_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if new.dokumen_id <> old.dokumen_id
        or new.wo_id is distinct from old.wo_id
        or new.gudang_id <> old.gudang_id
        or new.tanggal_butuh <> old.tanggal_butuh then
        raise exception 'Identitas permintaan pembelian tidak bisa diubah.';
    end if;
    return new;
end;
$$;

create trigger trg_permintaan_identity_immutable
before update on public.permintaan_pembelian
for each row execute function public.trg_permintaan_identity_immutable();

create or replace function public.trg_po_identity_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if new.dokumen_id <> old.dokumen_id
        or new.permintaan_id <> old.permintaan_id
        or new.pemasok_id <> old.pemasok_id
        or new.tanggal <> old.tanggal then
        raise exception 'Identitas purchase order tidak bisa diubah.';
    end if;
    return new;
end;
$$;

create trigger trg_po_identity_immutable
before update on public.po
for each row execute function public.trg_po_identity_immutable();

-- A recorded receipt cannot be edited; QC may fill qty_lulus exactly once.
create or replace function public.trg_penerimaan_item_immutable()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if new.penerimaan_id <> old.penerimaan_id
        or new.po_item_id <> old.po_item_id
        or new.qty_diterima <> old.qty_diterima then
        raise exception 'Penerimaan yang sudah tercatat tidak bisa diubah.';
    end if;

    if old.qty_lulus is not null and new.qty_lulus is distinct from old.qty_lulus then
        raise exception 'Hasil QC yang sudah tercatat tidak bisa diubah.';
    end if;

    return new;
end;
$$;

create trigger trg_penerimaan_item_immutable
before update on public.penerimaan_item
for each row execute function public.trg_penerimaan_item_immutable();

-- ---------------------------------------------------------------------------
-- Role gate (D-33, D-42)
-- ---------------------------------------------------------------------------

create or replace function public.pengadaan_aktor(p_aktor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := coalesce(auth.uid(), p_aktor_id);
begin
    if v_aktor is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    if not exists (
        select 1
        from public.profiles
        where id = v_aktor
          and aktif = true
          and peran is not null
          and peran <> 'Karyawan'
    ) then
        raise exception 'Sesi pengguna tidak valid.';
    end if;

    return v_aktor;
end;
$$;

create or replace function public.pengadaan_assert_peran(p_aktor_id uuid, p_peran text[])
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_aktor(p_aktor_id);
    v_peran text;
begin
    select peran into v_peran
    from public.profiles
    where id = v_aktor and aktif = true;

    if v_peran is null or not (v_peran = any (p_peran)) then
        raise exception 'Peran Anda tidak berwenang melakukan tindakan ini.'
            using errcode = '42501';
    end if;

    return v_aktor;
end;
$$;

-- ---------------------------------------------------------------------------
-- PR: ajukan, periksa, tetapkan pemasok, batalkan
-- ---------------------------------------------------------------------------

create or replace function public.ajukan_pr(
    p_aktor_id uuid,
    p_gudang_id uuid,
    p_tanggal_butuh date,
    p_baris jsonb,
    p_keterangan text default null,
    p_wo_id uuid default null,
    p_tanggal date default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Gudang', 'Produksi']);
    v_hasil jsonb;
    v_dokumen_id uuid;
    v_i integer := 0;
    v_elem jsonb;
    v_qty numeric(18,4);
begin
    if p_gudang_id is null then
        raise exception 'Gudang tujuan wajib diisi.';
    end if;

    if not exists (select 1 from public.gudang where id = p_gudang_id and aktif = true) then
        raise exception 'Gudang tujuan tidak ditemukan atau nonaktif.';
    end if;

    if p_tanggal_butuh is null then
        raise exception 'Tanggal butuh wajib diisi.';
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Permintaan harus memuat minimal satu barang.';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        if coalesce(v_elem->>'qty', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Qty baris % harus lebih dari 0 dan maksimal 4 angka desimal.', v_i;
        end if;

        v_qty := (v_elem->>'qty')::numeric(18,4);
        if v_qty <= 0 then
            raise exception 'Qty baris % harus lebih dari 0 dan maksimal 4 angka desimal.', v_i;
        end if;

        if not exists (
            select 1 from public.produk
            where id = (v_elem->>'produk_id')::uuid and aktif = true
        ) then
            raise exception 'Produk baris % tidak ditemukan atau nonaktif.', v_i;
        end if;

        if not exists (
            select 1 from public.satuan
            where id = (v_elem->>'satuan_id')::uuid and aktif = true
        ) then
            raise exception 'Satuan baris % tidak ditemukan atau nonaktif.', v_i;
        end if;
    end loop;

    v_hasil := public.buat_dokumen(
        'PERMINTAAN_PEMBELIAN', v_aktor, null, p_tanggal
    );
    v_dokumen_id := (v_hasil->'dokumen'->>'id')::uuid;

    insert into public.permintaan_pembelian (
        dokumen_id, wo_id, gudang_id, keterangan, tanggal_butuh, created_by, updated_by
    ) values (
        v_dokumen_id,
        p_wo_id,
        p_gudang_id,
        nullif(btrim(p_keterangan), ''),
        p_tanggal_butuh,
        v_aktor,
        v_aktor
    );

    v_i := 0;
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;
        insert into public.permintaan_pembelian_item (
            permintaan_id, produk_id, satuan_id, qty, urutan, created_by, updated_by
        ) values (
            v_dokumen_id,
            (v_elem->>'produk_id')::uuid,
            (v_elem->>'satuan_id')::uuid,
            (v_elem->>'qty')::numeric(18,4),
            v_i,
            v_aktor,
            v_aktor
        );
    end loop;

    return v_hasil || jsonb_build_object('permintaan_id', v_dokumen_id);
end;
$$;

create or replace function public.periksa_pr(
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
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Purchasing']);
begin
    if not exists (select 1 from public.permintaan_pembelian where dokumen_id = p_dokumen_id) then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    return public.periksa_dokumen(p_dokumen_id, p_versi, v_aktor, p_alasan);
end;
$$;

create or replace function public.tetapkan_pemasok_pr(
    p_dokumen_id uuid,
    p_versi bigint,
    p_pemasok_id uuid,
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
    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if not exists (select 1 from public.permintaan_pembelian where dokumen_id = p_dokumen_id) then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if v_dokumen.status <> 'DISETUJUI' then
        raise exception 'Pemasok hanya bisa ditetapkan setelah PR disetujui. Status PR saat ini: %.', v_dokumen.status;
    end if;

    if not exists (select 1 from public.pemasok where id = p_pemasok_id and aktif = true) then
        raise exception 'Pemasok tidak ditemukan atau nonaktif.';
    end if;

    update public.permintaan_pembelian
    set pemasok_id = p_pemasok_id,
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    return public.pindah_status_dokumen(
        p_dokumen_id, p_versi, 'PEMASOK_DITETAPKAN', 'PILIH_PEMASOK', v_aktor, null
    );
end;
$$;

create or replace function public.batalkan_pr(
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
    v_aktor uuid := public.pengadaan_aktor(p_aktor_id);
    v_pembuat uuid;
begin
    select pembuat_id into v_pembuat from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if v_pembuat <> v_aktor then
        raise exception 'Hanya pemohon yang dapat membatalkan permintaan ini.';
    end if;

    if exists (select 1 from public.po where permintaan_id = p_dokumen_id) then
        raise exception 'Permintaan sudah menjadi PO. Batalkan PO lebih dulu.';
    end if;

    return public.batalkan_dokumen(p_dokumen_id, p_versi, v_aktor, p_alasan);
end;
$$;

-- ---------------------------------------------------------------------------
-- PO: terbitkan dari PR yang disetujui, batalkan sebelum penerimaan
-- ---------------------------------------------------------------------------

create or replace function public.buat_po(
    p_dokumen_id uuid,
    p_versi bigint,
    p_pemasok_id uuid,
    p_baris jsonb,
    p_tanggal date default null,
    p_aktor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Purchasing']);
    v_dokumen public.dokumen;
    v_pr public.permintaan_pembelian;
    v_hasil jsonb;
    v_po_id uuid;
    v_i integer := 0;
    v_elem jsonb;
    v_qty numeric(18,4);
    v_harga numeric(18,4);
    v_ppn numeric(5,2);
    v_total numeric(18,2) := 0;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if not found then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    select * into v_pr from public.permintaan_pembelian where dokumen_id = p_dokumen_id;
    if not found then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;

    if v_dokumen.status = 'DITOLAK' then
        raise exception 'Permintaan pembelian berstatus DITOLAK tidak bisa dijadikan PO.';
    end if;

    if v_dokumen.status = 'DIBATALKAN' then
        raise exception 'Permintaan pembelian berstatus DIBATALKAN tidak bisa dijadikan PO.';
    end if;

    if v_dokumen.status not in ('DISETUJUI', 'PEMASOK_DITETAPKAN') then
        raise exception 'PO hanya bisa dibuat dari PR berstatus DISETUJUI. Status PR saat ini: %.', v_dokumen.status;
    end if;

    if exists (select 1 from public.po where permintaan_id = p_dokumen_id) then
        raise exception 'Permintaan ini sudah punya PO.';
    end if;

    if not exists (select 1 from public.pemasok where id = p_pemasok_id and aktif = true) then
        raise exception 'Pemasok tidak ditemukan atau nonaktif.';
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'PO harus memuat minimal satu barang.';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        if coalesce(v_elem->>'qty', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$'
            or (v_elem->>'qty')::numeric <= 0 then
            raise exception 'Qty baris % harus lebih dari 0 dan maksimal 4 angka desimal.', v_i;
        end if;

        if coalesce(v_elem->>'harga_satuan', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Harga satuan baris % tidak boleh negatif.', v_i;
        end if;

        v_ppn := coalesce(nullif(v_elem->>'ppn_persen', '')::numeric, 0);
        if v_ppn < 0 or v_ppn > 100 then
            raise exception 'PPN baris % harus antara 0 dan 100.', v_i;
        end if;

        if not exists (
            select 1 from public.produk
            where id = (v_elem->>'produk_id')::uuid and aktif = true
        ) then
            raise exception 'Produk baris % tidak ditemukan atau nonaktif.', v_i;
        end if;

        v_qty := (v_elem->>'qty')::numeric(18,4);
        v_harga := (v_elem->>'harga_satuan')::numeric(18,4);
        v_total := v_total + round(v_qty * v_harga * (1 + v_ppn / 100), 2);
    end loop;

    if v_dokumen.status = 'DISETUJUI' then
        perform public.pindah_status_dokumen(
            p_dokumen_id, p_versi, 'PEMASOK_DITETAPKAN', 'PILIH_PEMASOK', v_aktor, null
        );
    end if;

    update public.permintaan_pembelian
    set pemasok_id = p_pemasok_id,
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    v_hasil := public.buat_dokumen('PURCHASE_ORDER', v_aktor, v_total, p_tanggal);
    v_po_id := (v_hasil->'dokumen'->>'id')::uuid;

    insert into public.po (
        dokumen_id, permintaan_id, pemasok_id, tanggal, created_by, updated_by
    ) values (
        v_po_id,
        p_dokumen_id,
        p_pemasok_id,
        coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date),
        v_aktor,
        v_aktor
    );

    v_i := 0;
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;
        insert into public.po_item (
            po_id, produk_id, qty, harga_satuan, ppn_persen, urutan, created_by, updated_by
        ) values (
            v_po_id,
            (v_elem->>'produk_id')::uuid,
            (v_elem->>'qty')::numeric(18,4),
            (v_elem->>'harga_satuan')::numeric(18,4),
            coalesce(nullif(v_elem->>'ppn_persen', '')::numeric, 0),
            v_i,
            v_aktor,
            v_aktor
        );
    end loop;

    return v_hasil || jsonb_build_object('po_id', v_po_id);
end;
$$;

create or replace function public.batalkan_po(
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
    v_aktor uuid := public.pengadaan_aktor(p_aktor_id);
    v_peran text;
    v_pr_pembuat uuid;
begin
    select peran into v_peran
    from public.profiles
    where id = v_aktor and aktif = true;

    select d.pembuat_id into v_pr_pembuat
    from public.po p
    join public.dokumen d on d.id = p.permintaan_id
    where p.dokumen_id = p_dokumen_id;

    if not found then
        raise exception 'Purchase order tidak ditemukan.';
    end if;

    if v_peran is distinct from 'Purchasing' and v_pr_pembuat <> v_aktor then
        raise exception 'Hanya Purchasing atau pemohon PR yang dapat membatalkan PO ini.';
    end if;

    if exists (select 1 from public.penerimaan where po_id = p_dokumen_id) then
        raise exception 'PO sudah ada penerimaan dan tidak bisa dibatalkan. Koreksi lewat jurnal pembalik.';
    end if;

    return public.batalkan_dokumen(p_dokumen_id, p_versi, v_aktor, p_alasan);
end;
$$;

-- ---------------------------------------------------------------------------
-- Penerimaan: quantity check, over-receipt exception, partial receipts
-- ---------------------------------------------------------------------------

create or replace function public.catat_penerimaan(
    p_dokumen_id uuid,
    p_versi bigint,
    p_gudang_id uuid,
    p_jenis text,
    p_baris jsonb,
    p_tanggal date default null,
    p_aktor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Gudang']);
    v_po public.po;
    v_dokumen public.dokumen;
    v_i integer := 0;
    v_elem jsonb;
    v_qty numeric(18,4);
    v_qty_po numeric(18,4);
    v_sudah numeric(18,4);
    v_sisa numeric(18,4);
    v_tolak boolean := false;
    v_pesan text := '';
    v_exception_ids jsonb := '[]'::jsonb;
    v_exception_id uuid;
    v_hasil jsonb;
    v_penerimaan_id uuid;
    v_status_po text;
    v_semua_penuh boolean;
    v_tanggal date := coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date);
begin
    if p_jenis is null or p_jenis not in ('SEBAGIAN', 'PENUH') then
        raise exception 'Jenis penerimaan harus SEBAGIAN atau PENUH.';
    end if;

    -- Lock the PO row so two receivers cannot both pass the remaining-qty check.
    select * into v_po from public.po where dokumen_id = p_dokumen_id for update;
    if not found then
        raise exception 'Purchase order tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;

    if v_dokumen.status = 'DIBATALKAN' then
        raise exception 'PO berstatus DIBATALKAN tidak bisa menerima barang.';
    end if;

    if v_dokumen.status = 'DITERIMA' then
        raise exception 'PO sudah diterima penuh dan tidak bisa menerima barang lagi.';
    end if;

    if v_dokumen.status not in ('DITERBITKAN', 'DITERIMA_SEBAGIAN') then
        raise exception 'PO berstatus % belum bisa menerima barang.', v_dokumen.status;
    end if;

    if not exists (select 1 from public.gudang where id = p_gudang_id and aktif = true) then
        raise exception 'Gudang tujuan tidak ditemukan atau nonaktif.';
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Penerimaan harus memuat minimal satu baris.';
    end if;

    drop table if exists pg_temp.c013_penerimaan_baris;
    create temporary table pg_temp.c013_penerimaan_baris (
        po_item_id uuid primary key,
        qty numeric(18,4) not null,
        qty_po numeric(18,4) not null,
        sisa numeric(18,4) not null
    ) on commit drop;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        if coalesce(v_elem->>'qty_diterima', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$'
            or (v_elem->>'qty_diterima')::numeric <= 0 then
            raise exception 'Qty diterima baris % harus lebih dari 0 dan maksimal 4 angka desimal.', v_i;
        end if;

        v_qty := (v_elem->>'qty_diterima')::numeric(18,4);

        select i.qty into v_qty_po
        from public.po_item i
        where i.id = (v_elem->>'po_item_id')::uuid and i.po_id = p_dokumen_id;

        if not found then
            raise exception 'Baris penerimaan % bukan milik PO ini.', v_i;
        end if;

        select coalesce(sum(qi.qty_diterima), 0) into v_sudah
        from public.penerimaan_item qi
        join public.dokumen d on d.id = qi.penerimaan_id
        where qi.po_item_id = (v_elem->>'po_item_id')::uuid
          and d.status <> 'DIBATALKAN';

        v_sisa := v_qty_po - v_sudah;

        if v_qty > v_sisa then
            insert into public.pengadaan_exception (
                tipe, po_id, po_item_id, qty_po, qty_diterima, selisih,
                alasan, created_by, updated_by
            ) values (
                'KELEBIHAN_QTY', p_dokumen_id, (v_elem->>'po_item_id')::uuid,
                v_qty_po, v_qty, v_qty - v_sisa,
                'Penerimaan melebihi sisa PO', v_aktor, v_aktor
            ) returning id into v_exception_id;

            v_exception_ids := v_exception_ids || to_jsonb(v_exception_id);
            v_tolak := true;
            v_pesan := v_pesan
                || case when v_pesan = '' then '' else ' ' end
                || format('Qty penerimaan baris %s (%s) melebihi sisa PO (%s).', v_i, v_qty, v_sisa);
        else
            insert into pg_temp.c013_penerimaan_baris (po_item_id, qty, qty_po, sisa)
            values ((v_elem->>'po_item_id')::uuid, v_qty, v_qty_po, v_sisa);
        end if;
    end loop;

    if v_tolak then
        return jsonb_build_object(
            'diterima', false,
            'pesan', v_pesan,
            'exception_ids', v_exception_ids
        );
    end if;

    v_hasil := public.buat_dokumen('PENERIMAAN_BARANG', v_aktor, null, v_tanggal);
    v_penerimaan_id := (v_hasil->'dokumen'->>'id')::uuid;

    insert into public.penerimaan (
        dokumen_id, po_id, gudang_id, jenis, tanggal, created_by, updated_by
    ) values (
        v_penerimaan_id, p_dokumen_id, p_gudang_id, p_jenis, v_tanggal, v_aktor, v_aktor
    );

    insert into public.penerimaan_item (
        penerimaan_id, po_item_id, qty_diterima, created_by, updated_by
    )
    select v_penerimaan_id, b.po_item_id, b.qty, v_aktor, v_aktor
    from pg_temp.c013_penerimaan_baris b;

    -- Short delivery is always an exception; quantity never passes a tolerance (D-15).
    insert into public.pengadaan_exception (
        tipe, po_id, po_item_id, penerimaan_id, qty_po, qty_diterima, selisih,
        alasan, created_by, updated_by
    )
    select
        'SELISIH_QTY', p_dokumen_id, b.po_item_id, v_penerimaan_id,
        b.qty_po, b.qty, b.sisa - b.qty,
        'Qty diterima kurang dari sisa PO', v_aktor, v_aktor
    from pg_temp.c013_penerimaan_baris b
    where b.qty < b.sisa;

    select bool_and(coalesce(s.diterima, 0) >= i.qty) into v_semua_penuh
    from public.po_item i
    left join (
        select qi.po_item_id, sum(qi.qty_diterima) as diterima
        from public.penerimaan_item qi
        join public.dokumen d on d.id = qi.penerimaan_id
        where d.status <> 'DIBATALKAN'
          and qi.penerimaan_id in (
              select p.dokumen_id from public.penerimaan p where p.po_id = p_dokumen_id
          )
        group by qi.po_item_id
    ) s on s.po_item_id = i.id
    where i.po_id = p_dokumen_id;

    v_status_po := case
        when p_jenis = 'PENUH' or coalesce(v_semua_penuh, false) then 'DITERIMA'
        else 'DITERIMA_SEBAGIAN'
    end;

    if v_status_po = 'DITERIMA' or v_dokumen.status = 'DITERBITKAN' then
        perform public.pindah_status_dokumen(
            p_dokumen_id, p_versi, v_status_po, 'TERIMA', v_aktor, null
        );
    else
        v_status_po := v_dokumen.status;
    end if;

    return v_hasil || jsonb_build_object(
        'diterima', true,
        'penerimaan_id', v_penerimaan_id,
        'status_po', v_status_po
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- QC: stock and journal only after lulus (D-36, D-44 (1))
-- ---------------------------------------------------------------------------

create or replace function public.catat_qc_penerimaan(
    p_dokumen_id uuid,
    p_versi bigint,
    p_baris jsonb,
    p_tanggal timestamptz default null,
    p_aktor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['QC']);
    v_penerimaan public.penerimaan;
    v_dokumen public.dokumen;
    v_i integer := 0;
    v_elem jsonb;
    v_lulus numeric(18,4);
    v_qty_diterima numeric(18,4);
    v_jumlah_item integer;
    v_jumlah_baris integer;
    v_total_lulus numeric(18,4) := 0;
    v_total_nilai numeric(18,2) := 0;
    v_item record;
    v_status text;
    v_jurnal_id uuid;
    v_jurnal jsonb;
    v_hasil jsonb;
    v_tanggal timestamptz := coalesce(p_tanggal, now());
begin
    select * into v_penerimaan from public.penerimaan where dokumen_id = p_dokumen_id for update;
    if not found then
        raise exception 'Penerimaan tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;

    if v_dokumen.status <> 'DITERIMA' then
        raise exception 'QC hanya bisa dicatat pada penerimaan berstatus DITERIMA. Status saat ini: %.', v_dokumen.status;
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'QC harus memuat minimal satu baris.';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        if coalesce(v_elem->>'qty_lulus', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Qty lulus baris % tidak boleh negatif dan maksimal 4 angka desimal.', v_i;
        end if;

        v_lulus := (v_elem->>'qty_lulus')::numeric(18,4);

        select qi.qty_diterima into v_qty_diterima
        from public.penerimaan_item qi
        where qi.id = (v_elem->>'penerimaan_item_id')::uuid
          and qi.penerimaan_id = p_dokumen_id
        for update;

        if not found then
            raise exception 'Baris QC % bukan milik penerimaan ini.', v_i;
        end if;

        if v_lulus > v_qty_diterima then
            raise exception 'Qty lulus baris % melebihi qty diterima (%).', v_i, v_qty_diterima;
        end if;
    end loop;

    select count(*) into v_jumlah_item
    from public.penerimaan_item
    where penerimaan_id = p_dokumen_id;

    select count(distinct (baris_qc->>'penerimaan_item_id')::uuid) into v_jumlah_baris
    from jsonb_array_elements(p_baris) baris_qc;

    if v_jumlah_baris <> v_jumlah_item
        or jsonb_array_length(p_baris) <> v_jumlah_item then
        raise exception 'QC harus mencatat hasil untuk semua baris penerimaan.';
    end if;

    v_i := 0;
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;
        update public.penerimaan_item
        set qty_lulus = (v_elem->>'qty_lulus')::numeric(18,4),
            updated_by = v_aktor,
            updated_at = now()
        where id = (v_elem->>'penerimaan_item_id')::uuid
          and penerimaan_id = p_dokumen_id;

        v_total_lulus := v_total_lulus + (v_elem->>'qty_lulus')::numeric(18,4);
    end loop;

    v_status := case when v_total_lulus > 0 then 'QC_LULUS' else 'QC_GAGAL' end;

    if v_total_lulus > 0 then
        for v_item in
            select
                qi.id,
                qi.qty_lulus,
                pi.produk_id,
                pi.harga_satuan
            from public.penerimaan_item qi
            join public.po_item pi on pi.id = qi.po_item_id
            where qi.penerimaan_id = p_dokumen_id
              and coalesce(qi.qty_lulus, 0) > 0
            order by qi.id
        loop
            perform public.catat_mutasi_stok(
                v_item.produk_id,
                v_penerimaan.gudang_id,
                v_tanggal,
                'MASUK',
                v_item.qty_lulus,
                v_item.harga_satuan,
                'PENERIMAAN_BARANG',
                p_dokumen_id,
                null,
                v_aktor
            );

            v_total_nilai := v_total_nilai + round(v_item.qty_lulus * v_item.harga_satuan, 2);
        end loop;

        if v_total_nilai > 0 then
            v_jurnal := public.post_journal(
                v_tanggal,
                'PENERIMAAN_BARANG',
                p_dokumen_id,
                v_dokumen.nomor,
                'QC_LULUS',
                jsonb_build_array(
                    jsonb_build_object(
                        'akun_peran', 'persediaan_bahan',
                        'debit', v_total_nilai::text,
                        'kredit', '0'
                    ),
                    jsonb_build_object(
                        'akun_peran', 'gr_ir',
                        'debit', '0',
                        'kredit', v_total_nilai::text
                    )
                ),
                'IDR',
                v_aktor,
                null
            );
            v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;
        end if;
    end if;

    v_hasil := public.pindah_status_dokumen(
        p_dokumen_id, p_versi, v_status, 'QC', v_aktor, null
    );

    return v_hasil || jsonb_build_object(
        'status', v_status,
        'total_nilai', v_total_nilai::text,
        'jurnal_id', v_jurnal_id
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.permintaan_pembelian enable row level security;
alter table public.permintaan_pembelian_item enable row level security;
alter table public.po enable row level security;
alter table public.po_item enable row level security;
alter table public.penerimaan enable row level security;
alter table public.penerimaan_item enable row level security;
alter table public.pengadaan_exception enable row level security;

revoke all on public.permintaan_pembelian from anon, authenticated;
revoke all on public.permintaan_pembelian_item from anon, authenticated;
revoke all on public.po from anon, authenticated;
revoke all on public.po_item from anon, authenticated;
revoke all on public.penerimaan from anon, authenticated;
revoke all on public.penerimaan_item from anon, authenticated;
revoke all on public.pengadaan_exception from anon, authenticated;

grant select on public.permintaan_pembelian to authenticated;
grant select on public.permintaan_pembelian_item to authenticated;
grant select on public.po to authenticated;
grant select on public.po_item to authenticated;
grant select on public.penerimaan to authenticated;
grant select on public.penerimaan_item to authenticated;
grant select on public.pengadaan_exception to authenticated;

grant all on public.permintaan_pembelian to service_role;
grant all on public.permintaan_pembelian_item to service_role;
grant all on public.po to service_role;
grant all on public.po_item to service_role;
grant all on public.penerimaan to service_role;
grant all on public.penerimaan_item to service_role;
grant all on public.pengadaan_exception to service_role;

create policy "Staf aktif boleh baca permintaan pembelian"
on public.permintaan_pembelian for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca baris permintaan pembelian"
on public.permintaan_pembelian_item for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca purchase order"
on public.po for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca baris purchase order"
on public.po_item for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca penerimaan"
on public.penerimaan for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca baris penerimaan"
on public.penerimaan_item for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca exception pengadaan"
on public.pengadaan_exception for select to authenticated
using (public.is_active_staff());

-- SECURITY DEFINER entry points bypass table RLS; only trusted server code holds
-- the service role key. Actor identity is resolved inside the function.
revoke all on function public.pengadaan_aktor(uuid) from public, anon, authenticated, service_role;
revoke all on function public.pengadaan_assert_peran(uuid, text[]) from public, anon, authenticated, service_role;
revoke all on function public.ajukan_pr(uuid, uuid, date, jsonb, text, uuid, date) from public, anon, authenticated;
revoke all on function public.periksa_pr(uuid, bigint, uuid, text) from public, anon, authenticated;
revoke all on function public.tetapkan_pemasok_pr(uuid, bigint, uuid, uuid) from public, anon, authenticated;
revoke all on function public.batalkan_pr(uuid, bigint, text, uuid) from public, anon, authenticated;
revoke all on function public.buat_po(uuid, bigint, uuid, jsonb, date, uuid) from public, anon, authenticated;
revoke all on function public.batalkan_po(uuid, bigint, text, uuid) from public, anon, authenticated;
revoke all on function public.catat_penerimaan(uuid, bigint, uuid, text, jsonb, date, uuid) from public, anon, authenticated;
revoke all on function public.catat_qc_penerimaan(uuid, bigint, jsonb, timestamptz, uuid) from public, anon, authenticated;

grant execute on function public.ajukan_pr(uuid, uuid, date, jsonb, text, uuid, date) to service_role;
grant execute on function public.periksa_pr(uuid, bigint, uuid, text) to service_role;
grant execute on function public.tetapkan_pemasok_pr(uuid, bigint, uuid, uuid) to service_role;
grant execute on function public.batalkan_pr(uuid, bigint, text, uuid) to service_role;
grant execute on function public.buat_po(uuid, bigint, uuid, jsonb, date, uuid) to service_role;
grant execute on function public.batalkan_po(uuid, bigint, text, uuid) to service_role;
grant execute on function public.catat_penerimaan(uuid, bigint, uuid, text, jsonb, date, uuid) to service_role;
grant execute on function public.catat_qc_penerimaan(uuid, bigint, jsonb, timestamptz, uuid) to service_role;
