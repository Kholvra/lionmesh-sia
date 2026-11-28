-- GJ-004: draft payroll per periode, baris gaji per karyawan, dan komponen gaji.
-- Disusun dari usulan GJ-004 (06-ddl-proposal.sql). Nomor 0019 menunggu
-- persetujuan tech lead (D-09). Pola akses mengikuti 0017.
-- Status draft adalah status dokumen PERIODE_GAJI (0007):
--   TERVALIDASI -HITUNG-> DRAFT_TERHITUNG;  REVISI -REVISI_SELESAI-> DRAFT_TERHITUNG
-- Perhitungan berjalan di server aplikasi (payroll/hitung.ts, murni dan
-- deterministik); fungsi di sini menyimpan hasilnya, menjaga peran dan status,
-- dan mencatat jejak. Tabel tarif tetap konstanta berversi di kode untuk item ini;
-- versi yang dipakai tersimpan di draft (AC-15).
-- Uang numeric(18,2), nilai hitung mentah numeric(18,4) (D-56).

create table public.draft_payroll (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    versi_tarif jsonb not null,
    ditandai jsonb not null default '[]'::jsonb,   -- karyawan tanpa angka, dengan alasan
    created_by uuid not null,                      -- HR yang menghitung (pemisahan tugas GJ-005)
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_draft_payroll_periode unique (periode_gaji_id),
    constraint ck_draft_payroll_versi check (jsonb_typeof(versi_tarif) = 'object'),
    constraint ck_draft_payroll_ditandai check (jsonb_typeof(ditandai) = 'array')
);

create table public.baris_gaji (
    id uuid primary key default gen_random_uuid(),
    draft_payroll_id uuid not null references public.draft_payroll (id) on delete cascade,
    karyawan_id uuid not null references public.karyawan (id),
    nama text not null,                            -- snapshot saat dihitung
    nik text not null,
    departemen text not null,
    perlu_penyesuaian_tahunan boolean not null default false,
    constraint uq_baris_gaji_karyawan unique (draft_payroll_id, karyawan_id)
);

create table public.komponen_gaji (
    id uuid primary key default gen_random_uuid(),
    baris_gaji_id uuid not null references public.baris_gaji (id) on delete cascade,
    kode text not null,
    label text not null,
    jenis text not null,
    nilai numeric(18,2) not null,
    nilai_mentah numeric(18,4) not null,
    dasar text not null,
    versi_tarif text,
    koreksi_nilai_semula numeric(18,2),
    koreksi_alasan text,
    koreksi_by uuid,
    koreksi_at timestamptz,
    constraint uq_komponen_gaji_kode unique (baris_gaji_id, kode),
    constraint ck_komponen_gaji_jenis check (jenis in ('tambah', 'kurang')),
    constraint ck_komponen_gaji_kode check (kode in (
        'GAJI_POKOK', 'TUNJANGAN_TETAP', 'TUNJANGAN_KEHADIRAN', 'LEMBUR', 'POTONGAN_KETIDAKHADIRAN',
        'BPJS_JHT', 'BPJS_JP', 'BPJS_KESEHATAN', 'PPH21'
    )),
    constraint ck_komponen_gaji_nilai check (nilai >= 0 and nilai = trunc(nilai)),
    constraint ck_komponen_gaji_koreksi check (
        (koreksi_alasan is null) = (koreksi_at is null)
        and (koreksi_alasan is null or length(btrim(koreksi_alasan)) > 0)
    )
);

-- Jejak hitung dan koreksi (append-only); tampil di riwayat dokumen periode.
create table public.draft_payroll_log (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    aksi text not null,
    keterangan text not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_draft_payroll_log_aksi check (aksi in ('HITUNG', 'HITUNG_ULANG', 'KOREKSI'))
);

create trigger trg_draft_payroll_log_append_only
before update or delete on public.draft_payroll_log
for each row execute function public.trg_gj002_append_only();

-- ---------------------------------------------------------------------------
-- View baca (P-13): HR dan Accounting rincian; Finance gaji bersih; Direksi ringkasan.

create or replace view public.draft_payroll_aman
with (security_barrier = true)
as
select dp.id, dp.periode_gaji_id, dp.versi_tarif,
       case when public.current_peran() in ('HR', 'Accounting') then dp.ditandai else '[]'::jsonb end as ditandai,
       dp.created_by, coalesce(pr.display_name, 'HR') as created_by_nama, dp.created_at, dp.updated_at
