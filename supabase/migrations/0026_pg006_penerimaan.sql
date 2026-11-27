-- PG-006: penerimaan barang. Pencatatan penerimaan sudah ada di C-013
-- (`catat_penerimaan`): validasi status PO, qty, sisa, dan exception kelebihan.
-- Migrasi ini menambah dua hal yang belum ada:
--   1. tepi transisi DITERIMA -> DIBATALKAN untuk membatalkan penerimaan
--      sebelum ada hasil QC (R-08, D-48),
--   2. penutupan exception selisih oleh Purchasing (R-10, AC-14).

insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan) values
    ('DITERIMA', 'DIBATALKAN', 'BATAL', true)
on conflict (dari_status, ke_status, aksi) do nothing;

-- ---------------------------------------------------------------------------
-- Pembatalan penerimaan sebelum QC
-- ---------------------------------------------------------------------------

create or replace function public.batalkan_penerimaan(
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
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Gudang']);
    v_penerimaan public.penerimaan;
    v_dokumen public.dokumen;
    v_status_po text;
    v_sisa numeric(18,4);
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pembatalan wajib diisi';
    end if;

    select * into v_penerimaan from public.penerimaan where dokumen_id = p_dokumen_id;
    if not found then
        raise exception 'Penerimaan tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;

    if v_dokumen.status in ('QC_LULUS', 'QC_GAGAL') then
        raise exception 'Penerimaan sudah punya hasil QC dan tidak bisa dibatalkan';
    end if;

    if exists (
        select 1 from public.penerimaan_item
        where penerimaan_id = p_dokumen_id and qty_lulus is not null
    ) then
        raise exception 'Penerimaan sudah punya hasil QC dan tidak bisa dibatalkan';
    end if;

    select status into v_status_po from public.dokumen where id = v_penerimaan.po_id;

    -- No backwards transition exists for a fully received PO (D-46, D-48).
    -- Refuse instead of leaving a PO that is closed while stock is missing.
    if v_status_po = 'DITERIMA' then
        select coalesce(sum(i.qty), 0) - coalesce(sum(sudah.qty), 0) into v_sisa
        from public.po_item i
        left join (
            select qi.po_item_id, sum(qi.qty_diterima) as qty
            from public.penerimaan_item qi
            join public.dokumen d on d.id = qi.penerimaan_id
            where d.status <> 'DIBATALKAN'
              and qi.penerimaan_id <> p_dokumen_id
              and qi.penerimaan_id in (
                  select p.dokumen_id from public.penerimaan p where p.po_id = v_penerimaan.po_id
              )
            group by qi.po_item_id
        ) sudah on sudah.po_item_id = i.id
        where i.po_id = v_penerimaan.po_id;

        if v_sisa > 0 then
            raise exception 'PO sudah berstatus DITERIMA dan tidak bisa dibuka kembali. Koreksi lewat QC dan penerimaan baru.';
        end if;
    end if;

    return public.batalkan_dokumen(p_dokumen_id, p_versi, v_aktor, btrim(p_alasan));
end;
$$;

-- ---------------------------------------------------------------------------
-- Penutupan exception selisih oleh Purchasing
-- ---------------------------------------------------------------------------

create or replace function public.tutup_exception_selisih(
    p_exception_id uuid,
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
    v_status text;
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan penutupan wajib diisi';
    end if;

    select status into v_status
    from public.pengadaan_exception
    where id = p_exception_id
    for update;

    if v_status is null then
        raise exception 'Exception tidak ditemukan.';
    end if;

    if v_status <> 'TERBUKA' then
        raise exception 'Exception sudah ditutup.';
    end if;

    update public.pengadaan_exception
    set status = 'DITUTUP',
        alasan = btrim(p_alasan),
        updated_by = v_aktor,
        updated_at = now()
    where id = p_exception_id;

    return jsonb_build_object('exception_id', p_exception_id, 'status', 'DITUTUP');
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

revoke all on function public.batalkan_penerimaan(uuid, bigint, text, uuid)
from public, anon, authenticated;
revoke all on function public.tutup_exception_selisih(uuid, text, uuid)
from public, anon, authenticated;

grant execute on function public.batalkan_penerimaan(uuid, bigint, text, uuid)
to service_role;
grant execute on function public.tutup_exception_selisih(uuid, text, uuid)
to service_role;
