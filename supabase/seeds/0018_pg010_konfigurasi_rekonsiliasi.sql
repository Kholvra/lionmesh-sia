-- PG-010: jendela pencocokan awal. Nilai 3 hari adalah placeholder dan harus
-- dikonfirmasi tech lead (lihat 05-evidence.md).

insert into public.konfigurasi_rekonsiliasi (id, jendela_hari, aktif)
values ('f0100000-0000-4000-8000-000000000001', 3, true)
on conflict (id) do nothing;
