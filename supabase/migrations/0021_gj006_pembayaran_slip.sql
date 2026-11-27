-- GJ-006: pembayaran gaji per karyawan, bukti transfer, dan slip gaji.
-- Disusun dari usulan GJ-006 (06-ddl-proposal.sql). Nomor 0021 menunggu
-- persetujuan tech lead (D-09). Pola akses mengikuti 0017. Tidak ada jurnal di
-- item ini (GJ-007). Status periode (dokumen PERIODE_GAJI, 0007):
--   DISETUJUI -BAYAR-> DIBAYAR | GAGAL_TRANSFER;  GAGAL_TRANSFER -BAYAR-> DIBAYAR

create table public.batch_transfer_gaji (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    bukti_path text not null,                     -- objek di bucket bukti-transfer-gaji
    bukti_nama text not null,
    bukti_tipe text not null,
    bukti_ukuran integer not null,
    ulang boolean not null default false,
    jumlah_karyawan integer not null,
    created_by uuid not null,
    created_at timestamptz not null default now(),
    constraint ck_batch_bukti_tipe check (bukti_tipe in ('application/pdf', 'image/png', 'image/jpeg')),
    constraint ck_batch_bukti_ukuran check (bukti_ukuran > 0 and bukti_ukuran <= 10485760),
    constraint ck_batch_jumlah check (jumlah_karyawan > 0)
);

create table public.transfer_gaji (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    karyawan_id uuid not null references public.karyawan (id),
    nominal numeric(18,2) not null,
    status text not null,
    created_by uuid not null,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_transfer_gaji_karyawan unique (periode_gaji_id, karyawan_id),   -- AC-15
    constraint ck_transfer_gaji_status check (status in ('DIBAYAR', 'GAGAL_TRANSFER')),
    constraint ck_transfer_gaji_nominal check (nominal >= 0)
);

create table public.percobaan_transfer_gaji (
    id uuid primary key default gen_random_uuid(),
    transfer_gaji_id uuid not null references public.transfer_gaji (id),
    batch_id uuid not null references public.batch_transfer_gaji (id),
    status text not null,
    referensi text,
    alasan text,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now(),
    constraint ck_percobaan_status check (status in ('DIBAYAR', 'GAGAL_TRANSFER'))
);

create table public.catatan_dana_gaji (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    catatan text not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now()
);

-- Slip tercetak tidak berubah; koreksi = slip pengganti dengan alasan (T-08).
create table public.slip_gaji (
    id uuid primary key default gen_random_uuid(),
    periode_gaji_id uuid not null references public.periode_gaji (id),
    karyawan_id uuid not null references public.karyawan (id),
    jenis text not null,
    alasan text,
    menggantikan_id uuid references public.slip_gaji (id),
    created_by uuid not null,
    created_at timestamptz not null default now(),
    constraint ck_slip_jenis check (jenis in ('ASLI', 'PENGGANTI')),
    constraint ck_slip_pengganti check (
        (jenis = 'ASLI' and alasan is null and menggantikan_id is null)
        or (jenis = 'PENGGANTI' and length(btrim(alasan)) > 0 and menggantikan_id is not null)
    )
);

create unique index uq_slip_gaji_asli on public.slip_gaji (periode_gaji_id, karyawan_id) where jenis = 'ASLI';

create table public.cetak_slip_gaji (
    id uuid primary key default gen_random_uuid(),
    slip_gaji_id uuid not null references public.slip_gaji (id),
    ulang boolean not null,
    actor_id uuid not null references auth.users (id),
    created_at timestamptz not null default now()
);

create trigger trg_batch_transfer_append_only before update or delete on public.batch_transfer_gaji
for each row execute function public.trg_gj002_append_only();
create trigger trg_percobaan_transfer_append_only before update or delete on public.percobaan_transfer_gaji
for each row execute function public.trg_gj002_append_only();
create trigger trg_catatan_dana_append_only before update or delete on public.catatan_dana_gaji
for each row execute function public.trg_gj002_append_only();
create trigger trg_slip_gaji_append_only before update or delete on public.slip_gaji
for each row execute function public.trg_gj002_append_only();
create trigger trg_cetak_slip_append_only before update or delete on public.cetak_slip_gaji
for each row execute function public.trg_gj002_append_only();

