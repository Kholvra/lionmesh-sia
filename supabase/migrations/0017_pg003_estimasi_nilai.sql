-- PG-003: review PR menyimpan estimasi nilai sebelum approval snapshot dibuat.
-- Migrasi ini melengkapi C-013 tanpa mengubah migrasi yang sudah diterapkan.

create or replace function public.periksa_pr_dengan_nilai(
    p_dokumen_id uuid,
    p_versi bigint,
    p_aktor_id uuid,
    p_nominal numeric,
    p_alasan text default null
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
    if p_nominal is null or p_nominal < 0 then
        raise exception 'Estimasi nilai tidak valid.';
    end if;

    select * into v_dokumen
    from public.dokumen
    where id = p_dokumen_id
    for update;

    if not found or not exists (
        select 1 from public.permintaan_pembelian where dokumen_id = p_dokumen_id
    ) then
        raise exception 'Permintaan pembelian tidak ditemukan.';
    end if;

    if v_dokumen.status <> 'DIAJUKAN' then
        raise exception 'Permintaan berstatus % tidak dapat diperiksa.', v_dokumen.status;
    end if;

    -- Reject a stale form before touching the nominal, so a lost race never
    -- leaves an estimate that was never reviewed.
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;

    update public.dokumen
    set nominal = round(p_nominal, 2),
        updated_by = v_aktor,
        updated_at = now()
    where id = p_dokumen_id;

    return public.periksa_dokumen(p_dokumen_id, p_versi, v_aktor, p_alasan);
end;
$$;

revoke all on function public.periksa_pr_dengan_nilai(uuid, bigint, uuid, numeric, text)
from public, anon, authenticated;
grant execute on function public.periksa_pr_dengan_nilai(uuid, bigint, uuid, numeric, text)
to service_role;
