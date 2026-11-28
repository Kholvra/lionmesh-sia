-- PG-010: rekonsiliasi bank.
--
-- Import mutasi CSV dengan pemetaan kolom, cocokkan 1:1 dengan baris jurnal
-- akun kas_bank, dan tandai selisih. Rekonsiliasi tidak membuat jurnal dan
-- tidak mengubah saldo.

-- ---------------------------------------------------------------------------
-- Konfigurasi dan profil pemetaan
-- ---------------------------------------------------------------------------

create table public.konfigurasi_rekonsiliasi (
    id uuid primary key default gen_random_uuid(),
    jendela_hari integer not null default 3,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_konfigurasi_rekonsiliasi_jendela check (jendela_hari between 0 and 31)
);

create table public.profil_pemetaan_bank (
    id uuid primary key default gen_random_uuid(),
    nama text not null,
    rekening_bank_id uuid references public.rekening_bank (id),
    pemetaan jsonb not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_profil_pemetaan_nama_not_blank check (length(btrim(nama)) > 0)
);

create unique index uq_profil_pemetaan_nama on public.profil_pemetaan_bank (lower(btrim(nama)));

-- ---------------------------------------------------------------------------
-- Impor dan mutasi
-- ---------------------------------------------------------------------------

create table public.impor_mutasi_bank (
    id uuid primary key default gen_random_uuid(),
    rekening_bank_id uuid not null references public.rekening_bank (id),
    periode date not null,
    hash text not null,
    nama_berkas text not null,
    jumlah_baris integer not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    constraint ck_impor_mutasi_hash_not_blank check (length(btrim(hash)) > 0),
    constraint ck_impor_mutasi_jumlah check (jumlah_baris > 0)
);

create unique index uq_impor_mutasi_hash on public.impor_mutasi_bank (rekening_bank_id, hash);

create table public.mutasi_bank (
    id uuid primary key default gen_random_uuid(),
    impor_id uuid not null references public.impor_mutasi_bank (id),
    rekening_bank_id uuid not null references public.rekening_bank (id),
    tanggal date not null,
    arah text not null,
    nominal numeric(18,2) not null,
    referensi text,
    status text not null default 'BELUM_COCOK',
    alasan_selisih text,
    jurnal_detail_id uuid unique references public.detail_jurnal (id),
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_mutasi_arah check (arah in ('MASUK', 'KELUAR')),
    constraint ck_mutasi_nominal check (nominal > 0 and nominal = trunc(nominal)),
    constraint ck_mutasi_status check (status in ('BELUM_COCOK', 'COCOK', 'SELISIH'))
);

create index idx_mutasi_bank_periode on public.mutasi_bank (rekening_bank_id, tanggal);
create index idx_mutasi_bank_status on public.mutasi_bank (status);

create table public.mutasi_bank_riwayat (
    id uuid primary key default gen_random_uuid(),
    mutasi_id uuid not null references public.mutasi_bank (id),
    aksi text not null,
    status_asal text,
    status_tujuan text not null,
    alasan text,
    actor_id uuid not null,
    created_at timestamptz not null default now()
);

