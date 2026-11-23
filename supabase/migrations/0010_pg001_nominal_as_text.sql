-- PG-001: numeric(18,2) must reach the client as text.
--
-- PostgREST serialises numeric as a JSON number. JSON.parse then rounds anything
-- above Number.MAX_SAFE_INTEGER: 9007199254740993 arrives as ...992, so the detail
-- screen and the edit form show the wrong amount, and saving the form again would
-- overwrite the stored value. core/ledger and core/inventory already treat numeric
-- as decimal strings; this view now does the same at the read path.
--
-- CREATE OR REPLACE cannot change a column type, so the view is recreated.

drop view if exists public.pemasok_aman;

create view public.pemasok_aman
with (security_barrier = true)
as
select
    p.id,
    p.nama,
    p.alamat,
    p.npwp,
    p.kontak_perusahaan,
    case
        when public.current_peran() in ('Purchasing', 'Accounting') then p.kontak_pic_nama
        else null
    end as kontak_pic_nama,
    case
        when public.current_peran() in ('Purchasing', 'Accounting') then p.kontak_pic_telepon
        else null
    end as kontak_pic_telepon,
    p.termin_hari,
    -- numeric always prints with its scale ("1.00"); trim it so the edit form
    -- shows the same text the user typed instead of a padded zero.
    trim(trailing '.' from trim(trailing '0' from p.toleransi_persen::text)) as toleransi_persen,
    trim(trailing '.' from trim(trailing '0' from p.toleransi_nominal::text)) as toleransi_nominal,
    p.aktif,
    p.created_at,
    p.updated_at
from public.pemasok p
where public.is_active_staff();

revoke all on public.pemasok_aman from public, anon;
grant select on public.pemasok_aman to authenticated;
grant select on public.pemasok_aman to service_role;
