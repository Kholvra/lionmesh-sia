-- Data dasar FND-001.
-- Penjaga "sudah pernah di-seed" dijalankan oleh scripts/db-seed.mjs sebelum berkas ini.
-- Kontrak: B-02, POST-04, INV-03.

create table if not exists public._seed_meta (
  version text primary key
);

-- Tidak ada policy: tabel ini tidak boleh dibaca lewat API.
alter table public._seed_meta enable row level security;

insert into public._seed_meta (version) values ('0001');