create index idx_mutasi_bank_riwayat on public.mutasi_bank_riwayat (mutasi_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.rekonsiliasi_jendela_hari()
returns integer
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select coalesce(
        (select jendela_hari from public.konfigurasi_rekonsiliasi where aktif order by created_at limit 1),
        0
    );
$$;

create or replace function public.rekonsiliasi_catat_riwayat(
    p_mutasi_id uuid,
    p_aksi text,
    p_status_asal text,
    p_status_tujuan text,
    p_alasan text,
    p_aktor_id uuid
)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
    insert into public.mutasi_bank_riwayat (
        mutasi_id, aksi, status_asal, status_tujuan, alasan, actor_id
    ) values (p_mutasi_id, p_aksi, p_status_asal, p_status_tujuan, p_alasan, p_aktor_id);
$$;

-- Auto-match one mutation to at most one kas_bank journal line (R-04).
create or replace function public.rekonsiliasi_cocokkan_satu(
    p_mutasi_id uuid,
    p_aktor_id uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_mutasi public.mutasi_bank;
    v_jendela integer := public.rekonsiliasi_jendela_hari();
    v_kandidat uuid[];
    v_jumlah integer;
begin
    select * into v_mutasi from public.mutasi_bank where id = p_mutasi_id for update;
    if not found then
        raise exception 'Mutasi bank tidak ditemukan.';
    end if;
    if v_mutasi.jurnal_detail_id is not null or v_mutasi.status = 'COCOK' then
        return 'COCOK';
    end if;

    select array_agg(dj.id) into v_kandidat
    from public.detail_jurnal dj
    join public.jurnal j on j.id = dj.jurnal_id
    join public.akun a on a.id = dj.akun_id
    where a.peran = 'kas_bank'
      and not exists (select 1 from public.mutasi_bank m where m.jurnal_detail_id = dj.id)
      and abs(dj.debit - dj.kredit) = v_mutasi.nominal
      and (
          (v_mutasi.arah = 'MASUK' and dj.debit = v_mutasi.nominal)
          or (v_mutasi.arah = 'KELUAR' and dj.kredit = v_mutasi.nominal)
      )
      and abs((j.tanggal at time zone 'Asia/Jakarta')::date - v_mutasi.tanggal) <= v_jendela
      and (
          v_mutasi.referensi is null
          or length(btrim(v_mutasi.referensi)) = 0
          or j.sumber_nomor is null
          or length(btrim(j.sumber_nomor)) = 0
          or lower(btrim(j.sumber_nomor)) = lower(btrim(v_mutasi.referensi))
      );

    v_jumlah := coalesce(array_length(v_kandidat, 1), 0);

    if v_jumlah = 1 then
        update public.mutasi_bank
        set jurnal_detail_id = v_kandidat[1],
            status = 'COCOK',
            alasan_selisih = null,
            updated_by = p_aktor_id,
            updated_at = now()
        where id = p_mutasi_id;

        perform public.rekonsiliasi_catat_riwayat(
            p_mutasi_id, 'COCOK', v_mutasi.status, 'COCOK', null, p_aktor_id
        );
        return 'COCOK';
    end if;

    return v_mutasi.status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Entry points
-- ---------------------------------------------------------------------------

create or replace function public.simpan_profil_pemetaan_bank(
    p_nama text,
    p_rekening_bank_id uuid,
    p_pemetaan jsonb,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_id uuid;
begin
    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama profil pemetaan wajib diisi';
    end if;
    if p_pemetaan is null or jsonb_typeof(p_pemetaan) <> 'object' then
        raise exception 'Pemetaan kolom tidak valid';
    end if;

    insert into public.profil_pemetaan_bank (
        nama, rekening_bank_id, pemetaan, created_by, updated_by
    ) values (
        btrim(p_nama), p_rekening_bank_id, p_pemetaan, v_aktor, v_aktor
    )
    on conflict (lower(btrim(nama))) do update
    set pemetaan = excluded.pemetaan,
        rekening_bank_id = excluded.rekening_bank_id,
        updated_by = excluded.updated_by,
        updated_at = now()
    returning id into v_id;

    return jsonb_build_object('profil_id', v_id);
end;
$$;

create or replace function public.impor_mutasi_bank(
    p_rekening_bank_id uuid,
    p_periode date,
    p_hash text,
    p_nama_berkas text,
    p_baris jsonb,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_periode date;
    v_impor_lama public.impor_mutasi_bank;
    v_impor_id uuid;
    v_i integer := 0;
    v_elem jsonb;
    v_tanggal date;
    v_nominal numeric(18,2);
    v_arah text;
    v_jumlah integer;
    v_cocok integer := 0;
    v_mutasi_id uuid;
    v_status text;
begin
    if p_periode is null then
        raise exception 'Periode rekonsiliasi wajib dipilih';
    end if;
    v_periode := date_trunc('month', p_periode)::date;

    if not exists (
        select 1 from public.rekening_bank where id = p_rekening_bank_id and aktif
    ) then
        raise exception 'Rekening bank tidak ditemukan atau nonaktif';
    end if;

    if p_hash is null or length(btrim(p_hash)) = 0 then
        raise exception 'Berkas impor tidak valid';
    end if;

    select * into v_impor_lama
    from public.impor_mutasi_bank
    where rekening_bank_id = p_rekening_bank_id and hash = btrim(p_hash);
    if found then
        raise exception 'Berkas ini sudah pernah diimpor pada % (berkas %)',
            to_char(v_impor_lama.created_at, 'YYYY-MM-DD'), v_impor_lama.nama_berkas;
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Berkas tidak memuat baris mutasi';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        begin
            v_tanggal := (v_elem->>'tanggal')::date;
        exception when others then
            raise exception 'Baris % tanggal tidak terbaca', v_i;
        end;

        v_arah := upper(btrim(coalesce(v_elem->>'arah', '')));
        if v_arah not in ('MASUK', 'KELUAR') then
            raise exception 'Baris % arah harus MASUK atau KELUAR', v_i;
        end if;

        begin
            v_nominal := (v_elem->>'nominal')::numeric(18,2);
        exception when others then
            raise exception 'Baris % nominal tidak terbaca', v_i;
        end;
        if v_nominal <= 0 or v_nominal <> trunc(v_nominal) then
            raise exception 'Baris % nominal harus bilangan bulat lebih dari nol', v_i;
        end if;

        if v_tanggal < v_periode or v_tanggal >= (v_periode + interval '1 month')::date then
            raise exception 'Baris % di luar periode %', v_i, to_char(v_periode, 'YYYY-MM');
        end if;
    end loop;

    insert into public.impor_mutasi_bank (
        rekening_bank_id, periode, hash, nama_berkas, jumlah_baris, created_by
    ) values (
        p_rekening_bank_id, v_periode, btrim(p_hash), btrim(p_nama_berkas),
        jsonb_array_length(p_baris), v_aktor
    ) returning id into v_impor_id;

    v_i := 0;
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        insert into public.mutasi_bank (
            impor_id, rekening_bank_id, tanggal, arah, nominal, referensi, created_by, updated_by
        ) values (
            v_impor_id,
            p_rekening_bank_id,
            (v_elem->>'tanggal')::date,
            upper(btrim(v_elem->>'arah')),
            (v_elem->>'nominal')::numeric(18,2),
            nullif(btrim(coalesce(v_elem->>'referensi', '')), ''),
            v_aktor,
            v_aktor
        ) returning id into v_mutasi_id;

        perform public.rekonsiliasi_catat_riwayat(
            v_mutasi_id, 'IMPOR', null, 'BELUM_COCOK', null, v_aktor
        );

        v_status := public.rekonsiliasi_cocokkan_satu(v_mutasi_id, v_aktor);
        if v_status = 'COCOK' then
            v_cocok := v_cocok + 1;
        end if;
    end loop;

    select count(*) into v_jumlah from public.mutasi_bank where impor_id = v_impor_id;

    return jsonb_build_object(
        'impor_id', v_impor_id,
        'jumlah_baris', v_jumlah,
        'cocok', v_cocok,
        'belum_cocok', v_jumlah - v_cocok
    );
end;
$$;

create or replace function public.cocokkan_mutasi_bank(
    p_mutasi_id uuid,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_status text;
begin
    v_status := public.rekonsiliasi_cocokkan_satu(p_mutasi_id, v_aktor);
    return jsonb_build_object('status', v_status);
end;
$$;

create or replace function public.pasangkan_mutasi_bank(
    p_mutasi_id uuid,
    p_jurnal_detail_id uuid,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_mutasi public.mutasi_bank;
    v_detail public.detail_jurnal;
    v_jurnal public.jurnal;
    v_akun public.akun;
begin
    select * into v_mutasi from public.mutasi_bank where id = p_mutasi_id for update;
    if not found then
        raise exception 'Mutasi bank tidak ditemukan.';
    end if;
    if v_mutasi.jurnal_detail_id is not null then
        raise exception 'Mutasi ini sudah berpasangan';
    end if;

    select * into v_detail from public.detail_jurnal where id = p_jurnal_detail_id for update;
    if not found then
        raise exception 'Baris jurnal tidak ditemukan.';
    end if;

    if exists (select 1 from public.mutasi_bank where jurnal_detail_id = p_jurnal_detail_id) then
        raise exception 'Baris jurnal ini sudah berpasangan dengan mutasi lain';
    end if;

    select * into v_jurnal from public.jurnal where id = v_detail.jurnal_id;
    select * into v_akun from public.akun where id = v_detail.akun_id;
    if v_akun.peran is distinct from 'kas_bank' then
        raise exception 'Baris jurnal bukan akun kas bank';
    end if;

    if abs(v_detail.debit - v_detail.kredit) <> v_mutasi.nominal then
        raise exception 'Nominal mutasi tidak sama dengan baris jurnal';
    end if;
    if v_mutasi.arah = 'MASUK' and v_detail.debit = 0 then
        raise exception 'Arah mutasi tidak sesuai sisi jurnal';
    end if;
    if v_mutasi.arah = 'KELUAR' and v_detail.kredit = 0 then
        raise exception 'Arah mutasi tidak sesuai sisi jurnal';
    end if;

    update public.mutasi_bank
    set jurnal_detail_id = p_jurnal_detail_id,
        status = 'COCOK',
        alasan_selisih = null,
        updated_by = v_aktor,
        updated_at = now()
    where id = p_mutasi_id;

    perform public.rekonsiliasi_catat_riwayat(
        p_mutasi_id, 'PASANG_MANUAL', v_mutasi.status, 'COCOK', null, v_aktor
    );

    return jsonb_build_object('status', 'COCOK', 'jurnal_id', v_jurnal.id);
end;
$$;

create or replace function public.tandai_selisih_mutasi_bank(
    p_mutasi_id uuid,
    p_alasan text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_mutasi public.mutasi_bank;
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan selisih wajib diisi';
    end if;

    select * into v_mutasi from public.mutasi_bank where id = p_mutasi_id for update;
    if not found then
        raise exception 'Mutasi bank tidak ditemukan.';
    end if;
    if v_mutasi.jurnal_detail_id is not null then
        raise exception 'Batalkan pasangan sebelum menandai selisih';
    end if;

    update public.mutasi_bank
    set status = 'SELISIH',
        alasan_selisih = btrim(p_alasan),
        updated_by = v_aktor,
        updated_at = now()
    where id = p_mutasi_id;

    perform public.rekonsiliasi_catat_riwayat(
        p_mutasi_id, 'SELISIH', v_mutasi.status, 'SELISIH', btrim(p_alasan), v_aktor
    );

    return jsonb_build_object('status', 'SELISIH');
end;
$$;

create or replace function public.lepas_pasangan_mutasi_bank(
    p_mutasi_id uuid,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_mutasi public.mutasi_bank;
begin
    select * into v_mutasi from public.mutasi_bank where id = p_mutasi_id for update;
    if not found then
        raise exception 'Mutasi bank tidak ditemukan.';
    end if;
    if v_mutasi.jurnal_detail_id is null then
        raise exception 'Mutasi ini belum berpasangan';
    end if;

    update public.mutasi_bank
    set jurnal_detail_id = null,
        status = 'BELUM_COCOK',
        updated_by = v_aktor,
        updated_at = now()
    where id = p_mutasi_id;

    perform public.rekonsiliasi_catat_riwayat(
        p_mutasi_id, 'LEPAS_PASANGAN', v_mutasi.status, 'BELUM_COCOK', null, v_aktor
    );

    return jsonb_build_object('status', 'BELUM_COCOK');
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.konfigurasi_rekonsiliasi enable row level security;
alter table public.profil_pemetaan_bank enable row level security;
alter table public.impor_mutasi_bank enable row level security;
alter table public.mutasi_bank enable row level security;
alter table public.mutasi_bank_riwayat enable row level security;

revoke all on public.konfigurasi_rekonsiliasi from anon, authenticated;
revoke all on public.profil_pemetaan_bank from anon, authenticated;
revoke all on public.impor_mutasi_bank from anon, authenticated;
revoke all on public.mutasi_bank from anon, authenticated;
revoke all on public.mutasi_bank_riwayat from anon, authenticated;

grant select on public.konfigurasi_rekonsiliasi to authenticated;
grant select on public.profil_pemetaan_bank to authenticated;
grant select on public.impor_mutasi_bank to authenticated;
grant select on public.mutasi_bank to authenticated;
grant select on public.mutasi_bank_riwayat to authenticated;
grant all on public.konfigurasi_rekonsiliasi to service_role;
grant all on public.profil_pemetaan_bank to service_role;
grant all on public.impor_mutasi_bank to service_role;
grant all on public.mutasi_bank to service_role;
grant all on public.mutasi_bank_riwayat to service_role;

create policy "Staf aktif boleh baca konfigurasi rekonsiliasi"
on public.konfigurasi_rekonsiliasi for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca profil pemetaan bank"
on public.profil_pemetaan_bank for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca impor mutasi bank"
on public.impor_mutasi_bank for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca mutasi bank"
on public.mutasi_bank for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca riwayat mutasi bank"
on public.mutasi_bank_riwayat for select to authenticated
using (public.is_active_staff());

revoke all on function public.rekonsiliasi_jendela_hari() from public, anon, authenticated;
revoke all on function public.rekonsiliasi_catat_riwayat(uuid, text, text, text, text, uuid)
from public, anon, authenticated;
revoke all on function public.rekonsiliasi_cocokkan_satu(uuid, uuid) from public, anon, authenticated;
revoke all on function public.simpan_profil_pemetaan_bank(text, uuid, jsonb, uuid)
from public, anon, authenticated;
revoke all on function public.impor_mutasi_bank(uuid, date, text, text, jsonb, uuid)
from public, anon, authenticated;
revoke all on function public.cocokkan_mutasi_bank(uuid, uuid) from public, anon, authenticated;
revoke all on function public.pasangkan_mutasi_bank(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.tandai_selisih_mutasi_bank(uuid, text, uuid)
from public, anon, authenticated;
revoke all on function public.lepas_pasangan_mutasi_bank(uuid, uuid) from public, anon, authenticated;

grant execute on function public.rekonsiliasi_jendela_hari() to service_role;
grant execute on function public.rekonsiliasi_catat_riwayat(uuid, text, text, text, text, uuid) to service_role;
grant execute on function public.rekonsiliasi_cocokkan_satu(uuid, uuid) to service_role;
grant execute on function public.simpan_profil_pemetaan_bank(text, uuid, jsonb, uuid) to service_role;
grant execute on function public.impor_mutasi_bank(uuid, date, text, text, jsonb, uuid) to service_role;
grant execute on function public.cocokkan_mutasi_bank(uuid, uuid) to service_role;
grant execute on function public.pasangkan_mutasi_bank(uuid, uuid, uuid) to service_role;
grant execute on function public.tandai_selisih_mutasi_bank(uuid, text, uuid) to service_role;
grant execute on function public.lepas_pasangan_mutasi_bank(uuid, uuid) to service_role;
