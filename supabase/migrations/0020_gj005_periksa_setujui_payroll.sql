-- GJ-005: Accounting memeriksa draft payroll, Direksi menyetujui dan mengunci,
-- keduanya bisa mengembalikan dengan alasan. Nomor 0020 menunggu persetujuan
-- tech lead (D-09). Tidak ada tabel baru: status di dokumen PERIODE_GAJI (0007).
--   DRAFT_TERHITUNG -PERIKSA-> DIPERIKSA -SETUJUI-> DISETUJUI (terkunci)
--   DIPERIKSA -REVISI-> REVISI (alasan wajib)
-- Tidak ada fungsi buka kunci (AC-12); koreksi setelah disetujui lewat jurnal pembalik.
-- Jurnal akrual saat persetujuan (AC-02) menunggu akun utang BPJS, utang PPh 21,
-- dan selisih pembulatan di COA; lihat 05-evidence.md.

-- Guard bersama: peran, status yang diharapkan, dan bukan penghitung draft (D-48).
create or replace function public.gj005_siapkan(p_periode_gaji_id uuid, p_dari text)
returns table (dokumen_id uuid, versi bigint, tanggal_selesai date, nama text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
    v_penghitung uuid;
begin
    select p.nama, p.tanggal_selesai, d.id as dok_id, d.status, d.versi into v
    from public.periode_gaji p join public.dokumen d on d.id = p.dokumen_id
    where p.id = p_periode_gaji_id
    for update of p;
    if not found then
        raise exception 'Draft payroll tidak ditemukan.';
    end if;
    select created_by into v_penghitung from public.draft_payroll where periode_gaji_id = p_periode_gaji_id;
    if v_penghitung is null then
        raise exception 'Draft payroll tidak ditemukan.';
    end if;
    if v_penghitung = auth.uid() then
        raise exception 'Pemohon tidak boleh memeriksa atau menyetujui draft yang dihitungnya sendiri.' using errcode = '42501';
    end if;
    if v.status in ('DISETUJUI', 'DIBAYAR', 'GAGAL_TRANSFER', 'DIPOSTING') then
        raise exception 'Draft sudah disetujui dan dikunci.';
    end if;
    if v.status <> p_dari then
        if p_dari = 'DIPERIKSA' and v.status = 'DRAFT_TERHITUNG' then
            raise exception 'Persetujuan ditolak: pemeriksaan Accounting belum dilakukan.';
        end if;
        raise exception 'Tindakan ini tidak berlaku untuk draft berstatus %.', v.status;
    end if;
    return query select v.dok_id, v.versi, v.tanggal_selesai, v.nama;
end;
$$;

create or replace function public.periksa_payroll(p_periode_gaji_id uuid, p_catatan text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
begin
    perform public.gj_assert_peran('Accounting');
    select * into v from public.gj005_siapkan(p_periode_gaji_id, 'DRAFT_TERHITUNG');
    -- periksa_dokumen menyalin aturan approval (Direksi level 1, seed 0010) ke dokumen.
    perform public.periksa_dokumen(
        v.dokumen_id, v.versi, auth.uid(),
        coalesce(nullif(btrim(p_catatan), ''), 'Diperiksa dan diteruskan ke Direksi')
    );
end;
$$;

-- AC-08: persetujuan ditolak bila bulan akuntansi akhir periode sudah dikunci.
create or replace function public.setujui_payroll(p_periode_gaji_id uuid, p_catatan text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
begin
    perform public.gj_assert_peran('Direksi');
    select * into v from public.gj005_siapkan(p_periode_gaji_id, 'DIPERIKSA');
    if exists (
        select 1 from public.periode_akuntansi
        where tahun = extract(year from v.tanggal_selesai)::int
          and bulan = extract(month from v.tanggal_selesai)::int
          and status = 'kunci'
    ) then
        raise exception 'Persetujuan ditolak: periode akuntansi % sudah ditutup.', to_char(v.tanggal_selesai, 'MM/YYYY');
    end if;
    -- setujui_dokumen memeriksa peran per level dan mengunci pada level terakhir.
    perform public.setujui_dokumen(
        v.dokumen_id, v.versi, auth.uid(),
        coalesce(nullif(btrim(p_catatan), ''), 'Disetujui dan dikunci')
    );
end;
$$;

create or replace function public.kembalikan_payroll(p_periode_gaji_id uuid, p_alasan text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v record;
begin
    perform public.gj_assert_peran('Accounting', 'Direksi');
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pengembalian wajib diisi.';
    end if;
    select * into v from public.gj005_siapkan(p_periode_gaji_id, 'DIPERIKSA');
    perform public.pindah_status_dokumen(v.dokumen_id, v.versi, 'REVISI', 'REVISI', auth.uid(), btrim(p_alasan));
end;
$$;

revoke all on function public.gj005_siapkan(uuid, text) from public, anon, authenticated;
revoke all on function public.periksa_payroll(uuid, text) from public, anon;
revoke all on function public.setujui_payroll(uuid, text) from public, anon;
revoke all on function public.kembalikan_payroll(uuid, text) from public, anon;
grant execute on function public.periksa_payroll(uuid, text) to authenticated;
grant execute on function public.setujui_payroll(uuid, text) to authenticated;
grant execute on function public.kembalikan_payroll(uuid, text) to authenticated;
