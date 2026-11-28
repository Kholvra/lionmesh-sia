-- C-011: master data terpadu — produk, gudang, satuan, kategori produk,
-- konversi satuan, mata uang, dan kurs.
-- Dasar tabel produk, gudang, dan satuan dibuat FND-002 (0002). Migrasi ini
-- menambah tipe produk (D-41), kategori, konversi, mata uang, dan kurs (D-38),
-- lalu memindahkan seluruh penulisan master ke fungsi core (D-04, D-25).
--
-- Catatan penyimpangan yang dicatat di paket C-011:
--   * master_riwayat_status tidak memakai foreign key per entitas karena satu
--     tabel melayani lima jenis master; integritas dijaga oleh fungsi penulis.
--   * Kurs hanya master. Dokumen dan jurnal tetap IDR (D-38).

-- 1. Kategori produk (D-38).
create table public.kategori_produk (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_kategori_produk_kode unique (kode),
    constraint ck_kategori_produk_nama_not_blank check (length(btrim(nama)) > 0)
);

create unique index uq_kategori_produk_kode_normalized
on public.kategori_produk (lower(btrim(kode)));

create index idx_kategori_produk_aktif on public.kategori_produk (aktif);

-- 2. Tipe produk (D-41) dan kategori pada produk.
alter table public.produk add column tipe text;
alter table public.produk add column kategori_id uuid;

update public.produk set tipe = 'bahan' where tipe is null;

alter table public.produk alter column tipe set not null;
alter table public.produk
    add constraint ck_produk_tipe
    check (tipe in ('bahan', 'barang_dalam_proses', 'barang_jadi'));
alter table public.produk
    add constraint fk_produk_kategori
    foreign key (kategori_id) references public.kategori_produk (id);

create index idx_produk_kategori_id on public.produk (kategori_id);

-- Kode unik tanpa memandang huruf besar/kecil dan spasi tepi (D-50).
create unique index uq_produk_kode_normalized on public.produk (lower(btrim(kode)));
create unique index uq_gudang_kode_normalized on public.gudang (lower(btrim(kode)));
create unique index uq_satuan_kode_normalized on public.satuan (lower(btrim(kode)));

-- 3. Konversi satuan (D-38).
create table public.konversi_satuan (
    id uuid primary key default gen_random_uuid(),
    satuan_dari_id uuid not null references public.satuan (id),
    satuan_ke_id uuid not null references public.satuan (id),
    faktor numeric(18, 6) not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_konversi_satuan_berbeda check (satuan_dari_id <> satuan_ke_id),
    constraint ck_konversi_satuan_faktor_positif check (faktor > 0)
);

create unique index uq_konversi_satuan_pasangan
on public.konversi_satuan (satuan_dari_id, satuan_ke_id);

-- 4. Mata uang dan kurs (master saja, D-38).
create table public.mata_uang (
    id uuid primary key default gen_random_uuid(),
    kode text not null,
    nama text not null,
    simbol text,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_mata_uang_kode unique (kode),
    constraint ck_mata_uang_kode_format check (kode ~ '^[A-Z]{3}$'),
    constraint ck_mata_uang_nama_not_blank check (length(btrim(nama)) > 0)
);

create index idx_mata_uang_aktif on public.mata_uang (aktif);

create table public.kurs (
    id uuid primary key default gen_random_uuid(),
    mata_uang_id uuid not null references public.mata_uang (id),
    tanggal date not null,
    nilai numeric(18, 6) not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_kurs_mata_uang_tanggal unique (mata_uang_id, tanggal),
    constraint ck_kurs_nilai_positif check (nilai > 0)
);

create index idx_kurs_tanggal on public.kurs (tanggal desc);

-- 5. Riwayat status master, append-only (D-50, DoD).
create table public.master_riwayat_status (
    id uuid primary key default gen_random_uuid(),
    entitas text not null,
    entitas_id uuid not null,
    aksi text not null,
    status_lama text,
    status_baru text not null,
    actor_id uuid not null references auth.users (id),
    -- clock_timestamp(), not now(): two changes in one transaction must keep
    -- their real order in the history trail.
    created_at timestamptz not null default clock_timestamp(),
    constraint ck_master_riwayat_entitas
        check (entitas in ('produk', 'kategori_produk', 'gudang', 'satuan', 'mata_uang')),
    constraint ck_master_riwayat_aksi
        check (aksi in ('BUAT', 'AKTIFKAN', 'NONAKTIFKAN')),
    constraint ck_master_riwayat_status_baru
        check (status_baru in ('aktif', 'nonaktif')),
    constraint ck_master_riwayat_buat
        check (
            (aksi <> 'BUAT' or status_lama is null)
            and (aksi = 'BUAT' or status_lama is not null)
        )
);

