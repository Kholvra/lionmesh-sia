-- PG-005: purchase order dari permintaan yang pemasoknya sudah ditetapkan.
--
-- Nomor, status, dan riwayat tetap milik FND-004/C-013. Migrasi ini menambah
-- master tarif PPN berversi, penerbitan PO (termasuk harga pembanding PG-004),
-- pembatalan PO beserta permintaannya, dan catatan konfirmasi pemasok.

-- ---------------------------------------------------------------------------
-- Konfigurasi pajak (D-17, D-51(a))
-- ---------------------------------------------------------------------------

create table public.konfigurasi_pajak (
    id uuid primary key default gen_random_uuid(),
    nama text not null,
    ppn_persen numeric(5,2) not null,
    berlaku_mulai date not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_konfigurasi_pajak_ppn check (ppn_persen between 0 and 100),
    constraint ck_konfigurasi_pajak_nama_not_blank check (length(btrim(nama)) > 0)
);

create unique index uq_konfigurasi_pajak_mulai
on public.konfigurasi_pajak (berlaku_mulai);

create index idx_konfigurasi_pajak_aktif
on public.konfigurasi_pajak (aktif, berlaku_mulai desc);

-- Tarif yang berlaku pada sebuah tanggal. Null berarti belum ada data, dan
-- pemanggil wajib menolak dokumen.
create or replace function public.tarif_ppn_untuk(p_tanggal date)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select k.ppn_persen
    from public.konfigurasi_pajak k
    where k.aktif
      and k.berlaku_mulai <= coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date)
    order by k.berlaku_mulai desc
    limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Penerbitan PO
-- ---------------------------------------------------------------------------

