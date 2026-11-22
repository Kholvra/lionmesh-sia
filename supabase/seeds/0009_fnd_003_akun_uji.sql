-- Local-only accounts. Password is supplied to the seed transaction through a session setting.
create temporary table fnd_test_accounts (
  id uuid primary key,
  email text not null,
  peran text not null
) on commit drop;

insert into fnd_test_accounts (id, email, peran) values
  ('f0080000-0000-4000-8100-000000000001', 'penjualan@lionmesh.test', 'Penjualan'),
  ('f0080000-0000-4000-8100-000000000002', 'pengiriman@lionmesh.test', 'Pengiriman'),
  ('f0080000-0000-4000-8100-000000000003', 'gudang@lionmesh.test', 'Gudang'),
  ('f0080000-0000-4000-8100-000000000004', 'purchasing@lionmesh.test', 'Purchasing'),
  ('f0080000-0000-4000-8100-000000000005', 'qc@lionmesh.test', 'QC'),
  ('f0080000-0000-4000-8100-000000000006', 'produksi@lionmesh.test', 'Produksi'),
  ('f0080000-0000-4000-8100-000000000007', 'accounting@lionmesh.test', 'Accounting'),
  ('f0080000-0000-4000-8100-000000000008', 'finance@lionmesh.test', 'Finance'),
  ('f0080000-0000-4000-8100-000000000009', 'manajemen@lionmesh.test', 'Manajemen'),
  ('f0080000-0000-4000-8100-000000000010', 'direksi@lionmesh.test', 'Direksi'),
  ('f0080000-0000-4000-8100-000000000011', 'hr@lionmesh.test', 'HR'),
  ('f0080000-0000-4000-8100-000000000012', 'supervisor-lapangan@lionmesh.test', 'Supervisor Lapangan'),
  ('f0080000-0000-4000-8100-000000000013', 'karyawan@lionmesh.test', 'Karyawan');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000'::uuid, id, 'authenticated', 'authenticated', email,
  extensions.crypt(current_setting('lionmesh.test_password'), extensions.gen_salt('bf')),
  '2026-01-01 00:00:00+00'::timestamptz,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', peran),
  '2026-01-01 00:00:00+00'::timestamptz, '2026-01-01 00:00:00+00'::timestamptz,
  '', '', '', ''
from fnd_test_accounts;

insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
select id, id::text, id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', '2026-01-01 00:00:00+00'::timestamptz, '2026-01-01 00:00:00+00'::timestamptz
from fnd_test_accounts;

-- Keep seeded audit timestamps deterministic without changing the normal update trigger.
alter table public.profiles disable trigger on_profile_updated;
update public.profiles p
set peran = a.peran,
    created_at = '2026-01-01 00:00:00+00'::timestamptz,
    updated_at = '2026-01-01 00:00:00+00'::timestamptz
from fnd_test_accounts a where p.id = a.id;
alter table public.profiles enable trigger on_profile_updated;