from public.draft_payroll dp
left join public.profiles pr on pr.id = dp.created_by
where public.current_peran() in ('HR', 'Accounting', 'Finance', 'Direksi');

create or replace view public.komponen_gaji_aman
with (security_barrier = true)
as
select dp.periode_gaji_id, b.karyawan_id, b.nama, b.nik, b.departemen, b.perlu_penyesuaian_tahunan,
       k.kode, k.label, k.jenis, k.nilai::text as nilai, k.nilai_mentah::text as nilai_mentah,
       k.dasar, k.versi_tarif, k.koreksi_nilai_semula::text as koreksi_nilai_semula, k.koreksi_alasan,
       coalesce(pr.display_name, 'HR') as koreksi_oleh, k.koreksi_at
from public.komponen_gaji k
join public.baris_gaji b on b.id = k.baris_gaji_id
join public.draft_payroll dp on dp.id = b.draft_payroll_id
left join public.profiles pr on pr.id = k.koreksi_by
where public.current_peran() in ('HR', 'Accounting');

create or replace view public.gaji_bersih
with (security_barrier = true)
as
select dp.periode_gaji_id, b.karyawan_id, b.nama, b.nik,
       (sum(case when k.jenis = 'tambah' then k.nilai else -k.nilai end))::text as neto
from public.baris_gaji b
join public.draft_payroll dp on dp.id = b.draft_payroll_id
join public.komponen_gaji k on k.baris_gaji_id = b.id
where public.current_peran() in ('HR', 'Accounting', 'Finance')
group by dp.periode_gaji_id, b.karyawan_id, b.nama, b.nik;

create or replace view public.ringkasan_payroll
with (security_barrier = true)
as
select dp.periode_gaji_id,
       count(distinct b.id)::int as jumlah_karyawan,
       (coalesce(sum(k.nilai) filter (where k.jenis = 'tambah'), 0))::text as total_tambah,
       (coalesce(sum(k.nilai) filter (where k.jenis = 'kurang'), 0))::text as total_kurang,
       (coalesce(sum(case when k.jenis = 'tambah' then k.nilai else -k.nilai end), 0))::text as total_neto,
       (round(coalesce(sum(case when k.jenis = 'tambah' then k.nilai_mentah - k.nilai else k.nilai - k.nilai_mentah end), 0), 2))::text as total_selisih
from public.draft_payroll dp
left join public.baris_gaji b on b.draft_payroll_id = dp.id
left join public.komponen_gaji k on k.baris_gaji_id = b.id
where public.current_peran() in ('HR', 'Accounting', 'Finance', 'Direksi')
group by dp.periode_gaji_id;

-- Riwayat: ditambah jejak hitung dan koreksi pada dokumen periode. Keterangan
-- koreksi menyebut karyawan, jadi hanya HR dan Accounting yang membacanya.
create or replace view public.riwayat_penggajian
with (security_barrier = true)
as
select r.id, r.dokumen_id, r.status_asal as dari, r.status_tujuan as ke, r.alasan,
       coalesce(pr.display_name, 'Sistem') as oleh, r.created_at as pada
from public.riwayat_status r
left join public.profiles pr on pr.id = r.actor_id
where r.tipe_dokumen = 'PERIODE_GAJI' and public.current_peran() is not null
   or r.dokumen_id in (select dokumen_id from public.presensi_aman)
   or r.dokumen_id in (select dokumen_id from public.lembur_aman)
union all
select k.id, p.dokumen_id, d.status, d.status,
       'Koreksi periode tertutup: ' || k.alasan,
       coalesce(pr.display_name, 'HR'), k.created_at
from public.presensi_koreksi k
join public.presensi p on p.id = k.presensi_id
join public.dokumen d on d.id = p.dokumen_id
left join public.profiles pr on pr.id = k.actor_id
where p.dokumen_id in (select dokumen_id from public.presensi_aman)
union all
select v.id, pg.dokumen_id, 'REKAP', 'REKAP',
       'Departemen ' || dp.nama || ' tervalidasi',
       coalesce(pr.display_name, 'Supervisor Lapangan'), v.created_at
