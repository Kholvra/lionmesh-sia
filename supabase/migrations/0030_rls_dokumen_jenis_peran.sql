-- F3 (Fase 4.5): narrow the dokumen SELECT policy to the approved opsi (b).
-- Migration 0017 let Purchasing/Manajemen read every dokumen row. Reviewers
-- only need procurement documents; every other role keeps 0017's own-row read.
-- This is a forward fix: migrations 0001-0017 are left untouched.
--
-- Pengadaan type codes: 0014 registers PURCHASE_ORDER and PENERIMAAN_BARANG;
-- PERMINTAAN_PEMBELIAN is registered by the FND-004 seed applied with 0010.
-- The riwayat_status policy from 0017 inherits the narrowed scope through its
-- EXISTS subquery, so it is intentionally not recreated here.

begin;

-- ---------------------------------------------------------------------------
-- 1. anon stays denied. Repeating 0007/0017's revocation keeps this explicit
--    if default privileges ever change. authenticated keeps its 0017 grant;
--    service_role keeps its 0007 grant (no grant is changed in this fix).
-- ---------------------------------------------------------------------------

revoke all on public.dokumen from anon;

-- ---------------------------------------------------------------------------
-- 2. Role x type matrix.
--    - Creator: own rows for any current session (Gudang, Produksi, and all
--      other roles). This is exactly 0017's outcome for non-reviewers.
--    - Purchasing/Manajemen: all rows, but only for pengadaan types.
--      current_peran() already requires an active profile and a live session.
--    - Non-pengadaan rows remain visible only to their creator.
-- ---------------------------------------------------------------------------

drop policy if exists "Pembuat or reviewer can view dokumen" on public.dokumen;
create policy "Pembuat or pengadaan reviewer can view dokumen"
on public.dokumen for select
to authenticated
using (
    (pembuat_id = (select auth.uid()) and public.is_session_current())
    or (
        (select public.current_peran()) in ('Purchasing', 'Manajemen')
        and tipe in ('PERMINTAAN_PEMBELIAN', 'PURCHASE_ORDER', 'PENERIMAAN_BARANG')
    )
);

commit;