create or replace function public.terbitkan_po(
    p_dokumen_id uuid,
    p_versi bigint,
    p_baris jsonb,
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
    v_pr public.permintaan_pembelian;
    v_tanggal date := coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date);
    v_ppn numeric(5,2);
    v_baris_po jsonb := '[]'::jsonb;
    v_elem jsonb;
    v_i integer := 0;
    v_item_id uuid;
    v_produk_id uuid;
    v_qty numeric(18,4);
    v_harga numeric(18,4);
    v_harga_pembanding numeric(18,2);
    v_hasil jsonb;
    v_po_id uuid;
    v_versi_pr bigint;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
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
        raise exception 'Permintaan yang ditolak tidak bisa dijadikan PO';
    end if;

    if v_dokumen.status = 'DIBATALKAN' then
        raise exception 'Permintaan yang dibatalkan tidak bisa dijadikan PO';
    end if;

    if v_dokumen.status <> 'PEMASOK_DITETAPKAN' or v_pr.pemasok_id is null then
        raise exception 'Pilih pemasok sebelum menerbitkan PO';
    end if;

    if exists (select 1 from public.po where permintaan_id = p_dokumen_id) then
        raise exception 'Permintaan ini sudah punya PO';
    end if;

    v_ppn := public.tarif_ppn_untuk(v_tanggal);
    if v_ppn is null then
        raise exception 'Tarif PPN untuk tanggal ini belum tersedia';
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'PO harus memuat minimal satu barang';
    end if;

    -- Each line must point at a request item and carry the quote price that
    -- PG-004 recorded for the assigned supplier.
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        v_item_id := nullif(v_elem->>'item_id', '')::uuid;
        select it.produk_id into v_produk_id
        from public.permintaan_pembelian_item it
        where it.id = v_item_id and it.permintaan_id = p_dokumen_id;
        if not found then
            raise exception 'Barang baris % bukan bagian dari permintaan ini', v_i;
        end if;

        if coalesce(v_elem->>'qty', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Qty baris % harus lebih dari 0', v_i;
        end if;
        v_qty := (v_elem->>'qty')::numeric(18,4);
        if v_qty <= 0 then
            raise exception 'Qty baris % harus lebih dari 0', v_i;
        end if;

        select ph.harga into v_harga_pembanding
        from public.penawaran_harga ph
        where ph.item_id = v_item_id and ph.pemasok_id = v_pr.pemasok_id
        order by ph.tanggal desc, ph.created_at desc
        limit 1;
        if v_harga_pembanding is null then
            raise exception 'Harga pembanding pemasok untuk barang baris % belum ada', v_i;
        end if;

        if coalesce(v_elem->>'harga_satuan', '') = '' then
            v_harga := v_harga_pembanding;
        else
            v_harga := (v_elem->>'harga_satuan')::numeric(18,4);
        end if;

        if v_harga <> v_harga_pembanding then
            raise exception 'Harga baris % harus sama dengan harga pembanding pemasok', v_i;
        end if;

        v_baris_po := v_baris_po || jsonb_build_object(
            'produk_id', v_produk_id,
            'qty', v_qty::text,
            'harga_satuan', v_harga::text,
            'ppn_persen', v_ppn::text
        );
    end loop;

    v_hasil := public.buat_po(
        p_dokumen_id, v_dokumen.versi, v_pr.pemasok_id, v_baris_po, v_tanggal, v_aktor
    );
    v_po_id := (v_hasil->>'po_id')::uuid;

    select versi into v_versi_pr from public.dokumen where id = p_dokumen_id;
    perform public.pindah_status_dokumen(
        p_dokumen_id, v_versi_pr, 'DITERBITKAN', 'TERBITKAN', v_aktor, null
    );

    return v_hasil || jsonb_build_object(
        'permintaan_id', p_dokumen_id,
        'permintaan_status', 'DITERBITKAN',
        'ppn_persen', v_ppn::text
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Pembatalan PO beserta permintaannya
-- ---------------------------------------------------------------------------

create or replace function public.batalkan_po_dengan_permintaan(
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
    v_hasil jsonb;
    v_permintaan_id uuid;
    v_versi_pr bigint;
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pembatalan wajib diisi';
    end if;

    v_hasil := public.batalkan_po(p_dokumen_id, p_versi, btrim(p_alasan), v_aktor);

    select permintaan_id into v_permintaan_id
    from public.po
    where dokumen_id = p_dokumen_id;

    if v_permintaan_id is null then
        raise exception 'Purchase order tidak ditemukan.';
    end if;

    select versi into v_versi_pr from public.dokumen where id = v_permintaan_id;
    perform public.pindah_status_dokumen(
        v_permintaan_id, v_versi_pr, 'DIBATALKAN', 'BATAL', v_aktor, btrim(p_alasan)
    );

    return v_hasil || jsonb_build_object(
        'permintaan_id', v_permintaan_id,
        'permintaan_status', 'DIBATALKAN'
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Catatan konfirmasi pemasok (bukan status, Q-02)
-- ---------------------------------------------------------------------------

create or replace function public.catat_konfirmasi_po(
    p_dokumen_id uuid,
    p_catatan text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Purchasing']);
    v_status text;
begin
    if p_catatan is null or length(btrim(p_catatan)) = 0 then
        raise exception 'Catatan konfirmasi wajib diisi';
    end if;

    select d.status into v_status
    from public.po p
    join public.dokumen d on d.id = p.dokumen_id
    where p.dokumen_id = p_dokumen_id;

    if v_status is null then
        raise exception 'Purchase order tidak ditemukan.';
    end if;

    if v_status <> 'DITERBITKAN' then
        raise exception 'Konfirmasi hanya bisa dicatat pada PO yang sudah diterbitkan';
    end if;

    update public.po
    set catatan_konfirmasi = btrim(p_catatan),
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    return jsonb_build_object(
        'dokumen_id', p_dokumen_id,
        'catatan_konfirmasi', btrim(p_catatan)
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.konfigurasi_pajak enable row level security;

revoke all on public.konfigurasi_pajak from anon, authenticated;

grant select on public.konfigurasi_pajak to authenticated;
grant all on public.konfigurasi_pajak to service_role;

create policy "Staf aktif boleh baca konfigurasi pajak"
on public.konfigurasi_pajak for select to authenticated
using (public.is_active_staff());

revoke all on function public.tarif_ppn_untuk(date) from public, anon, authenticated;
revoke all on function public.terbitkan_po(uuid, bigint, jsonb, date, uuid) from public, anon, authenticated;
revoke all on function public.batalkan_po_dengan_permintaan(uuid, bigint, text, uuid) from public, anon, authenticated;
revoke all on function public.catat_konfirmasi_po(uuid, text, uuid) from public, anon, authenticated;

grant execute on function public.tarif_ppn_untuk(date) to service_role;
grant execute on function public.terbitkan_po(uuid, bigint, jsonb, date, uuid) to service_role;
grant execute on function public.batalkan_po_dengan_permintaan(uuid, bigint, text, uuid) to service_role;
grant execute on function public.catat_konfirmasi_po(uuid, text, uuid) to service_role;