from public.validasi_departemen_periode v
join public.periode_gaji pg on pg.id = v.periode_gaji_id
join public.departemen dp on dp.id = v.departemen_id
left join public.profiles pr on pr.id = v.created_by
where public.current_peran() is not null
union all
select b.id, l.dokumen_id, d.status, d.status,
       'Diperbaiki HR: ' || b.alasan,
       coalesce(pr.display_name, 'HR'), b.created_at
from public.lembur_perbaikan b
join public.lembur l on l.id = b.lembur_id
join public.dokumen d on d.id = l.dokumen_id
left join public.profiles pr on pr.id = b.actor_id
where l.dokumen_id in (select dokumen_id from public.lembur_aman)
union all
select g.id, pg.dokumen_id, d.status, d.status, g.keterangan,
       coalesce(pr.display_name, 'HR'), g.created_at
from public.draft_payroll_log g
join public.periode_gaji pg on pg.id = g.periode_gaji_id
join public.dokumen d on d.id = pg.dokumen_id
left join public.profiles pr on pr.id = g.actor_id
where g.aksi = 'HITUNG_ULANG' and public.current_peran() is not null
   or g.aksi = 'KOREKSI' and public.current_peran() in ('HR', 'Accounting');

-- ---------------------------------------------------------------------------
-- Fungsi tulis

