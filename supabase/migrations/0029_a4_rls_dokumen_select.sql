-- A4: restore SELECT access to the FND-004 document tables. Migration 0007
-- revoked every privilege from anon and authenticated but did not leave a
-- SELECT grant or policy behind, so a direct read with a user token returns
-- nothing. Writes stay behind the core RPCs; the service-role clients used by
-- getDokumenExecutionContext()/getPengadaanExecutionContext() keep the grants
-- from 0007 and bypass RLS unchanged.
--
-- Row scope follows the application read filters (getPermintaanPageData):
-- creators always read their own documents, Purchasing and Manajemen read all
-- documents, and status history follows the visibility of its document.
-- anon is never granted and has no policy.

-- ---------------------------------------------------------------------------
-- 1. anon stays denied
-- Keep 0007's anon revocation explicit even if default privileges change later.
revoke all on public.status_dokumen_sah from anon;
revoke all on public.transisi_dokumen_sah from anon;
revoke all on public.jenis_dokumen from anon;
revoke all on public.jenis_dokumen_status from anon;
revoke all on public.dokumen_counter from anon;
revoke all on public.dokumen from anon;
revoke all on public.aturan_approval from anon;
revoke all on public.riwayat_status from anon;

-- ---------------------------------------------------------------------------
-- 2. Grants
-- ---------------------------------------------------------------------------

grant select on public.status_dokumen_sah to authenticated;
grant select on public.transisi_dokumen_sah to authenticated;
grant select on public.jenis_dokumen to authenticated;
grant select on public.jenis_dokumen_status to authenticated;
grant select on public.dokumen_counter to authenticated;
grant select on public.dokumen to authenticated;
grant select on public.aturan_approval to authenticated;
grant select on public.riwayat_status to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Shared registries: active staff can read lookup data (same rule as the
--    master tables in 0003). is_active_staff() also enforces session validity.
-- ---------------------------------------------------------------------------

drop policy if exists "Staff can view status dokumen" on public.status_dokumen_sah;
create policy "Staff can view status dokumen"
on public.status_dokumen_sah for select
to authenticated
using (public.is_active_staff());

drop policy if exists "Staff can view transisi dokumen" on public.transisi_dokumen_sah;
create policy "Staff can view transisi dokumen"
on public.transisi_dokumen_sah for select
to authenticated
using (public.is_active_staff());

drop policy if exists "Staff can view jenis dokumen" on public.jenis_dokumen;
create policy "Staff can view jenis dokumen"
on public.jenis_dokumen for select
to authenticated
using (public.is_active_staff());

drop policy if exists "Staff can view jenis dokumen status" on public.jenis_dokumen_status;
create policy "Staff can view jenis dokumen status"
on public.jenis_dokumen_status for select
to authenticated
using (public.is_active_staff());

drop policy if exists "Staff can view dokumen counter" on public.dokumen_counter;
create policy "Staff can view dokumen counter"
on public.dokumen_counter for select
to authenticated
using (public.is_active_staff());

drop policy if exists "Staff can view aturan approval" on public.aturan_approval;
create policy "Staff can view aturan approval"
on public.aturan_approval for select
to authenticated
using (public.is_active_staff());

-- ---------------------------------------------------------------------------
-- 4. Documents: own rows for any active session, all rows for the reviewing
--    roles that the module already lets read every request.
-- ---------------------------------------------------------------------------

drop policy if exists "Pembuat or reviewer can view dokumen" on public.dokumen;
create policy "Pembuat or reviewer can view dokumen"
on public.dokumen for select
to authenticated
using (
    (pembuat_id = (select auth.uid()) and public.is_session_current())
    or (select public.current_peran()) in ('Purchasing', 'Manajemen')
);

-- ---------------------------------------------------------------------------
-- 5. Status history inherits the document policy; the subquery is evaluated
--    under the same RLS rule as a direct document read.
-- ---------------------------------------------------------------------------

drop policy if exists "Riwayat follows dokumen visibility" on public.riwayat_status;
create policy "Riwayat follows dokumen visibility"
on public.riwayat_status for select
to authenticated
using (exists (select 1 from public.dokumen where id = riwayat_status.dokumen_id));
