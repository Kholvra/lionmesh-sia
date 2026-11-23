-- Deny token issuance for inactive profiles without exposing account state
-- before password verification. The Auth hook must be enabled before rollout.
grant usage on schema public to supabase_auth_admin;
grant select (id, aktif) on public.profiles to supabase_auth_admin;

create policy "Auth hook can check active profiles"
on public.profiles for select to supabase_auth_admin using (true);

create function public.active_profile_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = (event->>'user_id')::uuid and aktif
  ) or not exists (
    select 1 from auth.sessions
    where id::text = event->'claims'->>'session_id'
      and user_id = (event->>'user_id')::uuid
      and created_at > now() - interval '8 hours'
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400, 'message', 'Invalid login credentials'
    ));
  end if;
  return event;
end;
$$;
revoke all on function public.active_profile_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.active_profile_access_token_hook(jsonb) to supabase_auth_admin;

-- Only remove the exact sentinel introduced by migration 0003; do not remove
-- independent administrative bans with a different expiry.
update auth.users u set banned_until = null
from public.profiles p
where p.id = u.id and u.banned_until = '9999-12-31 23:59:59+00'::timestamptz;

create or replace function public.handle_profile_session_revocation()
returns trigger
language plpgsql security definer
set search_path = public, auth
as $$
begin
  if old.peran is distinct from new.peran or old.aktif is distinct from new.aktif then
    delete from auth.sessions where user_id = new.id;
  end if;
  return new;
end;
$$;

-- Enforce the absolute session lifetime on every RLS-backed request, even
-- when an already-issued JWT has not yet expired.
create or replace function public.is_session_current()
returns boolean language sql security definer stable
set search_path = public, auth
as $$
  select exists (
    select 1 from auth.sessions
    where id::text = (select auth.jwt() ->> 'session_id')
      and user_id = (select auth.uid())
      and created_at > now() - interval '8 hours'
  );
$$;