create index idx_master_riwayat_entitas
on public.master_riwayat_status (entitas, entitas_id, created_at, id);

create or replace function public.trg_master_riwayat_status_immutable()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Riwayat status master tidak bisa diubah atau dihapus.';
end;
$$;

create trigger trg_master_riwayat_status_immutable
before update or delete on public.master_riwayat_status
for each row
execute function public.trg_master_riwayat_status_immutable();

-- 6. Tampilan baca yang dipakai layar master dan modul pemakai.
create or replace view public.produk_master
with (security_barrier = true)
as
select
    p.id,
    p.kode,
    p.nama,
    p.tipe,
    p.satuan_dasar_id,
    s.kode as satuan_dasar_kode,
    s.nama as satuan_dasar_nama,
    p.kategori_id,
    k.kode as kategori_kode,
    k.nama as kategori_nama,
    p.aktif,
    p.created_at,
    p.updated_at
from public.produk p
join public.satuan s on s.id = p.satuan_dasar_id
left join public.kategori_produk k on k.id = p.kategori_id
where public.is_active_staff();

create or replace view public.konversi_satuan_master
with (security_barrier = true)
as
select
    ks.id,
    ks.satuan_dari_id,
    sd.kode as satuan_dari_kode,
    ks.satuan_ke_id,
    sk.kode as satuan_ke_kode,
    -- PostgREST serialises numeric as a JSON number, which loses precision.
    -- Cast to text so the client keeps the decimal string the database holds.
    trim(trailing '.' from trim(trailing '0' from ks.faktor::text)) as faktor,
    ks.created_at,
    ks.updated_at
from public.konversi_satuan ks
join public.satuan sd on sd.id = ks.satuan_dari_id
join public.satuan sk on sk.id = ks.satuan_ke_id
where public.is_active_staff();

create or replace view public.kurs_master
with (security_barrier = true)
as
select
    kr.id,
    kr.mata_uang_id,
    mu.kode as mata_uang_kode,
    kr.tanggal,
    trim(trailing '.' from trim(trailing '0' from kr.nilai::text)) as nilai,
    kr.created_at,
    kr.updated_at
from public.kurs kr
join public.mata_uang mu on mu.id = kr.mata_uang_id
where public.is_active_staff();

create or replace view public.master_riwayat
with (security_barrier = true)
as
select
    r.id,
    r.entitas,
    r.entitas_id,
    r.aksi,
    r.status_lama,
    r.status_baru,
    r.actor_id,
    coalesce(pr.display_name, 'Sistem') as actor_nama,
    r.created_at
from public.master_riwayat_status r
left join public.profiles pr on pr.id = r.actor_id
where public.is_active_staff();

-- 7. RLS: staf aktif boleh membaca, hanya core yang menulis.
alter table public.kategori_produk enable row level security;
alter table public.konversi_satuan enable row level security;
alter table public.mata_uang enable row level security;
alter table public.kurs enable row level security;
alter table public.master_riwayat_status enable row level security;

create policy "Staf aktif boleh baca kategori produk"
on public.kategori_produk for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca konversi satuan"
on public.konversi_satuan for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca mata uang"
on public.mata_uang for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca kurs"
on public.kurs for select
to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca riwayat status master"
on public.master_riwayat_status for select
to authenticated
using (public.is_active_staff());

revoke all on public.kategori_produk from anon, authenticated;
revoke all on public.konversi_satuan from anon, authenticated;
revoke all on public.mata_uang from anon, authenticated;
revoke all on public.kurs from anon, authenticated;
revoke all on public.master_riwayat_status from anon, authenticated;

grant select on public.kategori_produk to authenticated;
grant select on public.konversi_satuan to authenticated;
grant select on public.mata_uang to authenticated;
grant select on public.kurs to authenticated;

