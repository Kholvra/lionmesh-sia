-- GJ-008: impor presensi dari berkas mesin absensi (CSV generik, D-60e).
-- Disusun dari usulan GJ-008 (06-ddl-proposal.sql). Nomor 0022 menunggu
-- persetujuan tech lead (D-09); item ini hanya bergantung pada GJ-002 (0017).
-- Parsing dan validasi format berjalan di server aplikasi (impor/parse.ts);
-- fungsi di sini menggolongkan baris, menyimpan presensi, dan mencatat hasil
-- dalam satu transaksi (AC-04).

-- Profil pemetaan kolom (D-52): merek mesin tidak memengaruhi parser, hanya profil ini.
create table public.profil_impor_presensi (
    id uuid primary key default gen_random_uuid(),
    pemisah text not null,
    format_tanggal text not null,
    kolom_id_mesin text not null,
    kolom_tanggal text not null,
    kolom_jam_masuk text not null,
    kolom_jam_pulang text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    constraint ck_profil_impor_pemisah check (pemisah in (',', ';', E'\t')),
    constraint ck_profil_impor_format check (format_tanggal in ('YYYY-MM-DD', 'DD/MM/YYYY')),
    constraint ck_profil_impor_kolom check (
        length(btrim(kolom_id_mesin)) > 0 and length(btrim(kolom_tanggal)) > 0
        and length(btrim(kolom_jam_masuk)) > 0 and length(btrim(kolom_jam_pulang)) > 0
    )
);

-- Satu profil aktif; versi lama tetap tersimpan.
create unique index uq_profil_impor_aktif on public.profil_impor_presensi (aktif) where aktif;

create table public.pemetaan_id_mesin (
    id uuid primary key default gen_random_uuid(),
    id_mesin text not null,
    karyawan_id uuid not null references public.karyawan (id),
    created_by uuid,
    created_at timestamptz not null default now(),
    constraint uq_pemetaan_id_mesin unique (id_mesin),                              -- AC-10
    constraint ck_pemetaan_id_mesin_not_blank check (length(btrim(id_mesin)) > 0)
);

create table public.impor_presensi (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    nama_berkas text not null,
    sha256 text not null,
    tersimpan integer not null,
    dilewati jsonb not null default '[]'::jsonb,
    created_by uuid not null,
    created_at timestamptz not null default now(),
    constraint uq_impor_presensi_sha256 unique (sha256),                            -- AC-05
    constraint ck_impor_presensi_sha256 check (sha256 ~ '^[0-9a-f]{64}$'),
    constraint ck_impor_presensi_dilewati check (jsonb_typeof(dilewati) = 'array')
);

alter table public.presensi
    add column impor_presensi_id uuid references public.impor_presensi (id),
    add constraint ck_presensi_impor_sumber check (impor_presensi_id is null or sumber = 'IMPOR');

create trigger trg_impor_presensi_append_only before update or delete on public.impor_presensi
for each row execute function public.trg_gj002_append_only();
create trigger trg_profil_impor_append_only before delete on public.profil_impor_presensi
for each row execute function public.trg_gj002_append_only();

-- ---------------------------------------------------------------------------
-- Fungsi tulis (HR saja, GJ-008 M-03)

