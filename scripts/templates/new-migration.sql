-- TEMPLATE ONLY — never run or edit an applied migration.
-- Copy this file to supabase/migrations/NNNN_nama.sql after the tech lead
-- assigns the next free number, then replace every <placeholder> below.
-- Fix-forward only: corrections go into a new numbered migration.

begin;

-- ---------------------------------------------------------------------------
-- 1. Immutable event rows (append-only ledger, stock movements, history).
--    Use this when a row must never be updated or deleted; corrections are a
--    new compensating row, so the audit trail stays intact.
-- ---------------------------------------------------------------------------

create or replace function public.trg_<entity>_append_only()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Baris <entity> tidak bisa diubah atau dihapus. Gunakan baris koreksi baru.';
end;
$$;

drop trigger if exists trg_<entity>_append_only on public.<table>;
create trigger trg_<entity>_append_only
before update or delete on public.<table>
for each row
execute function public.trg_<entity>_append_only();

-- For editable documents use immutable-field protection instead: keep status
-- transitions writable but freeze identity, number, and creator.
create or replace function public.trg_<entity>_immutable_fields()
returns trigger
language plpgsql
as $$
begin
    if new.id is distinct from old.id
        or new.nomor is distinct from old.nomor
        or new.pembuat_id is distinct from old.pembuat_id
        or new.created_at is distinct from old.created_at then
        raise exception 'Identitas dan nomor <entity> tidak bisa diubah.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_<entity>_immutable_fields on public.<table>;
create trigger trg_<entity>_immutable_fields
before update on public.<table>
for each row
execute function public.trg_<entity>_immutable_fields();

-- ---------------------------------------------------------------------------
-- 2. Row Level Security. anon is always denied. Reads require an active
--    session; role-specific reads go through core helpers, never a broad
--    policy for authenticated. Writes belong behind SECURITY DEFINER core RPCs.
-- ---------------------------------------------------------------------------

alter table public.<table> enable row level security;

revoke all on public.<table> from anon;
revoke all on public.<table> from authenticated;
grant select on public.<table> to authenticated;

drop policy if exists "<entity> staff read" on public.<table>;
create policy "<entity> staff read"
on public.<table> for select
to authenticated
using (public.is_active_staff() and public.is_session_current());

drop policy if exists "<entity> owner read" on public.<table>;
create policy "<entity> owner read"
on public.<table> for select
to authenticated
using (pembuat_id = (select auth.uid()) and public.is_session_current());

-- History/detail rows inherit the visibility of their parent document.
drop policy if exists "<entity> follows parent" on public.<table>;
create policy "<entity> follows parent"
on public.<table> for select
to authenticated
using (
    exists (
        select 1 from public.<parent_table>
        where <parent_table>.id = <table>.<parent_id_column>
    )
);

-- SECURITY DEFINER helpers must be granted explicitly and must resolve the
-- actor from the session, never from a request payload.
revoke all on function public.<core_rpc>(<arg_types>) from public, anon, authenticated;
grant execute on function public.<core_rpc>(<arg_types>) to authenticated;

commit;
