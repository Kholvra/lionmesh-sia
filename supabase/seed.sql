-- Bootstrap the FND-001 seed metadata table.
-- Item seed files run in numeric order through scripts/db-seed.mjs.
-- The script writes the dataset version after all files succeed.

create table if not exists public._seed_meta (
  version text primary key
);

-- No policies means client roles cannot read this table.
alter table public._seed_meta enable row level security;