-- Master hanya boleh diubah lewat fungsi core (D-04, D-25). Kebijakan tulis
-- langsung dari 0003/0002 dicabut agar setiap perubahan melewati riwayat.
revoke insert, update, delete on public.produk from anon, authenticated;
revoke insert, update, delete on public.gudang from anon, authenticated;
revoke insert, update, delete on public.satuan from anon, authenticated;
grant select on public.produk to authenticated;
grant select on public.gudang to authenticated;
grant select on public.satuan to authenticated;

drop policy if exists "Produksi can insert satuan" on public.satuan;
drop policy if exists "Produksi can update satuan" on public.satuan;
drop policy if exists "Produksi can insert produk" on public.produk;
drop policy if exists "Produksi can update produk" on public.produk;
drop policy if exists "Gudang can insert gudang" on public.gudang;
drop policy if exists "Gudang can update gudang" on public.gudang;

revoke all on public.produk_master from public, anon;
revoke all on public.konversi_satuan_master from public, anon;
revoke all on public.kurs_master from public, anon;
revoke all on public.master_riwayat from public, anon;
grant select on public.produk_master to authenticated;
grant select on public.konversi_satuan_master to authenticated;
grant select on public.kurs_master to authenticated;
grant select on public.master_riwayat to authenticated;

-- 8. Penjaga peran pengelola master (PT-06, D-33).
create or replace function public.c011_assert_pengelola(p_entitas text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_peran text := public.current_peran();
    v_label text;
begin
    if auth.uid() is null or v_peran is null then
        raise exception 'Sesi Anda sudah berakhir. Silakan masuk lagi.' using errcode = '42501';
    end if;

    v_label := case p_entitas
        when 'kategori_produk' then 'kategori produk'
        when 'mata_uang' then 'mata uang'
        else p_entitas
    end;

    if p_entitas in ('produk', 'kategori_produk', 'satuan')
       and v_peran is distinct from 'Produksi' then
        raise exception 'Anda tidak punya izin mengubah master %.', v_label using errcode = '42501';
    end if;

    if p_entitas = 'gudang' and v_peran is distinct from 'Gudang' then
        raise exception 'Anda tidak punya izin mengubah master %.', v_label using errcode = '42501';
    end if;

    if p_entitas = 'mata_uang' and v_peran is distinct from 'Accounting' then
        raise exception 'Anda tidak punya izin mengubah master %.', v_label using errcode = '42501';
    end if;
end;
$$;

revoke all on function public.c011_assert_pengelola(text) from public, anon;
grant execute on function public.c011_assert_pengelola(text) to authenticated;

-- Sudah dipakai dokumen atau transaksi? Dipakai untuk menjaga kode (INV-03).
create or replace function public.c011_kode_terpakai(p_entitas text, p_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = pg_catalog, public, auth
as $$
begin
    return case p_entitas
        when 'produk' then exists (
            select 1 from public.mutasi_stok where produk_id = p_id
            union all
            select 1 from public.saldo_stok where produk_id = p_id
        )
        when 'gudang' then exists (
            select 1 from public.mutasi_stok where gudang_id = p_id
            union all
            select 1 from public.saldo_stok where gudang_id = p_id
        )
        when 'satuan' then exists (
            select 1 from public.produk where satuan_dasar_id = p_id
            union all
            select 1 from public.konversi_satuan where satuan_dari_id = p_id or satuan_ke_id = p_id
        )
        when 'kategori_produk' then exists (
            select 1 from public.produk where kategori_id = p_id
        )
        when 'mata_uang' then exists (
            select 1 from public.kurs where mata_uang_id = p_id
        )
        else false
    end;
end;
$$;

revoke all on function public.c011_kode_terpakai(text, uuid) from public, anon;
grant execute on function public.c011_kode_terpakai(text, uuid) to authenticated;

-- 9. Produk.
create or replace function public.simpan_produk(
    p_id uuid,
    p_kode text,
    p_nama text,
    p_tipe text,
    p_satuan_dasar_id uuid,
    p_kategori_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_kode_lama text;
    v_lama record;
    v_satuan record;
begin
    perform public.c011_assert_pengelola('produk');

    if p_kode is null or length(btrim(p_kode)) = 0 then
        raise exception 'Kode produk wajib diisi.';
    end if;

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama produk wajib diisi.';
    end if;

    if p_tipe is null or p_tipe not in ('bahan', 'barang_dalam_proses', 'barang_jadi') then
        raise exception 'Tipe produk harus bahan, barang dalam proses, atau barang jadi.';
    end if;

    if p_satuan_dasar_id is null then
        raise exception 'Satuan dasar wajib dipilih.';
    end if;

    -- PRE-02: satuan baru harus aktif. Entri lama yang satuannya kemudian
    -- dinonaktifkan tetap boleh disimpan apa adanya.
    select kode, aktif into v_satuan
    from public.satuan
    where id = p_satuan_dasar_id;

    if not found then
        raise exception 'Satuan dasar tidak ditemukan.';
    end if;

    if v_id is not null then
        select kode, satuan_dasar_id, kategori_id into v_lama
        from public.produk
        where id = v_id
        for update;

        if not found then
            raise exception 'Produk tidak ditemukan.';
        end if;
    end if;

    if not v_satuan.aktif then
        if v_id is null then
            raise exception 'Satuan dasar % nonaktif.', v_satuan.kode;
        end if;
        if v_lama.satuan_dasar_id is distinct from p_satuan_dasar_id then
            raise exception 'Satuan dasar % nonaktif.', v_satuan.kode;
        end if;
    end if;

    if p_kategori_id is not null then
        if v_id is null then
            if not exists (
                select 1 from public.kategori_produk
                where id = p_kategori_id and aktif
            ) then
                raise exception 'Kategori produk tidak ditemukan atau nonaktif.';
            end if;
        elsif v_lama.kategori_id is distinct from p_kategori_id
              and not exists (
                  select 1 from public.kategori_produk
                  where id = p_kategori_id and aktif
              ) then
            raise exception 'Kategori produk tidak ditemukan atau nonaktif.';
        end if;
    end if;

    if v_id is null then
        insert into public.produk (
            kode, nama, tipe, satuan_dasar_id, kategori_id, aktif, created_by, updated_by
        )
        values (
            btrim(p_kode), btrim(p_nama), p_tipe, p_satuan_dasar_id, p_kategori_id,
            true, v_actor, v_actor
        )
        returning id into v_id;

        insert into public.master_riwayat_status (entitas, entitas_id, aksi, status_lama, status_baru, actor_id)
        values ('produk', v_id, 'BUAT', null, 'aktif', v_actor);

        return v_id;
    end if;

    v_kode_lama := v_lama.kode;

    if v_kode_lama is distinct from btrim(p_kode)
       and public.c011_kode_terpakai('produk', v_id) then
        raise exception 'Kode % tidak dapat diubah karena produk sudah dipakai dokumen.', v_kode_lama;
    end if;

    update public.produk
    set kode = btrim(p_kode),
        nama = btrim(p_nama),
        tipe = p_tipe,
        satuan_dasar_id = p_satuan_dasar_id,
        kategori_id = p_kategori_id,
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    return v_id;
exception
    when unique_violation then
        raise exception 'Kode % sudah dipakai.', btrim(p_kode);
end;
$$;

revoke all on function public.simpan_produk(uuid, text, text, text, uuid, uuid) from public, anon;
grant execute on function public.simpan_produk(uuid, text, text, text, uuid, uuid) to authenticated;

-- 10. Kategori produk.
create or replace function public.simpan_kategori_produk(
    p_id uuid,
    p_kode text,
    p_nama text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_kode_lama text;
begin
    perform public.c011_assert_pengelola('kategori_produk');

    if p_kode is null or length(btrim(p_kode)) = 0 then
        raise exception 'Kode kategori wajib diisi.';
    end if;

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama kategori wajib diisi.';
    end if;

    if v_id is null then
        insert into public.kategori_produk (kode, nama, aktif, created_by, updated_by)
        values (btrim(p_kode), btrim(p_nama), true, v_actor, v_actor)
        returning id into v_id;

        insert into public.master_riwayat_status (entitas, entitas_id, aksi, status_lama, status_baru, actor_id)
        values ('kategori_produk', v_id, 'BUAT', null, 'aktif', v_actor);

        return v_id;
    end if;

    select kode into v_kode_lama from public.kategori_produk where id = v_id for update;

    if not found then
        raise exception 'Kategori produk tidak ditemukan.';
    end if;

    if v_kode_lama is distinct from btrim(p_kode)
       and public.c011_kode_terpakai('kategori_produk', v_id) then
        raise exception 'Kode % tidak dapat diubah karena kategori sudah dipakai produk.', v_kode_lama;
    end if;

    update public.kategori_produk
    set kode = btrim(p_kode),
        nama = btrim(p_nama),
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    return v_id;
exception
    when unique_violation then
        raise exception 'Kode % sudah dipakai.', btrim(p_kode);
end;
$$;

revoke all on function public.simpan_kategori_produk(uuid, text, text) from public, anon;
grant execute on function public.simpan_kategori_produk(uuid, text, text) to authenticated;

-- 11. Gudang.
create or replace function public.simpan_gudang(
    p_id uuid,
    p_kode text,
    p_nama text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_kode_lama text;
begin
    perform public.c011_assert_pengelola('gudang');

    if p_kode is null or length(btrim(p_kode)) = 0 then
        raise exception 'Kode gudang wajib diisi.';
    end if;

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama gudang wajib diisi.';
    end if;

    if v_id is null then
        insert into public.gudang (kode, nama, aktif, created_by, updated_by)
        values (btrim(p_kode), btrim(p_nama), true, v_actor, v_actor)
        returning id into v_id;

        insert into public.master_riwayat_status (entitas, entitas_id, aksi, status_lama, status_baru, actor_id)
        values ('gudang', v_id, 'BUAT', null, 'aktif', v_actor);

        return v_id;
    end if;

    select kode into v_kode_lama from public.gudang where id = v_id for update;

    if not found then
        raise exception 'Gudang tidak ditemukan.';
    end if;

    if v_kode_lama is distinct from btrim(p_kode)
       and public.c011_kode_terpakai('gudang', v_id) then
        raise exception 'Kode % tidak dapat diubah karena gudang sudah dipakai dokumen.', v_kode_lama;
    end if;

    update public.gudang
    set kode = btrim(p_kode),
        nama = btrim(p_nama),
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    return v_id;
exception
    when unique_violation then
        raise exception 'Kode % sudah dipakai.', btrim(p_kode);
end;
$$;

revoke all on function public.simpan_gudang(uuid, text, text) from public, anon;
grant execute on function public.simpan_gudang(uuid, text, text) to authenticated;

-- 12. Satuan.
create or replace function public.simpan_satuan(
    p_id uuid,
    p_kode text,
    p_nama text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_kode_lama text;
begin
    perform public.c011_assert_pengelola('satuan');

    if p_kode is null or length(btrim(p_kode)) = 0 then
        raise exception 'Kode satuan wajib diisi.';
    end if;

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama satuan wajib diisi.';
    end if;

    if v_id is null then
        insert into public.satuan (kode, nama, aktif, created_by, updated_by)
        values (btrim(p_kode), btrim(p_nama), true, v_actor, v_actor)
        returning id into v_id;

        insert into public.master_riwayat_status (entitas, entitas_id, aksi, status_lama, status_baru, actor_id)
        values ('satuan', v_id, 'BUAT', null, 'aktif', v_actor);

        return v_id;
    end if;

    select kode into v_kode_lama from public.satuan where id = v_id for update;

    if not found then
        raise exception 'Satuan tidak ditemukan.';
    end if;

    if v_kode_lama is distinct from btrim(p_kode)
       and public.c011_kode_terpakai('satuan', v_id) then
        raise exception 'Kode % tidak dapat diubah karena satuan sudah dipakai.', v_kode_lama;
    end if;

    update public.satuan
    set kode = btrim(p_kode),
        nama = btrim(p_nama),
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    return v_id;
exception
    when unique_violation then
        raise exception 'Kode % sudah dipakai.', btrim(p_kode);
end;
$$;

revoke all on function public.simpan_satuan(uuid, text, text) from public, anon;
grant execute on function public.simpan_satuan(uuid, text, text) to authenticated;

-- 13. Konversi satuan.
create or replace function public.simpan_konversi_satuan(
    p_id uuid,
    p_satuan_dari_id uuid,
    p_satuan_ke_id uuid,
    p_faktor numeric
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_dari record;
    v_ke record;
begin
    perform public.c011_assert_pengelola('satuan');

    if p_satuan_dari_id is null then
        raise exception 'Satuan asal wajib dipilih.';
    end if;

    if p_satuan_ke_id is null then
        raise exception 'Satuan tujuan wajib dipilih.';
    end if;

    if p_satuan_dari_id = p_satuan_ke_id then
        raise exception 'Satuan asal dan satuan tujuan harus berbeda.';
    end if;

    if p_faktor is null or p_faktor <= 0 then
        raise exception 'Faktor konversi harus lebih dari nol.';
    end if;

    select kode, aktif into v_dari from public.satuan where id = p_satuan_dari_id;
    if not found then
        raise exception 'Satuan asal tidak ditemukan.';
    end if;
    if not v_dari.aktif then
        raise exception 'Satuan asal % nonaktif.', v_dari.kode;
    end if;

    select kode, aktif into v_ke from public.satuan where id = p_satuan_ke_id;
    if not found then
        raise exception 'Satuan tujuan tidak ditemukan.';
    end if;
    if not v_ke.aktif then
        raise exception 'Satuan tujuan % nonaktif.', v_ke.kode;
    end if;

    if v_id is null then
        insert into public.konversi_satuan (
            satuan_dari_id, satuan_ke_id, faktor, created_by, updated_by
        )
        values (p_satuan_dari_id, p_satuan_ke_id, p_faktor, v_actor, v_actor)
        returning id into v_id;

        return v_id;
    end if;

    update public.konversi_satuan
    set satuan_dari_id = p_satuan_dari_id,
        satuan_ke_id = p_satuan_ke_id,
        faktor = p_faktor,
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    if not found then
        raise exception 'Konversi satuan tidak ditemukan.';
    end if;

    return v_id;
exception
    when unique_violation then
        raise exception 'Konversi % ke % sudah tercatat.', v_dari.kode, v_ke.kode;
end;
$$;

revoke all on function public.simpan_konversi_satuan(uuid, uuid, uuid, numeric) from public, anon;
grant execute on function public.simpan_konversi_satuan(uuid, uuid, uuid, numeric) to authenticated;

-- 14. Mata uang dan kurs.
create or replace function public.simpan_mata_uang(
    p_id uuid,
    p_kode text,
    p_nama text,
    p_simbol text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_kode text := upper(btrim(coalesce(p_kode, '')));
    v_kode_lama text;
begin
    perform public.c011_assert_pengelola('mata_uang');

    if length(v_kode) = 0 then
        raise exception 'Kode mata uang wajib diisi.';
    end if;

    if v_kode !~ '^[A-Z]{3}$' then
        raise exception 'Kode mata uang harus 3 huruf, contoh USD.';
    end if;

    if p_nama is null or length(btrim(p_nama)) = 0 then
        raise exception 'Nama mata uang wajib diisi.';
    end if;

    if v_id is null then
        insert into public.mata_uang (kode, nama, simbol, aktif, created_by, updated_by)
        values (v_kode, btrim(p_nama), nullif(btrim(p_simbol), ''), true, v_actor, v_actor)
        returning id into v_id;

        insert into public.master_riwayat_status (entitas, entitas_id, aksi, status_lama, status_baru, actor_id)
        values ('mata_uang', v_id, 'BUAT', null, 'aktif', v_actor);

        return v_id;
    end if;

    select kode into v_kode_lama from public.mata_uang where id = v_id for update;

    if not found then
        raise exception 'Mata uang tidak ditemukan.';
    end if;

    if v_kode_lama is distinct from v_kode
       and public.c011_kode_terpakai('mata_uang', v_id) then
        raise exception 'Kode % tidak dapat diubah karena mata uang sudah punya kurs.', v_kode_lama;
    end if;

    update public.mata_uang
    set kode = v_kode,
        nama = btrim(p_nama),
        simbol = nullif(btrim(p_simbol), ''),
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    return v_id;
exception
    when unique_violation then
        raise exception 'Kode mata uang % sudah dipakai.', v_kode;
end;
$$;

revoke all on function public.simpan_mata_uang(uuid, text, text, text) from public, anon;
grant execute on function public.simpan_mata_uang(uuid, text, text, text) to authenticated;

create or replace function public.simpan_kurs(
    p_id uuid,
    p_mata_uang_id uuid,
    p_tanggal date,
    p_nilai numeric
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_actor uuid := auth.uid();
    v_id uuid := p_id;
    v_kode record;
begin
    perform public.c011_assert_pengelola('mata_uang');

    if p_mata_uang_id is null then
        raise exception 'Mata uang wajib dipilih.';
    end if;

    if p_tanggal is null then
        raise exception 'Tanggal kurs wajib diisi.';
    end if;

    if p_nilai is null or p_nilai <= 0 then
        raise exception 'Nilai kurs harus lebih dari nol.';
    end if;

    select kode, aktif into v_kode from public.mata_uang where id = p_mata_uang_id;
    if not found then
        raise exception 'Mata uang tidak ditemukan.';
    end if;
    if not v_kode.aktif then
        raise exception 'Mata uang % nonaktif.', v_kode.kode;
    end if;

    if v_id is null then
        insert into public.kurs (mata_uang_id, tanggal, nilai, created_by, updated_by)
        values (p_mata_uang_id, p_tanggal, p_nilai, v_actor, v_actor)
        returning id into v_id;

        return v_id;
    end if;

    update public.kurs
    set mata_uang_id = p_mata_uang_id,
        tanggal = p_tanggal,
        nilai = p_nilai,
        updated_by = v_actor,
        updated_at = now()
    where id = v_id;

    if not found then
        raise exception 'Kurs tidak ditemukan.';
    end if;

    return v_id;
exception
    when unique_violation then
        raise exception 'Kurs % tanggal % sudah tercatat.', v_kode.kode, p_tanggal;
end;
$$;

revoke all on function public.simpan_kurs(uuid, uuid, date, numeric) from public, anon;
grant execute on function public.simpan_kurs(uuid, uuid, date, numeric) to authenticated;

-- 15. Aktivasi dan penonaktifan berlaku untuk semua master (D-50, PT-07).
create or replace function public.set_status_master(
    p_entitas text,
    p_id uuid,
    p_aktif boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_tabel text;
    v_actor uuid := auth.uid();
    v_status_lama boolean;
    v_status_baru text;
begin
    v_tabel := case p_entitas
        when 'produk' then 'produk'
        when 'kategori_produk' then 'kategori_produk'
        when 'gudang' then 'gudang'
        when 'satuan' then 'satuan'
        when 'mata_uang' then 'mata_uang'
        else null
    end;

    if v_tabel is null then
        raise exception 'Entitas master tidak dikenal.';
    end if;

    perform public.c011_assert_pengelola(p_entitas);

    if p_id is null or p_aktif is null then
        raise exception 'Entri master tidak ditemukan.';
    end if;

    execute format('select aktif from public.%I where id = $1 for update', v_tabel)
    into v_status_lama
    using p_id;

    if not found then
        raise exception 'Entri master tidak ditemukan.';
    end if;

    if v_status_lama = p_aktif then
        raise exception 'Entri master sudah %.', case when p_aktif then 'aktif' else 'nonaktif' end;
    end if;

    execute format(
        'update public.%I set aktif = $1, updated_by = $2, updated_at = now() where id = $3',
        v_tabel
    )
    using p_aktif, v_actor, p_id;

    v_status_baru := case when p_aktif then 'aktif' else 'nonaktif' end;

    insert into public.master_riwayat_status (entitas, entitas_id, aksi, status_lama, status_baru, actor_id)
    values (
        p_entitas,
        p_id,
        case when p_aktif then 'AKTIFKAN' else 'NONAKTIFKAN' end,
        case when v_status_lama then 'aktif' else 'nonaktif' end,
        v_status_baru,
        v_actor
    );
end;
$$;

revoke all on function public.set_status_master(text, uuid, boolean) from public, anon;
grant execute on function public.set_status_master(text, uuid, boolean) to authenticated;

-- 16. Hak service_role untuk uji lokal dan seed.
grant all on public.kategori_produk to service_role;
grant all on public.konversi_satuan to service_role;
grant all on public.mata_uang to service_role;
grant all on public.kurs to service_role;
grant all on public.master_riwayat_status to service_role;
grant select on public.produk_master to service_role;
grant select on public.konversi_satuan_master to service_role;
grant select on public.kurs_master to service_role;
grant select on public.master_riwayat to service_role;