-- Bukti transfer: bucket privat. Finance mengunggah; Finance dan Accounting membaca.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bukti-transfer-gaji', 'bukti-transfer-gaji', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "Finance unggah bukti transfer gaji" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'bukti-transfer-gaji' and public.current_peran() = 'Finance');
create policy "Finance dan Accounting baca bukti transfer gaji" on storage.objects
    for select to authenticated
    using (bucket_id = 'bukti-transfer-gaji' and public.current_peran() in ('Finance', 'Accounting'));

-- ---------------------------------------------------------------------------
-- Helper

-- Finance saja, draft sudah disetujui, dan bukan penghitung draft (D-42, AC-08, AC-11).
create or replace function public.gj006_siapkan_bayar(p_periode_gaji_id uuid)
returns table (dokumen_id uuid, versi bigint, status text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
begin
    perform public.gj_assert_peran('Finance');
    select d.id as dok_id, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found then
        raise exception 'Periode tidak ditemukan.';
    end if;
    if v.status in ('DIBAYAR', 'DIPOSTING') then
        raise exception 'Semua karyawan periode ini sudah dibayar; pembayaran kedua ditolak.';
    end if;
    if v.status not in ('DISETUJUI', 'GAGAL_TRANSFER') then
        raise exception 'Pembayaran ditolak: payroll periode ini belum disetujui Direksi.';
    end if;
    if exists (select 1 from public.draft_payroll where periode_gaji_id = p_periode_gaji_id and created_by = auth.uid()) then
        raise exception 'Ditolak karena pemisahan tugas: penghitung draft tidak boleh mencatat pembayarannya.' using errcode = '42501';
    end if;
    return query select v.dok_id, v.versi, v.status;
end;
$$;

-- Status periode mengikuti karyawan (T-02): ada yang gagal → GAGAL_TRANSFER, semua dibayar → DIBAYAR.
create or replace function public.gj006_perbarui_status(p_periode_gaji_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_ke text;
begin
    select d.id, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id;

    if exists (select 1 from public.transfer_gaji where periode_gaji_id = p_periode_gaji_id and status = 'GAGAL_TRANSFER') then
        v_ke := 'GAGAL_TRANSFER';
    elsif not exists (
        select 1 from public.baris_gaji b
        join public.draft_payroll dp on dp.id = b.draft_payroll_id
        where dp.periode_gaji_id = p_periode_gaji_id
          and not exists (
              select 1 from public.transfer_gaji t
              where t.periode_gaji_id = p_periode_gaji_id and t.karyawan_id = b.karyawan_id and t.status = 'DIBAYAR'
          )
    ) then
        v_ke := 'DIBAYAR';
    else
        v_ke := v.status;
    end if;

    if v_ke <> v.status then
        perform public.pindah_status_dokumen(v.id, v.versi, v_ke, 'BAYAR', auth.uid());
    end if;
end;
$$;

-- Gaji bersih dari komponen draft (sumber yang sama dengan view gaji_bersih).
create or replace function public.gj006_neto(p_periode_gaji_id uuid, p_karyawan_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
    select sum(case when k.jenis = 'tambah' then k.nilai else -k.nilai end)
    from public.komponen_gaji k
    join public.baris_gaji b on b.id = k.baris_gaji_id
    join public.draft_payroll dp on dp.id = b.draft_payroll_id
    where dp.periode_gaji_id = p_periode_gaji_id and b.karyawan_id = p_karyawan_id;
$$;

-- ---------------------------------------------------------------------------
-- Fungsi tulis

-- p_hasil: [{karyawan_id, status, referensi}]. Karyawan yang sudah masuk batch atau
-- rekeningnya bermasalah tidak boleh ikut (INV-02, AC-12).
create or replace function public.kirim_batch_gaji(
    p_periode_gaji_id uuid,
    p_bukti_path text,
    p_bukti_nama text,
    p_bukti_tipe text,
    p_bukti_ukuran integer,
    p_hasil jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_batch uuid;
    v_hasil jsonb;
    v_karyawan uuid;
    v_transfer uuid;
    v_neto numeric;
    v_rek record;
begin
    perform public.gj006_siapkan_bayar(p_periode_gaji_id);
    if p_bukti_path is null or length(btrim(p_bukti_path)) = 0 then
        raise exception 'Bukti transfer wajib diunggah.';
    end if;
    if jsonb_typeof(p_hasil) <> 'array' or jsonb_array_length(p_hasil) = 0 then
        raise exception 'Tidak ada karyawan yang bisa masuk batch.';
    end if;

    insert into public.batch_transfer_gaji (
        periode_gaji_id, bukti_path, bukti_nama, bukti_tipe, bukti_ukuran, ulang, jumlah_karyawan, created_by
    ) values (
        p_periode_gaji_id, p_bukti_path, p_bukti_nama, p_bukti_tipe, p_bukti_ukuran, false, jsonb_array_length(p_hasil), auth.uid()
    ) returning id into v_batch;

    for v_hasil in select * from jsonb_array_elements(p_hasil) loop
        v_karyawan := (v_hasil ->> 'karyawan_id')::uuid;
        if v_hasil ->> 'status' not in ('DIBAYAR', 'GAGAL_TRANSFER') then
            raise exception 'Hasil transfer tidak valid.';
        end if;
        if exists (select 1 from public.transfer_gaji where periode_gaji_id = p_periode_gaji_id and karyawan_id = v_karyawan) then
            raise exception 'Karyawan ini sudah masuk batch; pembayaran kedua ditolak.' using errcode = '23505';
        end if;
        select rekening_nama_bank, rekening_nomor, rekening_nama_pemilik, nama into v_rek from public.karyawan where id = v_karyawan;
        if v_rek.rekening_nama_bank is null or btrim(v_rek.rekening_nama_bank) = ''
            or v_rek.rekening_nomor !~ '^[0-9]+$' or btrim(v_rek.rekening_nama_pemilik) = '' then
            raise exception 'Rekening % tidak lengkap; pembayarannya ditunda.', v_rek.nama;
        end if;
        v_neto := public.gj006_neto(p_periode_gaji_id, v_karyawan);
        if v_neto is null then
            raise exception 'Karyawan tidak ada di draft payroll periode ini.';
        end if;

        insert into public.transfer_gaji (periode_gaji_id, karyawan_id, nominal, status, created_by, updated_by)
        values (p_periode_gaji_id, v_karyawan, v_neto, v_hasil ->> 'status', auth.uid(), auth.uid())
        returning id into v_transfer;
        insert into public.percobaan_transfer_gaji (transfer_gaji_id, batch_id, status, referensi, actor_id)
        values (v_transfer, v_batch, v_hasil ->> 'status', nullif(btrim(v_hasil ->> 'referensi'), ''), auth.uid());
    end loop;

    perform public.gj006_perbarui_status(p_periode_gaji_id);
    return v_batch;
end;
$$;

-- AC-03, AC-04: percobaan ulang hanya untuk yang gagal, alasan dan bukti wajib.
create or replace function public.ulang_transfer_gaji(
    p_periode_gaji_id uuid,
    p_karyawan_id uuid,
    p_status text,
    p_referensi text,
    p_alasan text,
    p_bukti_path text,
    p_bukti_nama text,
    p_bukti_tipe text,
    p_bukti_ukuran integer
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_transfer record;
    v_batch uuid;
begin
    perform public.gj006_siapkan_bayar(p_periode_gaji_id);
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan percobaan ulang wajib diisi.';
    end if;
    if p_bukti_path is null or length(btrim(p_bukti_path)) = 0 then
        raise exception 'Bukti transfer wajib diunggah.';
    end if;
    if p_status not in ('DIBAYAR', 'GAGAL_TRANSFER') then
        raise exception 'Pilih hasil transfer.';
    end if;
    select * into v_transfer from public.transfer_gaji
    where periode_gaji_id = p_periode_gaji_id and karyawan_id = p_karyawan_id
    for update;
    if not found then
        raise exception 'Karyawan ini belum masuk batch.';
    end if;
    if v_transfer.status = 'DIBAYAR' then
        raise exception 'Karyawan ini sudah dibayar; pembayaran kedua ditolak.';
    end if;

    insert into public.batch_transfer_gaji (
        periode_gaji_id, bukti_path, bukti_nama, bukti_tipe, bukti_ukuran, ulang, jumlah_karyawan, created_by
    ) values (
        p_periode_gaji_id, p_bukti_path, p_bukti_nama, p_bukti_tipe, p_bukti_ukuran, true, 1, auth.uid()
    ) returning id into v_batch;
    update public.transfer_gaji set status = p_status, updated_by = auth.uid(), updated_at = now() where id = v_transfer.id;
    insert into public.percobaan_transfer_gaji (transfer_gaji_id, batch_id, status, referensi, alasan, actor_id)
    values (v_transfer.id, v_batch, p_status, nullif(btrim(p_referensi), ''), btrim(p_alasan), auth.uid());

    perform public.gj006_perbarui_status(p_periode_gaji_id);
end;
$$;

-- AC-13: dana tidak cukup → tidak ada yang diproses, draft tetap disetujui.
create or replace function public.catat_dana_kurang(p_periode_gaji_id uuid, p_catatan text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
    perform public.gj006_siapkan_bayar(p_periode_gaji_id);
    insert into public.catatan_dana_gaji (periode_gaji_id, catatan, actor_id)
    values (p_periode_gaji_id, coalesce(nullif(btrim(p_catatan), ''), 'Dana tidak cukup'), auth.uid());
end;
$$;

-- AC-09, AC-10: HR mencetak slip setelah karyawan itu dibayar. Cetakan pertama
-- menerbitkan slip; cetakan berikutnya dicatat sebagai cetak ulang.
create or replace function public.cetak_slip_gaji(p_periode_gaji_id uuid, p_karyawan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_slip uuid;
    v_cetakan integer;
begin
    perform public.gj_assert_peran('HR');
    if not exists (
        select 1 from public.transfer_gaji
        where periode_gaji_id = p_periode_gaji_id and karyawan_id = p_karyawan_id and status = 'DIBAYAR'
    ) then
        raise exception 'Slip belum bisa dicetak: pembayaran karyawan ini belum tercatat Dibayar.';
    end if;
    select id into v_slip from public.slip_gaji
    where periode_gaji_id = p_periode_gaji_id and karyawan_id = p_karyawan_id
    order by created_at desc limit 1;
    if v_slip is null then
        insert into public.slip_gaji (periode_gaji_id, karyawan_id, jenis, created_by)
        values (p_periode_gaji_id, p_karyawan_id, 'ASLI', auth.uid())
        returning id into v_slip;
    end if;
    select count(*) into v_cetakan from public.cetak_slip_gaji where slip_gaji_id = v_slip;
    insert into public.cetak_slip_gaji (slip_gaji_id, ulang, actor_id) values (v_slip, v_cetakan > 0, auth.uid());
    return v_slip;
end;
$$;

-- AC-14: slip pengganti dengan alasan; slip lama tetap ada.
create or replace function public.slip_pengganti_gaji(p_periode_gaji_id uuid, p_karyawan_id uuid, p_alasan text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_lama uuid;
    v_baru uuid;
begin
    perform public.gj_assert_peran('HR');
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan slip pengganti wajib diisi.';
    end if;
    select id into v_lama from public.slip_gaji
    where periode_gaji_id = p_periode_gaji_id and karyawan_id = p_karyawan_id
    order by created_at desc limit 1;
    if v_lama is null then
        raise exception 'Belum ada slip yang terbit untuk diganti.';
    end if;
    insert into public.slip_gaji (periode_gaji_id, karyawan_id, jenis, alasan, menggantikan_id, created_by)
    values (p_periode_gaji_id, p_karyawan_id, 'PENGGANTI', btrim(p_alasan), v_lama, auth.uid())
    returning id into v_baru;
    return v_baru;
end;
$$;

-- ---------------------------------------------------------------------------
-- View baca (AC-17): nominal dan hasil untuk Finance, Accounting, HR; bukti untuk
-- Finance dan Accounting; slip untuk HR. Karyawan tidak punya akses (AC-16).

create or replace view public.transfer_gaji_aman
with (security_barrier = true)
as
select t.id, t.periode_gaji_id, t.karyawan_id, t.nominal::text as nominal, t.status, t.created_at, t.updated_at
from public.transfer_gaji t
where public.current_peran() in ('Finance', 'Accounting', 'HR');

create or replace view public.percobaan_transfer_aman
with (security_barrier = true)
as
select pc.id, t.periode_gaji_id, t.karyawan_id, pc.batch_id, pc.status, pc.referensi, pc.alasan,
       coalesce(pr.display_name, 'Finance') as oleh, pc.created_at
from public.percobaan_transfer_gaji pc
join public.transfer_gaji t on t.id = pc.transfer_gaji_id
left join public.profiles pr on pr.id = pc.actor_id
where public.current_peran() in ('Finance', 'Accounting', 'HR');

create or replace view public.batch_transfer_aman
with (security_barrier = true)
as
select b.id, b.periode_gaji_id,
       case when public.current_peran() in ('Finance', 'Accounting') then b.bukti_path end as bukti_path,
       b.bukti_nama, b.bukti_tipe, b.bukti_ukuran, b.ulang, b.jumlah_karyawan,
       coalesce(pr.display_name, 'Finance') as oleh, b.created_at
from public.batch_transfer_gaji b
left join public.profiles pr on pr.id = b.created_by
where public.current_peran() in ('Finance', 'Accounting', 'HR');

create or replace view public.catatan_dana_aman
with (security_barrier = true)
as
select c.id, c.periode_gaji_id, c.catatan, coalesce(pr.display_name, 'Finance') as oleh, c.created_at
from public.catatan_dana_gaji c
left join public.profiles pr on pr.id = c.actor_id
where public.current_peran() in ('Finance', 'Accounting', 'Manajemen');

create or replace view public.slip_gaji_aman
with (security_barrier = true)
as
select s.id, s.periode_gaji_id, s.karyawan_id, s.jenis, s.alasan, s.menggantikan_id,
       coalesce(pr.display_name, 'HR') as dibuat_oleh, s.created_at,
       coalesce((
           select jsonb_agg(jsonb_build_object('oleh', coalesce(p2.display_name, 'HR'), 'pada', c.created_at, 'ulang', c.ulang) order by c.created_at)
           from public.cetak_slip_gaji c left join public.profiles p2 on p2.id = c.actor_id
           where c.slip_gaji_id = s.id
       ), '[]'::jsonb) as cetakan
from public.slip_gaji s
left join public.profiles pr on pr.id = s.created_by
where public.current_peran() = 'HR';

-- ---------------------------------------------------------------------------
-- Akses

alter table public.batch_transfer_gaji enable row level security;
alter table public.transfer_gaji enable row level security;
alter table public.percobaan_transfer_gaji enable row level security;
alter table public.catatan_dana_gaji enable row level security;
alter table public.slip_gaji enable row level security;
alter table public.cetak_slip_gaji enable row level security;

revoke all on public.batch_transfer_gaji, public.transfer_gaji, public.percobaan_transfer_gaji,
    public.catatan_dana_gaji, public.slip_gaji, public.cetak_slip_gaji from anon, authenticated;
revoke all on public.transfer_gaji_aman, public.percobaan_transfer_aman, public.batch_transfer_aman,
    public.catatan_dana_aman, public.slip_gaji_aman from public, anon;
grant select on public.transfer_gaji_aman, public.percobaan_transfer_aman, public.batch_transfer_aman,
    public.catatan_dana_aman, public.slip_gaji_aman to authenticated;

create policy "Peran pembayaran baca transfer" on public.transfer_gaji
    for select to authenticated using (public.current_peran() in ('Finance', 'Accounting', 'HR'));
create policy "Peran pembayaran baca batch" on public.batch_transfer_gaji
    for select to authenticated using (public.current_peran() in ('Finance', 'Accounting', 'HR'));
create policy "Peran pembayaran baca percobaan" on public.percobaan_transfer_gaji
    for select to authenticated using (public.current_peran() in ('Finance', 'Accounting', 'HR'));
create policy "Finance Accounting Manajemen baca catatan dana" on public.catatan_dana_gaji
    for select to authenticated using (public.current_peran() in ('Finance', 'Accounting', 'Manajemen'));
create policy "HR baca slip" on public.slip_gaji
    for select to authenticated using (public.current_peran() = 'HR');
create policy "HR baca cetak slip" on public.cetak_slip_gaji
    for select to authenticated using (public.current_peran() = 'HR');

revoke all on function public.gj006_siapkan_bayar(uuid) from public, anon, authenticated;
revoke all on function public.gj006_perbarui_status(uuid) from public, anon, authenticated;
revoke all on function public.gj006_neto(uuid, uuid) from public, anon, authenticated;
revoke all on function public.kirim_batch_gaji(uuid, text, text, text, integer, jsonb) from public, anon;
revoke all on function public.ulang_transfer_gaji(uuid, uuid, text, text, text, text, text, text, integer) from public, anon;
revoke all on function public.catat_dana_kurang(uuid, text) from public, anon;
revoke all on function public.cetak_slip_gaji(uuid, uuid) from public, anon;
revoke all on function public.slip_pengganti_gaji(uuid, uuid, text) from public, anon;
grant execute on function public.kirim_batch_gaji(uuid, text, text, text, integer, jsonb) to authenticated;
grant execute on function public.ulang_transfer_gaji(uuid, uuid, text, text, text, text, text, text, integer) to authenticated;
grant execute on function public.catat_dana_kurang(uuid, text) to authenticated;
grant execute on function public.cetak_slip_gaji(uuid, uuid) to authenticated;
grant execute on function public.slip_pengganti_gaji(uuid, uuid, text) to authenticated;