create or replace function public.simpan_profil_impor(
    p_pemisah text, p_format_tanggal text,
    p_kolom_id_mesin text, p_kolom_tanggal text, p_kolom_jam_masuk text, p_kolom_jam_pulang text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_id uuid;
begin
    perform public.gj_assert_peran('HR');
    update public.profil_impor_presensi set aktif = false where aktif;
    insert into public.profil_impor_presensi (
        pemisah, format_tanggal, kolom_id_mesin, kolom_tanggal, kolom_jam_masuk, kolom_jam_pulang, created_by
    ) values (
        p_pemisah, p_format_tanggal, btrim(p_kolom_id_mesin), btrim(p_kolom_tanggal),
        btrim(p_kolom_jam_masuk), btrim(p_kolom_jam_pulang), auth.uid()
    ) returning id into v_id;
    return v_id;
end;
$$;

-- AC-09, AC-10, AC-13: satu ID mesin untuk satu karyawan aktif.
create or replace function public.tambah_pemetaan_id_mesin(p_id_mesin text, p_karyawan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_id uuid;
begin
    perform public.gj_assert_peran('HR');
    if exists (select 1 from public.pemetaan_id_mesin where id_mesin = btrim(p_id_mesin)) then
        raise exception 'ID mesin % sudah dipetakan; satu ID hanya untuk satu NIK.', btrim(p_id_mesin) using errcode = '23505';
    end if;
    if not exists (select 1 from public.karyawan where id = p_karyawan_id and status = 'AKTIF') then
        raise exception 'Pilih karyawan aktif.';
    end if;
    insert into public.pemetaan_id_mesin (id_mesin, karyawan_id, created_by)
    values (btrim(p_id_mesin), p_karyawan_id, auth.uid())
    returning id into v_id;
    return v_id;
end;
$$;

-- p_baris: [{baris, id_mesin, tanggal, jam_masuk, jam_pulang}], sudah lolos parser.
-- Baris yang tidak terpetakan, nonaktif, di luar periode, atau bentrok dilewati
-- dengan alasan; baris lain disimpan. Semua atau tidak sama sekali.
create or replace function public.impor_presensi_mesin(
    p_periode_gaji_id uuid,
    p_nama_berkas text,
    p_sha256 text,
    p_baris jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_periode record;
    v_impor uuid := gen_random_uuid();
    v_row jsonb;
    v_karyawan record;
    v_tanggal date;
    v_dilewati jsonb := '[]'::jsonb;
    v_simpan integer := 0;
    v_dok jsonb;
    v_lama text;
    v_dipakai text[] := '{}';
begin
    perform public.gj_assert_peran('HR');
    select p.id, p.nama, p.tanggal_mulai, p.tanggal_selesai, d.status into v_periode
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id;
    if not found then
        raise exception 'Pilih periode.';
    end if;
    if v_periode.status <> 'TERBUKA' then
        raise exception 'Impor ditolak: periode % tertutup.', v_periode.nama;                 -- AC-07
    end if;
    select nama_berkas into v_lama from public.impor_presensi where sha256 = p_sha256;
    if found then
        raise exception 'Berkas ini sudah pernah diimpor (%). Tidak ada baris yang ditambahkan.', v_lama;   -- AC-05
    end if;
    if jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Berkas kosong: tidak ada baris data presensi.';                     -- AC-12
    end if;

    -- Langkah 1: golongkan setiap baris. Catatan impor (append-only) ditulis sesudahnya
    -- dengan jumlah final, lalu langkah 2 menyimpan presensi yang menunjuk catatan itu.
    for v_row in select * from jsonb_array_elements(p_baris) loop
        v_tanggal := (v_row ->> 'tanggal')::date;
        select k.id, k.nik, k.status into v_karyawan
        from public.pemetaan_id_mesin m join public.karyawan k on k.id = m.karyawan_id
        where m.id_mesin = v_row ->> 'id_mesin';
        if not found then
            v_dilewati := v_dilewati || jsonb_build_object('baris', v_row -> 'baris', 'idMesin', v_row ->> 'id_mesin', 'tanggal', v_row ->> 'tanggal',
                'jenis', 'TIDAK_TERPETAKAN', 'alasan', format('ID mesin %s belum dipetakan ke NIK', v_row ->> 'id_mesin'));
        elsif v_karyawan.status <> 'AKTIF' then
            v_dilewati := v_dilewati || jsonb_build_object('baris', v_row -> 'baris', 'idMesin', v_row ->> 'id_mesin', 'tanggal', v_row ->> 'tanggal',
                'jenis', 'NONAKTIF', 'alasan', format('NIK %s nonaktif', v_karyawan.nik));
        elsif v_tanggal < v_periode.tanggal_mulai or v_tanggal > v_periode.tanggal_selesai then
            v_dilewati := v_dilewati || jsonb_build_object('baris', v_row -> 'baris', 'idMesin', v_row ->> 'id_mesin', 'tanggal', v_row ->> 'tanggal',
                'jenis', 'DI_LUAR_PERIODE', 'alasan', format('Tanggal di luar periode %s', v_periode.nama));
        elsif exists (select 1 from public.presensi where karyawan_id = v_karyawan.id and tanggal = v_tanggal)
            or (v_karyawan.id::text || '|' || v_tanggal::text) = any (v_dipakai) then
            v_dilewati := v_dilewati || jsonb_build_object('baris', v_row -> 'baris', 'idMesin', v_row ->> 'id_mesin', 'tanggal', v_row ->> 'tanggal',
                'jenis', 'BENTROK', 'alasan', format('Presensi NIK %s pada tanggal ini sudah ada; yang lama tidak diubah', v_karyawan.nik));
        else
            v_simpan := v_simpan + 1;
            v_dipakai := v_dipakai || (v_karyawan.id::text || '|' || v_tanggal::text);
        end if;
    end loop;

    insert into public.impor_presensi (id, periode_gaji_id, nama_berkas, sha256, tersimpan, dilewati, created_by)
    values (v_impor, v_periode.id, p_nama_berkas, p_sha256, v_simpan, v_dilewati, auth.uid());

    for v_row in select * from jsonb_array_elements(p_baris) loop
        v_tanggal := (v_row ->> 'tanggal')::date;
        select k.id, k.status into v_karyawan
        from public.pemetaan_id_mesin m join public.karyawan k on k.id = m.karyawan_id
        where m.id_mesin = v_row ->> 'id_mesin';
        continue when not found or v_karyawan.status <> 'AKTIF'
            or v_tanggal < v_periode.tanggal_mulai or v_tanggal > v_periode.tanggal_selesai
            or exists (select 1 from public.presensi where karyawan_id = v_karyawan.id and tanggal = v_tanggal);
        v_dok := public.buat_dokumen('PRESENSI', auth.uid(), null, v_tanggal);
        insert into public.presensi (
            dokumen_id, karyawan_id, tanggal, kehadiran, jam_masuk, jam_pulang, sumber, impor_presensi_id, created_by, updated_by
        ) values (
            (v_dok -> 'dokumen' ->> 'id')::uuid, v_karyawan.id, v_tanggal, 'HADIR',
            (v_row ->> 'jam_masuk')::time, nullif(v_row ->> 'jam_pulang', '')::time, 'IMPOR', v_impor, auth.uid(), auth.uid()
        );
    end loop;
    return v_impor;
end;
$$;

-- ---------------------------------------------------------------------------
-- View baca (HR)

create or replace view public.profil_impor_aman
with (security_barrier = true)
as
select p.id, p.pemisah, p.format_tanggal, p.kolom_id_mesin, p.kolom_tanggal, p.kolom_jam_masuk, p.kolom_jam_pulang,
       coalesce(pr.display_name, 'HR') as diubah_oleh, p.created_at as diubah_pada
from public.profil_impor_presensi p
left join public.profiles pr on pr.id = p.created_by
where p.aktif and public.current_peran() = 'HR';

create or replace view public.pemetaan_id_mesin_aman
with (security_barrier = true)
as
select m.id, m.id_mesin, m.karyawan_id, k.nama, k.nik, k.status,
       coalesce(pr.display_name, 'HR') as oleh, m.created_at
from public.pemetaan_id_mesin m
join public.karyawan k on k.id = m.karyawan_id
left join public.profiles pr on pr.id = m.created_by
where public.current_peran() = 'HR';

create or replace view public.impor_presensi_aman
with (security_barrier = true)
as
select i.id, i.periode_gaji_id, i.nama_berkas, i.sha256, i.tersimpan, i.dilewati,
       coalesce(pr.display_name, 'HR') as oleh, i.created_at
from public.impor_presensi i
left join public.profiles pr on pr.id = i.created_by
where public.current_peran() = 'HR';

alter table public.profil_impor_presensi enable row level security;
alter table public.pemetaan_id_mesin enable row level security;
alter table public.impor_presensi enable row level security;

revoke all on public.profil_impor_presensi, public.pemetaan_id_mesin, public.impor_presensi from anon, authenticated;
revoke all on public.profil_impor_aman, public.pemetaan_id_mesin_aman, public.impor_presensi_aman from public, anon;
grant select on public.profil_impor_aman, public.pemetaan_id_mesin_aman, public.impor_presensi_aman to authenticated;

create policy "HR baca profil impor" on public.profil_impor_presensi
    for select to authenticated using (public.current_peran() = 'HR');
create policy "HR baca pemetaan ID mesin" on public.pemetaan_id_mesin
    for select to authenticated using (public.current_peran() = 'HR');
create policy "HR baca hasil impor" on public.impor_presensi
    for select to authenticated using (public.current_peran() = 'HR');

revoke all on function public.simpan_profil_impor(text, text, text, text, text, text) from public, anon;
revoke all on function public.tambah_pemetaan_id_mesin(text, uuid) from public, anon;
revoke all on function public.impor_presensi_mesin(uuid, text, text, jsonb) from public, anon;
grant execute on function public.simpan_profil_impor(text, text, text, text, text, text) to authenticated;
grant execute on function public.tambah_pemetaan_id_mesin(text, uuid) to authenticated;
grant execute on function public.impor_presensi_mesin(uuid, text, text, jsonb) to authenticated;