-- Menyimpan hasil hitung sekaligus: draft lama diganti seluruhnya (P-07); gagal
-- di tengah jalan membatalkan semuanya (AC-14).
-- p_baris: [{karyawan_id, nama, nik, departemen, perlu_penyesuaian_tahunan,
--            komponen: [{kode, label, jenis, nilai, nilai_mentah, dasar, versi_tarif}]}]
create or replace function public.simpan_draft_payroll(
    p_periode_gaji_id uuid,
    p_versi_tarif jsonb,
    p_ditandai jsonb,
    p_baris jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_actor uuid := auth.uid();
    v_draft uuid;
    v_baris jsonb;
    v_baris_id uuid;
    v_komponen jsonb;
    v_ulang boolean;
begin
    perform public.gj_assert_peran('HR');
    select p.*, d.id as dok_id, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found then
        raise exception 'Periode tidak ditemukan.';
    end if;
    if v.status in ('TERBUKA', 'REKAP') then
        raise exception 'Payroll % belum bisa dihitung: validasi supervisor belum dilakukan.', v.nama;
    end if;
    if v.status = 'DIPERIKSA' then
        raise exception 'Draft sedang diperiksa Accounting; tunggu dikembalikan sebelum menghitung ulang.';
    end if;
    if v.status not in ('TERVALIDASI', 'DRAFT_TERHITUNG', 'REVISI') then
        raise exception 'Draft sudah disetujui dan dikunci.';
    end if;

    select id into v_draft from public.draft_payroll where periode_gaji_id = v.id;
    v_ulang := v_draft is not null;
    if v_ulang then
        delete from public.baris_gaji where draft_payroll_id = v_draft;
        update public.draft_payroll
        set versi_tarif = p_versi_tarif, ditandai = coalesce(p_ditandai, '[]'::jsonb),
            created_by = v_actor, created_at = now(), updated_by = v_actor, updated_at = now()
        where id = v_draft;
    else
        insert into public.draft_payroll (periode_gaji_id, versi_tarif, ditandai, created_by, updated_by)
        values (v.id, p_versi_tarif, coalesce(p_ditandai, '[]'::jsonb), v_actor, v_actor)
        returning id into v_draft;
    end if;

    for v_baris in select * from jsonb_array_elements(p_baris) loop
        insert into public.baris_gaji (draft_payroll_id, karyawan_id, nama, nik, departemen, perlu_penyesuaian_tahunan)
        values (
            v_draft, (v_baris ->> 'karyawan_id')::uuid, v_baris ->> 'nama', v_baris ->> 'nik',
            v_baris ->> 'departemen', coalesce((v_baris ->> 'perlu_penyesuaian_tahunan')::boolean, false)
        ) returning id into v_baris_id;
        for v_komponen in select * from jsonb_array_elements(v_baris -> 'komponen') loop
            insert into public.komponen_gaji (baris_gaji_id, kode, label, jenis, nilai, nilai_mentah, dasar, versi_tarif)
            values (
                v_baris_id, v_komponen ->> 'kode', v_komponen ->> 'label', v_komponen ->> 'jenis',
                (v_komponen ->> 'nilai')::numeric, (v_komponen ->> 'nilai_mentah')::numeric,
                v_komponen ->> 'dasar', v_komponen ->> 'versi_tarif'
            );
        end loop;
    end loop;

    if v.status = 'TERVALIDASI' then
        perform public.pindah_status_dokumen(v.dok_id, v.versi, 'DRAFT_TERHITUNG', 'HITUNG', v_actor, 'Dihitung');
    elsif v.status = 'REVISI' then
        perform public.pindah_status_dokumen(v.dok_id, v.versi, 'DRAFT_TERHITUNG', 'REVISI_SELESAI', v_actor, 'Dihitung ulang');
    end if;
    insert into public.draft_payroll_log (periode_gaji_id, aksi, keterangan, actor_id)
    values (v.id, case when v_ulang then 'HITUNG_ULANG' else 'HITUNG' end,
            case when v_ulang then 'Dihitung ulang' else 'Dihitung' end, v_actor);
    return v_draft;
end;
$$;

-- Koreksi manual satu komponen dengan alasan (D-48). Nilai semula yang pertama tetap tersimpan.
create or replace function public.koreksi_komponen_gaji(
    p_periode_gaji_id uuid,
    p_karyawan_id uuid,
    p_kode text,
    p_nilai numeric,
    p_alasan text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_status text;
    v_komponen record;
begin
    perform public.gj_assert_peran('HR');
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan koreksi wajib diisi.';
    end if;
    if p_nilai is null or p_nilai < 0 or p_nilai <> trunc(p_nilai) then
        raise exception 'Isi nilai dalam rupiah, tanpa desimal.';
    end if;
    select d.status into v_status
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id;
    if v_status is null or v_status not in ('DRAFT_TERHITUNG', 'REVISI') then
        raise exception 'Koreksi hanya untuk draft yang belum diperiksa atau dikunci.';
    end if;

    select k.id, k.label, k.nilai, k.koreksi_nilai_semula, b.nama into v_komponen
    from public.komponen_gaji k
    join public.baris_gaji b on b.id = k.baris_gaji_id
    join public.draft_payroll dp on dp.id = b.draft_payroll_id
    where dp.periode_gaji_id = p_periode_gaji_id and b.karyawan_id = p_karyawan_id and k.kode = p_kode
    for update of k;
    if not found then
        raise exception 'Komponen tidak ditemukan pada draft ini.';
    end if;

    update public.komponen_gaji
    set koreksi_nilai_semula = coalesce(koreksi_nilai_semula, nilai),
        nilai = p_nilai, nilai_mentah = p_nilai,
        koreksi_alasan = btrim(p_alasan), koreksi_by = auth.uid(), koreksi_at = now()
    where id = v_komponen.id;

    insert into public.draft_payroll_log (periode_gaji_id, aksi, keterangan, actor_id)
    values (p_periode_gaji_id, 'KOREKSI', 'Koreksi ' || v_komponen.label || ' ' || v_komponen.nama || ': ' || btrim(p_alasan), auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- Akses

alter table public.draft_payroll enable row level security;
alter table public.baris_gaji enable row level security;
alter table public.komponen_gaji enable row level security;
alter table public.draft_payroll_log enable row level security;

revoke all on public.draft_payroll, public.baris_gaji, public.komponen_gaji, public.draft_payroll_log from anon, authenticated;
revoke all on public.draft_payroll_aman, public.komponen_gaji_aman, public.gaji_bersih, public.ringkasan_payroll from public, anon;
grant select on public.draft_payroll_aman, public.komponen_gaji_aman, public.gaji_bersih, public.ringkasan_payroll to authenticated;

create policy "Peran payroll baca draft" on public.draft_payroll
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting', 'Finance', 'Direksi'));
create policy "HR dan Accounting baca baris gaji" on public.baris_gaji
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting'));
create policy "HR dan Accounting baca komponen gaji" on public.komponen_gaji
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting'));
create policy "HR dan Accounting baca log draft" on public.draft_payroll_log
    for select to authenticated using (public.current_peran() in ('HR', 'Accounting'));

revoke all on function public.simpan_draft_payroll(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.koreksi_komponen_gaji(uuid, uuid, text, numeric, text) from public, anon;
grant execute on function public.simpan_draft_payroll(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.koreksi_komponen_gaji(uuid, uuid, text, numeric, text) to authenticated;
