-- K10 (D-70): skema produksi — BOM berversi, SPK, hasil/QC, jam kerja,
-- pemakaian bahan, tarif/overhead, dan event biaya per-SPK.
--
-- Aturan uang mengikuti F4: numeric(18,2) dengan CHECK nilai bulat.
-- Qty dan rate memakai numeric(18,4) (presisi penuh yang disepakati).
-- Penomoran dan status SPK sepenuhnya milik core `dokumen` (tipe WO);
-- `perintah_produksi` sengaja tidak memiliki kolom nomor maupun status.

begin;

-- ---------------------------------------------------------------------------
-- 1. BOM (D-11): header + versi + komponen. Tabel komponen bernama
--    `produk_komponen` (D-31/D-70), bukan `bom_komponen`.
--    Status versi tidak disimpan: diturunkan dari `berlaku_dari`.
-- ---------------------------------------------------------------------------

create table public.bom (
    id uuid primary key default gen_random_uuid(),
    produk_id uuid not null references public.produk (id),
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_bom_produk unique (produk_id),
    constraint uq_bom_id_produk unique (id, produk_id)
);

create table public.bom_versi (
    id uuid primary key default gen_random_uuid(),
    bom_id uuid not null,
    produk_id uuid not null references public.produk (id),
    versi integer not null,
    berlaku_dari date not null,
    toleransi_scrap numeric(18,4) not null default 0,
    toleransi_reject numeric(18,4) not null default 0,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_bom_versi_nomor unique (bom_id, versi),
    constraint uq_bom_versi_produk_nomor unique (produk_id, versi),
    constraint uq_bom_versi_produk_berlaku unique (produk_id, berlaku_dari),
    constraint uq_bom_versi_id_produk unique (id, produk_id),
    constraint ck_bom_versi_nomor check (versi > 0),
    constraint ck_bom_versi_toleransi_scrap check (
        toleransi_scrap >= 0 and toleransi_scrap < 100
    ),
    constraint ck_bom_versi_toleransi_reject check (
        toleransi_reject >= 0 and toleransi_reject < 100
    ),
    constraint fk_bom_versi_bom_produk
        foreign key (bom_id, produk_id) references public.bom (id, produk_id)
);

-- Lookup "versi berlaku pada tanggal X" memakai index ini.
create index idx_bom_versi_effective_lookup
    on public.bom_versi (produk_id, berlaku_dari desc, id desc);
create index idx_bom_versi_bom_id on public.bom_versi (bom_id);

create table public.produk_komponen (
    id uuid primary key default gen_random_uuid(),
    versi_id uuid not null references public.bom_versi (id),
    komponen_produk_id uuid not null references public.produk (id),
    satuan_id uuid not null references public.satuan (id),
    qty_per_unit numeric(18,4) not null,
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_produk_komponen_komponen unique (versi_id, komponen_produk_id),
    constraint uq_produk_komponen_urutan unique (versi_id, urutan),
    constraint ck_produk_komponen_qty check (qty_per_unit > 0),
    constraint ck_produk_komponen_urutan check (urutan > 0)
);

create index idx_produk_komponen_versi on public.produk_komponen (versi_id, urutan);
create index idx_produk_komponen_komponen on public.produk_komponen (komponen_produk_id);
create index idx_produk_komponen_satuan on public.produk_komponen (satuan_id);

-- ---------------------------------------------------------------------------
-- 2. Perintah produksi / SPK. `dokumen_id` adalah kunci dan satu-satunya
--    sumber nomor serta status. Tidak ada kolom nomor/status duplikat.
-- ---------------------------------------------------------------------------

create table public.perintah_produksi (
    dokumen_id uuid primary key references public.dokumen (id),
    produk_id uuid not null references public.produk (id),
    bom_versi_id uuid not null references public.bom_versi (id),
    gudang_id uuid not null references public.gudang (id),
    tanggal_perintah date not null,
    tgl_target_selesai date not null,
    target_qty numeric(18,4) not null,
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_perintah_produksi_target check (target_qty > 0),
    constraint ck_perintah_produksi_target_tanggal check (
        tgl_target_selesai >= tanggal_perintah
    ),
    constraint uq_perintah_produksi_id_produk unique (dokumen_id, produk_id),
    constraint uq_perintah_produksi_versi_produk unique (bom_versi_id, produk_id),
    constraint fk_perintah_produksi_versi_produk
        foreign key (bom_versi_id, produk_id) references public.bom_versi (id, produk_id)
);

create index idx_perintah_produksi_produk on public.perintah_produksi (produk_id, tanggal_perintah desc);
create index idx_perintah_produksi_versi on public.perintah_produksi (bom_versi_id);
create index idx_perintah_produksi_gudang on public.perintah_produksi (gudang_id);
create index idx_perintah_produksi_versi_produk on public.perintah_produksi (bom_versi_id, produk_id);

-- ---------------------------------------------------------------------------
-- 3. Hasil produksi (multi-attempt) dan keputusan QC terpisah.
--    `quality_check` memegang pembagian L/R/J; pengecekan
--    L + R + J = qty_diproses dilakukan di trigger (lintas tabel).
-- ---------------------------------------------------------------------------

create table public.hasil_produksi (
    id uuid primary key default gen_random_uuid(),
    wo_id uuid not null references public.perintah_produksi (dokumen_id),
    percobaan integer not null,
    qty_diproses numeric(18,4) not null,
    tanggal timestamptz not null default now(),
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_hasil_produksi_percobaan unique (wo_id, percobaan),
    constraint uq_hasil_produksi_id_wo unique (id, wo_id),
    constraint ck_hasil_produksi_percobaan check (percobaan > 0),
    constraint ck_hasil_produksi_qty check (qty_diproses > 0)
);

create index idx_hasil_produksi_wo on public.hasil_produksi (wo_id, percobaan);
create index idx_hasil_produksi_wo_tanggal on public.hasil_produksi (wo_id, tanggal desc);

create table public.quality_check (
    id uuid primary key default gen_random_uuid(),
    hasil_produksi_id uuid not null references public.hasil_produksi (id),
    wo_id uuid not null references public.perintah_produksi (dokumen_id),
    qty_lulus numeric(18,4) not null,
    qty_rework numeric(18,4) not null,
    qty_reject numeric(18,4) not null,
    keputusan text not null,
    catatan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_quality_check_hasil unique (hasil_produksi_id),
    constraint ck_quality_check_lulus check (qty_lulus >= 0),
    constraint ck_quality_check_rework check (qty_rework >= 0),
    constraint ck_quality_check_reject check (qty_reject >= 0),
    constraint ck_quality_check_keputusan check (
        keputusan in ('QC_PASSED', 'REWORK', 'REJECTED')
    ),
    constraint fk_quality_check_hasil_wo
        foreign key (hasil_produksi_id, wo_id) references public.hasil_produksi (id, wo_id)
);

create index idx_quality_check_wo on public.quality_check (wo_id, created_at desc);
create index idx_quality_check_hasil_wo on public.quality_check (hasil_produksi_id, wo_id);

-- ---------------------------------------------------------------------------
-- 4. Kartu jam kerja per WO, karyawan, dan tanggal (PR-006).
-- ---------------------------------------------------------------------------

create table public.kartu_jam_kerja (
    id uuid primary key default gen_random_uuid(),
    wo_id uuid not null references public.perintah_produksi (dokumen_id),
    karyawan_id uuid not null references public.karyawan (id),
    tanggal date not null,
    jam_kerja numeric(18,4) not null,
    tarif_per_jam numeric(18,4) not null,
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_kartu_jam_kerja_hari unique (wo_id, karyawan_id, tanggal),
    constraint ck_kartu_jam_kerja_jam check (jam_kerja > 0),
    constraint ck_kartu_jam_kerja_tarif check (tarif_per_jam >= 0)
);
alter table public.kartu_jam_kerja
    add constraint ck_kartu_jam_kerja_tarif_bulat
    check (tarif_per_jam >= 0 and tarif_per_jam = trunc(tarif_per_jam));

create index idx_kartu_jam_kerja_wo_tanggal on public.kartu_jam_kerja (wo_id, tanggal desc);
create index idx_kartu_jam_kerja_karyawan_tanggal on public.kartu_jam_kerja (karyawan_id, tanggal desc);

-- ---------------------------------------------------------------------------
-- 5. Catatan pengeluaran dan pemakaian bahan per-SPK. Stok fisik tetap
--    ditulis lewat `mutasi_stok`; tabel ini hanya jejak per-WO-nya.
-- ---------------------------------------------------------------------------

create table public.pengeluaran_bahan (
    id uuid primary key default gen_random_uuid(),
    wo_id uuid not null references public.perintah_produksi (dokumen_id),
    produk_id uuid not null references public.produk (id),
    satuan_id uuid not null references public.satuan (id),
    gudang_id uuid not null references public.gudang (id),
    mutasi_stok_id uuid not null references public.mutasi_stok (id),
    qty_keluar numeric(18,4) not null,
    harga_satuan numeric(18,4) not null,
    nilai_keluar numeric(18,2) not null,
    tanggal timestamptz not null,
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_pengeluaran_bahan_id_wo unique (id, wo_id),
    constraint ck_pengeluaran_bahan_qty check (qty_keluar > 0),
    constraint ck_pengeluaran_bahan_harga check (harga_satuan >= 0),
    constraint ck_pengeluaran_bahan_nilai_bulat check (
        nilai_keluar >= 0 and nilai_keluar = trunc(nilai_keluar)
    )
);

create index idx_pengeluaran_bahan_wo on public.pengeluaran_bahan (wo_id, tanggal desc);
create index idx_pengeluaran_bahan_produk on public.pengeluaran_bahan (produk_id);
create index idx_pengeluaran_bahan_satuan on public.pengeluaran_bahan (satuan_id);
create index idx_pengeluaran_bahan_gudang on public.pengeluaran_bahan (gudang_id);
create index idx_pengeluaran_bahan_mutasi on public.pengeluaran_bahan (mutasi_stok_id);

create table public.pemakaian_bahan (
    id uuid primary key default gen_random_uuid(),
    pengeluaran_id uuid not null references public.pengeluaran_bahan (id),
    wo_id uuid not null references public.perintah_produksi (dokumen_id),
    qty_terpakai numeric(18,4) not null,
    qty_sisa numeric(18,4) not null,
    qty_scrap numeric(18,4) not null,
    mutasi_stok_sisa_id uuid references public.mutasi_stok (id),
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_pemakaian_bahan_pengeluaran unique (pengeluaran_id),
    constraint ck_pemakaian_bahan_terpakai check (qty_terpakai >= 0),
    constraint ck_pemakaian_bahan_sisa check (qty_sisa >= 0),
    constraint ck_pemakaian_bahan_scrap check (qty_scrap >= 0),
    constraint fk_pemakaian_bahan_pengeluaran_wo
        foreign key (pengeluaran_id, wo_id) references public.pengeluaran_bahan (id, wo_id)
);

create index idx_pemakaian_bahan_wo on public.pemakaian_bahan (wo_id);
create index idx_pemakaian_bahan_mutasi_sisa on public.pemakaian_bahan (mutasi_stok_sisa_id)
    where mutasi_stok_sisa_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Overhead (D-12): tarif predeterminasi per tanggal berlaku dan pool
--    aktual per periode/akun. Selisih disesuaikan di akhir periode.
-- ---------------------------------------------------------------------------

create table public.tarif_overhead (
    id uuid primary key default gen_random_uuid(),
    berlaku_dari date not null,
    tarif numeric(18,4) not null,
    kapasitas_normal numeric(18,4) not null,
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_tarif_overhead_berlaku unique (berlaku_dari),
    constraint ck_tarif_overhead_tarif check (tarif >= 0),
    constraint ck_tarif_overhead_kapasitas check (kapasitas_normal > 0)
);
alter table public.tarif_overhead
    add constraint ck_tarif_overhead_tarif_bulat
    check (tarif >= 0 and tarif = trunc(tarif));

create index idx_tarif_overhead_berlaku_lookup
    on public.tarif_overhead (berlaku_dari desc, id desc);

create table public.overhead_aktual (
    id uuid primary key default gen_random_uuid(),
    periode date not null,
    akun_id uuid not null references public.akun (id),
    nilai numeric(18,2) not null,
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_overhead_aktual_periode_akun unique (periode, akun_id),
    constraint ck_overhead_aktual_periode check (periode = date_trunc('month', periode)::date),
    constraint ck_overhead_aktual_nilai_bulat check (nilai >= 0 and nilai = trunc(nilai))
);

create index idx_overhead_aktual_akun on public.overhead_aktual (akun_id);

-- ---------------------------------------------------------------------------
-- 7. Event biaya per-SPK (append-only). Event dan jurnal ditulis dalam satu
--    transaksi; trigger memastikan tautan sumber event = sumber jurnal.
-- ---------------------------------------------------------------------------

create table public.biaya_produksi_event (
    id uuid primary key default gen_random_uuid(),
    wo_id uuid not null references public.perintah_produksi (dokumen_id),
    jenis text not null,
    sumber_tipe text not null references public.jenis_sumber_jurnal (kode),
    sumber_id uuid not null,
    jurnal_id uuid not null references public.jurnal (id),
    nominal numeric(18,2) not null,
    tanggal timestamptz not null,
    keterangan text,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_biaya_produksi_event_jenis check (
        jenis in ('BAHAN', 'TKL', 'OVERHEAD', 'REWORK', 'KERUGIAN', 'PENYESUAIAN_HPP')
    ),
    constraint ck_biaya_produksi_event_nominal_bulat check (
        nominal >= 0 and nominal = trunc(nominal)
    )
);

create index idx_biaya_produksi_event_wo on public.biaya_produksi_event (wo_id, tanggal desc);
create index idx_biaya_produksi_event_sumber on public.biaya_produksi_event (sumber_tipe, sumber_id);
create index idx_biaya_produksi_event_jurnal on public.biaya_produksi_event (jurnal_id);

-- ---------------------------------------------------------------------------
-- 8. PR bahan (D-70): pakai ulang `permintaan_pembelian.wo_id`.
--    Kolom baru tidak ditambahkan; FK ditambahkan di sini. Kewajiban wo_id
--    ditegakkan hanya untuk pemohon berperan Produksi (D-64), bukan untuk
--    seluruh permintaan: PR Gudang tetap boleh membawa wo_id null.
-- ---------------------------------------------------------------------------

alter table public.permintaan_pembelian
    add constraint fk_permintaan_pembelian_wo
    foreign key (wo_id) references public.perintah_produksi (dokumen_id);


-- ---------------------------------------------------------------------------
-- 9. Trigger penegak invariant lintas tabel.
-- ---------------------------------------------------------------------------

create or replace function public.trg_k10_append_only()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    raise exception 'Baris % tidak bisa diubah atau dihapus. Gunakan baris koreksi baru.', tg_table_name;
end;
$$;

create or replace function public.trg_k10_no_delete()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    raise exception 'Dokumen % tidak bisa dihapus. Gunakan pembatalan.', tg_table_name;
end;
$$;

-- Isi versi BOM yang tersimpan tidak boleh berubah (PR-001 INV-01, D-70).
drop trigger if exists trg_bom_versi_no_update on public.bom_versi;
create trigger trg_bom_versi_no_update
before update on public.bom_versi
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_bom_versi_no_delete on public.bom_versi;
create trigger trg_bom_versi_no_delete
before delete on public.bom_versi
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_produk_komponen_no_update on public.produk_komponen;
create trigger trg_produk_komponen_no_update
before update on public.produk_komponen
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_produk_komponen_no_delete on public.produk_komponen;
create trigger trg_produk_komponen_no_delete
before delete on public.produk_komponen
for each row execute function public.trg_k10_append_only();

-- Keputusan QC dan catatan hasil tidak bisa dikoreksi (D-48, PR-005).
drop trigger if exists trg_quality_check_no_update on public.quality_check;
create trigger trg_quality_check_no_update
before update on public.quality_check
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_quality_check_no_delete on public.quality_check;
create trigger trg_quality_check_no_delete
before delete on public.quality_check
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_hasil_produksi_no_update on public.hasil_produksi;
create trigger trg_hasil_produksi_no_update
before update on public.hasil_produksi
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_hasil_produksi_no_delete on public.hasil_produksi;
create trigger trg_hasil_produksi_no_delete
before delete on public.hasil_produksi
for each row execute function public.trg_k10_append_only();

-- Event biaya bersifat immutable; koreksi = event kompensasi baru.
drop trigger if exists trg_biaya_produksi_event_no_update on public.biaya_produksi_event;
create trigger trg_biaya_produksi_event_no_update
before update on public.biaya_produksi_event
for each row execute function public.trg_k10_append_only();

drop trigger if exists trg_biaya_produksi_event_no_delete on public.biaya_produksi_event;
create trigger trg_biaya_produksi_event_no_delete
before delete on public.biaya_produksi_event
for each row execute function public.trg_k10_append_only();

-- SPK tidak dihapus (D-50/PR-002).
drop trigger if exists trg_perintah_produksi_no_delete on public.perintah_produksi;
create trigger trg_perintah_produksi_no_delete
before delete on public.perintah_produksi
for each row execute function public.trg_k10_no_delete();

-- Identitas SPK dan versi BOM yang dipilih tidak bisa diganti.
create or replace function public.trg_k10_perintah_produksi_identity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if new.dokumen_id is distinct from old.dokumen_id
        or new.produk_id is distinct from old.produk_id
        or new.bom_versi_id is distinct from old.bom_versi_id
        or new.created_by is distinct from old.created_by
        or new.created_at is distinct from old.created_at then
        raise exception 'Identitas SPK dan versi BOM tidak bisa diubah.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_perintah_produksi_identity_immutable on public.perintah_produksi;
create trigger trg_perintah_produksi_identity_immutable
before update on public.perintah_produksi
for each row execute function public.trg_k10_perintah_produksi_identity();

-- SPK harus memakai dokumen bertipe WO dan versi BOM yang berlaku pada
-- tanggal perintah untuk produk yang sama.
create or replace function public.trg_k10_perintah_produksi_validate()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_tipe text;
    v_produk_id uuid;
    v_berlaku_dari date;
begin
    select tipe into v_tipe from public.dokumen where id = new.dokumen_id;
    if not found or v_tipe <> 'WO' then
        raise exception 'Perintah produksi wajib memakai dokumen bertipe WO.';
    end if;

    select produk_id, berlaku_dari into v_produk_id, v_berlaku_dari
    from public.bom_versi where id = new.bom_versi_id;
    if not found then
        raise exception 'Versi BOM tidak ditemukan.';
    end if;
    if v_produk_id is distinct from new.produk_id then
        raise exception 'Versi BOM harus berasal dari produk yang sama dengan SPK.';
    end if;
    if v_berlaku_dari > new.tanggal_perintah then
        raise exception 'Versi BOM belum berlaku pada tanggal perintah.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_perintah_produksi_validate on public.perintah_produksi;
create trigger trg_perintah_produksi_validate
before insert or update of dokumen_id, produk_id, bom_versi_id, tanggal_perintah
on public.perintah_produksi
for each row execute function public.trg_k10_perintah_produksi_validate();

-- Komponen BOM: tipe bahan C-011 dan satuan yang kompatibel (PR-001 PRE-05,
-- C-011/D-38 konversi satuan). Tidak ada kolom stok/harga di BOM.
create or replace function public.trg_k10_produk_komponen_satuan()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_tipe text;
    v_satuan_dasar_id uuid;
begin
    select tipe, satuan_dasar_id into v_tipe, v_satuan_dasar_id
    from public.produk where id = new.komponen_produk_id;
    if not found or v_tipe <> 'bahan' then
        raise exception 'Komponen BOM harus berupa produk bertipe bahan.';
    end if;
    if new.satuan_id is distinct from v_satuan_dasar_id
        and not exists (
            select 1 from public.konversi_satuan k
            where (k.satuan_dari_id = new.satuan_id and k.satuan_ke_id = v_satuan_dasar_id)
               or (k.satuan_dari_id = v_satuan_dasar_id and k.satuan_ke_id = new.satuan_id)
        ) then
        raise exception 'Satuan komponen tidak kompatibel dengan satuan dasar C-011.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_produk_komponen_satuan_c011 on public.produk_komponen;
create trigger trg_produk_komponen_satuan_c011
before insert on public.produk_komponen
for each row execute function public.trg_k10_produk_komponen_satuan();

-- QC: diproses = lulus + rework + reject, dengan keputusan turunan yang
-- konsisten (PR-005). Trigger menjaga CHECK lintas hasil_produksi.
create or replace function public.trg_k10_quality_check_validate()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_diproses numeric(18,4);
    v_keputusan text;
begin
    select qty_diproses into v_diproses
    from public.hasil_produksi where id = new.hasil_produksi_id;
    if not found then
        raise exception 'Catatan hasil produksi tidak ditemukan.';
    end if;
    if new.qty_lulus + new.qty_rework + new.qty_reject <> v_diproses then
        raise exception 'Lulus, rework, dan reject harus sama dengan jumlah diproses.';
    end if;

    v_keputusan := case
        when new.qty_rework > 0 then 'REWORK'
        when new.qty_lulus = 0 then 'REJECTED'
        else 'QC_PASSED'
    end;
    if new.keputusan is distinct from v_keputusan then
        raise exception 'Keputusan QC tidak sesuai dengan pembagian hasil.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_quality_check_result_sum on public.quality_check;
create trigger trg_quality_check_result_sum
before insert on public.quality_check
for each row execute function public.trg_k10_quality_check_validate();

-- Pemakaian: terpakai + sisa + scrap harus sama dengan qty keluar (PR-004).
create or replace function public.trg_k10_pemakaian_bahan_validate()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_keluar numeric(18,4);
begin
    select qty_keluar into v_keluar
    from public.pengeluaran_bahan where id = new.pengeluaran_id;
    if not found then
        raise exception 'Catatan pengeluaran bahan tidak ditemukan.';
    end if;
    if new.qty_terpakai + new.qty_sisa + new.qty_scrap <> v_keluar then
        raise exception 'Terpakai, sisa, dan scrap harus sama dengan jumlah keluar.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_pemakaian_bahan_qty_sum on public.pemakaian_bahan;
create trigger trg_pemakaian_bahan_qty_sum
before insert or update on public.pemakaian_bahan
for each row execute function public.trg_k10_pemakaian_bahan_validate();

-- Event biaya dan jurnal sumbernya harus dibuat dalam transaksi yang sama.
create or replace function public.trg_k10_biaya_produksi_event_jurnal()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if not exists (
        select 1 from public.jurnal j
        where j.id = new.jurnal_id
          and j.sumber_tipe = new.sumber_tipe
          and j.sumber_id = new.sumber_id
    ) then
        raise exception 'Jurnal sumber event biaya tidak cocok atau belum dibuat.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_biaya_produksi_event_jurnal on public.biaya_produksi_event;
create trigger trg_biaya_produksi_event_jurnal
before insert on public.biaya_produksi_event
for each row execute function public.trg_k10_biaya_produksi_event_jurnal();

-- Satu PR aktif per-WO. `permintaan_pembelian` tidak mendapat kolom baru;
-- status PR dibaca dari `dokumen` dan kunci diambil dengan advisory lock
-- supaya dua transaksi konkuren tidak membuat dua PR aktif.
create or replace function public.trg_k10_permintaan_pembelian_satu_aktif()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_aktif integer;
begin
    if new.wo_id is null then
        return new;
    end if;

    perform pg_advisory_xact_lock(hashtextextended('K10_PR_WO:' || new.wo_id::text, 0));

    select count(*) into v_aktif
    from public.permintaan_pembelian pp
    join public.dokumen d on d.id = pp.dokumen_id
    where pp.wo_id = new.wo_id
      and d.tipe = 'PERMINTAAN_PEMBELIAN'
      and d.status in ('DIAJUKAN', 'MENUNGGU_PERSETUJUAN', 'REVISI', 'DISETUJUI')
      and pp.dokumen_id is distinct from new.dokumen_id;

    if v_aktif > 0 then
        raise exception 'Perintah produksi sudah memiliki permintaan pembelian aktif.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_permintaan_pembelian_satu_aktif_per_wo
    on public.permintaan_pembelian;
create trigger trg_permintaan_pembelian_satu_aktif_per_wo
before insert or update of wo_id on public.permintaan_pembelian
for each row execute function public.trg_k10_permintaan_pembelian_satu_aktif();

-- wo_id wajib hanya untuk permintaan Produksi (D-64). Pemohon tersimpan
-- sebagai `dokumen.pembuat_id` (0007/0014); tabel permintaan_pembelian
-- tidak memiliki kolom `pemohon_id`, jadi peran diambil dari dokumen induk.
create or replace function public.trg_k10_permintaan_pembelian_wo_produksi()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
    v_peran text;
begin
    select p.peran into v_peran
    from public.dokumen d
    join public.profiles p on p.id = d.pembuat_id
    where d.id = new.dokumen_id;

    if v_peran = 'Produksi' and new.wo_id is null then
        raise exception 'Perintah produksi wajib diisi untuk permintaan Produksi.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_permintaan_pembelian_wo_produksi on public.permintaan_pembelian;
create trigger trg_permintaan_pembelian_wo_produksi
before insert or update of wo_id on public.permintaan_pembelian
for each row execute function public.trg_k10_permintaan_pembelian_wo_produksi();


-- ---------------------------------------------------------------------------
-- 10. Atomic RPC layer (D-70 / K10). Semua RPC memakai SECURITY DEFINER,
--     kunci idempotensi, advisory lock, dan hanya bisa dipanggil service_role.
--     Penulisan stok, dokumen, status, dan jurnal selalu di dalam RPC.
-- ---------------------------------------------------------------------------

create table public.k10_idempotensi (
    kunci text primary key,
    operasi text not null,
    hasil jsonb not null,
    created_at timestamptz not null default now()
);

alter table public.k10_idempotensi enable row level security;
revoke all on public.k10_idempotensi from anon, authenticated;
grant all on public.k10_idempotensi to service_role;

create or replace function public.k10_uuid_dari_kunci(p_kunci text)
returns uuid
language sql
immutable
security definer
set search_path = pg_catalog, public
as $$
    select (
        substr(v_hex, 1, 8) || '-' || substr(v_hex, 9, 4) || '-' ||
        substr(v_hex, 13, 4) || '-' || substr(v_hex, 17, 4) || '-' ||
        substr(v_hex, 21, 12)
    )::uuid
    from (select md5(coalesce(p_kunci, '')) as v_hex) as k;
$$;

create or replace function public.k10_assert_peran(p_aktor_id uuid, p_peran text[])
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_peran text;
begin
    if p_aktor_id is null then
        raise exception 'Sesi pengguna tidak valid.';
    end if;
    select peran into v_peran
    from public.profiles where id = p_aktor_id and aktif = true;
    if v_peran is null or not (v_peran = any (p_peran)) then
        raise exception 'Peran Anda tidak berwenang melakukan tindakan ini.'
            using errcode = '42501';
    end if;
    return p_aktor_id;
end;
$$;

create or replace function public.k10_idempotensi_mulai(p_kunci text, p_operasi text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_operasi text;
    v_hasil jsonb;
begin
    if p_kunci is null or length(btrim(p_kunci)) = 0 then
        raise exception 'Kunci idempotensi wajib diisi.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('K10:' || p_kunci, 0));
    select operasi, hasil into v_operasi, v_hasil
    from public.k10_idempotensi where kunci = p_kunci;
    if found then
        if v_operasi is distinct from p_operasi then
            raise exception 'Kunci idempotensi sudah dipakai operasi lain.';
        end if;
        return v_hasil;
    end if;
    return null;
end;
$$;

create or replace function public.k10_idempotensi_simpan(
    p_kunci text, p_operasi text, p_hasil jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    insert into public.k10_idempotensi (kunci, operasi, hasil)
    values (p_kunci, p_operasi, p_hasil);
end;
$$;

create or replace function public.k10_spk(p_wo_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select jsonb_build_object(
        'dokumen_id', d.id,
        'status', d.status,
        'versi', d.versi,
        'pembuat_id', d.pembuat_id,
        'nomor', d.nomor
    )
    from public.perintah_produksi pp
    join public.dokumen d on d.id = pp.dokumen_id
    where pp.dokumen_id = p_wo_id;
$$;

create or replace function public.k10_pindah_spk(
    p_wo_id uuid,
    p_versi bigint,
    p_status_tujuan text,
    p_aksi text,
    p_aktor_id uuid,
    p_alasan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_spk jsonb := public.k10_spk(p_wo_id);
    v_versi bigint;
begin
    if v_spk is null then
        raise exception 'Perintah produksi tidak ditemukan.';
    end if;
    v_versi := (v_spk->>'versi')::bigint;
    if p_versi is not null and v_versi <> p_versi then
        raise exception 'Versi dokumen sudah berubah. Muat ulang SPK.';
    end if;
    if not exists (
        select 1 from public.transisi_dokumen_sah
        where dari_status = v_spk->>'status'
          and ke_status = p_status_tujuan
          and aksi = p_aksi
    ) then
        raise exception 'Transisi status SPK tidak diizinkan.';
    end if;
    return public.pindah_status_dokumen(
        (v_spk->>'dokumen_id')::uuid, v_versi, p_status_tujuan,
        p_aksi, p_aktor_id, p_alasan
    );
end;
$$;

create or replace function public.k10_jurnal(
    p_tanggal timestamptz,
    p_sumber_tipe text,
    p_sumber_id uuid,
    p_sumber_nomor text,
    p_sumber_pemicu text,
    p_debit_peran text,
    p_kredit_peran text,
    p_nominal numeric,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_nominal numeric(18,2) := round(p_nominal, 0)::numeric(18,2);
begin
    if v_nominal is null or v_nominal <= 0 then
        raise exception 'Nominal jurnal harus lebih dari nol.';
    end if;
    return public.post_journal(
        p_tanggal, p_sumber_tipe, p_sumber_id, p_sumber_nomor, p_sumber_pemicu,
        jsonb_build_array(
            jsonb_build_object('akun_peran', p_debit_peran, 'debit', v_nominal, 'kredit', 0),
            jsonb_build_object('akun_peran', p_kredit_peran, 'debit', 0, 'kredit', v_nominal)
        ),
        'IDR', p_aktor_id
    );
end;
$$;

create or replace function public.k10_event(
    p_wo_id uuid,
    p_jenis text,
    p_sumber_tipe text,
    p_sumber_id uuid,
    p_jurnal_id uuid,
    p_nominal numeric,
    p_tanggal timestamptz,
    p_aktor_id uuid,
    p_keterangan text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_event_id uuid;
begin
    insert into public.biaya_produksi_event (
        wo_id, jenis, sumber_tipe, sumber_id, jurnal_id, nominal,
        tanggal, keterangan, created_by, updated_by
    ) values (
        p_wo_id, p_jenis, p_sumber_tipe, p_sumber_id, p_jurnal_id,
        round(p_nominal, 0)::numeric(18,2), p_tanggal, p_keterangan,
        p_aktor_id, p_aktor_id
    ) returning id into v_event_id;
    return v_event_id;
end;
$$;

-- 1. Simpan versi BOM berversi (PR-001).
create or replace function public.k10_simpan_versi_bom(
    p_aktor_id uuid,
    p_produk_id uuid,
    p_berlaku_dari date,
    p_toleransi_scrap numeric,
    p_toleransi_reject numeric,
    p_komponen jsonb,
    p_kunci_idempotensi text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Produksi']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'SIMPAN_BOM');
    v_bom_id uuid;
    v_versi_id uuid;
    v_versi integer;
    v_berlaku_terakhir date;
    v_elem jsonb;
    v_komponen_id uuid;
    v_satuan_id uuid;
    v_qty numeric(18,4);
    v_urutan smallint;
    v_tipe text;
    v_satuan_dasar_id uuid;
    v_jumlah integer := 0;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if p_berlaku_dari is null or p_komponen is null
        or jsonb_typeof(p_komponen) <> 'array'
        or jsonb_array_length(p_komponen) = 0 then
        raise exception 'Tanggal berlaku dan minimal satu komponen wajib diisi.';
    end if;
    if p_toleransi_scrap is null or p_toleransi_scrap < 0 or p_toleransi_scrap >= 100
        or p_toleransi_reject is null or p_toleransi_reject < 0 or p_toleransi_reject >= 100 then
        raise exception 'Toleransi scrap dan reject harus antara 0 dan kurang dari 100 persen.';
    end if;

    select id into v_bom_id from public.bom where produk_id = p_produk_id;
    if not exists (select 1 from public.produk where id = p_produk_id and aktif = true) then
        raise exception 'Produk tidak ditemukan atau tidak aktif.';
    end if;
    if v_bom_id is null then
        insert into public.bom (produk_id, created_by, updated_by)
        values (p_produk_id, v_aktor, v_aktor) returning id into v_bom_id;
    end if;

    select coalesce(max(versi), 0) + 1, max(berlaku_dari)
    into v_versi, v_berlaku_terakhir
    from public.bom_versi where bom_id = v_bom_id;

    if v_berlaku_terakhir is not null and p_berlaku_dari <= v_berlaku_terakhir then
        raise exception 'Tanggal berlaku versi baru harus setelah versi terakhir.';
    end if;

    insert into public.bom_versi (
        bom_id, produk_id, versi, berlaku_dari, toleransi_scrap, toleransi_reject,
        created_by, updated_by
    ) values (
        v_bom_id, p_produk_id, v_versi, p_berlaku_dari,
        p_toleransi_scrap::numeric(18,4), p_toleransi_reject::numeric(18,4),
        v_aktor, v_aktor
    ) returning id into v_versi_id;

    for v_elem in select * from jsonb_array_elements(p_komponen) loop
        v_komponen_id := (v_elem->>'komponen_produk_id')::uuid;
        v_satuan_id := (v_elem->>'satuan_id')::uuid;
        v_qty := (v_elem->>'qty_per_unit')::numeric(18,4);
        v_urutan := (v_elem->>'urutan')::smallint;

        if v_komponen_id is null or v_satuan_id is null or v_qty is null or v_qty <= 0
            or v_urutan is null or v_urutan <= 0 then
            raise exception 'Baris komponen BOM tidak lengkap atau tidak valid.';
        end if;
        select tipe, satuan_dasar_id into v_tipe, v_satuan_dasar_id
        from public.produk where id = v_komponen_id;
        if not found or v_tipe <> 'bahan' then
            raise exception 'Komponen BOM harus berupa produk bertipe bahan.';
        end if;
        if not exists (select 1 from public.satuan where id = v_satuan_id and aktif = true) then
            raise exception 'Satuan komponen tidak ditemukan atau tidak aktif.';
        end if;
        if v_satuan_id is distinct from v_satuan_dasar_id
            and not exists (
                select 1 from public.konversi_satuan k
                where (k.satuan_dari_id = v_satuan_id and k.satuan_ke_id = v_satuan_dasar_id)
                   or (k.satuan_dari_id = v_satuan_dasar_id and k.satuan_ke_id = v_satuan_id)
            ) then
            raise exception 'Satuan komponen tidak kompatibel dengan satuan dasar C-011.';
        end if;

        insert into public.produk_komponen (
            versi_id, komponen_produk_id, satuan_id, qty_per_unit, urutan,
            created_by, updated_by
        ) values (
            v_versi_id, v_komponen_id, v_satuan_id, v_qty, v_urutan, v_aktor, v_aktor
        );
        v_jumlah := v_jumlah + 1;
    end loop;

    v_hasil := jsonb_build_object(
        'bom_id', v_bom_id,
        'versi_id', v_versi_id,
        'versi', v_versi,
        'berlaku_dari', p_berlaku_dari::text,
        'jumlah_komponen', v_jumlah
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'SIMPAN_BOM', v_hasil);
    return v_hasil;
end;
$$;

-- 2. Buat SPK lewat core dokumen (WO).
create or replace function public.k10_buat_spk(
    p_aktor_id uuid,
    p_produk_id uuid,
    p_bom_versi_id uuid,
    p_gudang_id uuid,
    p_tanggal_perintah date,
    p_tgl_target_selesai date,
    p_target_qty numeric,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Produksi']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'BUAT_SPK');
    v_dibuat jsonb;
    v_wo_id uuid;
    v_berlaku_dari date;
    v_produk_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if p_target_qty is null or p_target_qty <= 0 then
        raise exception 'Target jumlah harus lebih dari nol.';
    end if;
    if p_tgl_target_selesai is null or p_tgl_target_selesai < p_tanggal_perintah then
        raise exception 'Tanggal target selesai tidak boleh sebelum tanggal perintah.';
    end if;
    if not exists (select 1 from public.gudang where id = p_gudang_id and aktif = true) then
        raise exception 'Gudang sumber tidak ditemukan atau tidak aktif.';
    end if;
    select produk_id, berlaku_dari into v_produk_id, v_berlaku_dari
    from public.bom_versi where id = p_bom_versi_id;
    if not found then
        raise exception 'Versi BOM tidak ditemukan.';
    end if;
    if v_produk_id is distinct from p_produk_id then
        raise exception 'Versi BOM harus berasal dari produk yang sama dengan SPK.';
    end if;
    if v_berlaku_dari > p_tanggal_perintah then
        raise exception 'Versi BOM belum berlaku pada tanggal perintah.';
    end if;

    v_dibuat := public.buat_dokumen('WO', v_aktor, null, p_tanggal_perintah);
    v_wo_id := (v_dibuat->'dokumen'->>'id')::uuid;

    insert into public.perintah_produksi (
        dokumen_id, produk_id, bom_versi_id, gudang_id, tanggal_perintah,
        tgl_target_selesai, target_qty, keterangan, created_by, updated_by
    ) values (
        v_wo_id, p_produk_id, p_bom_versi_id, p_gudang_id, p_tanggal_perintah,
        p_tgl_target_selesai, p_target_qty::numeric(18,4), p_keterangan, v_aktor, v_aktor
    );

    v_hasil := v_dibuat || jsonb_build_object('wo_id', v_wo_id);
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'BUAT_SPK', v_hasil);
    return v_hasil;
end;
$$;

-- 3. Pindah status SPK lewat mesin status core.
create or replace function public.k10_pindah_status_spk(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_versi bigint,
    p_status_tujuan text,
    p_aksi text,
    p_kunci_idempotensi text,
    p_alasan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(
        p_aktor_id,
        array['Produksi', 'Gudang', 'QC', 'Purchasing', 'Manajemen', 'Accounting']
    );
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'PINDAH_STATUS_SPK');
    v_spk jsonb := public.k10_spk(p_wo_id);
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_spk is null then
        raise exception 'Perintah produksi tidak ditemukan.';
    end if;
    if p_status_tujuan = 'DIBATALKAN' then
        if p_alasan is null or length(btrim(p_alasan)) = 0 then
            raise exception 'Alasan pembatalan wajib diisi.';
        end if;
        if (v_spk->>'pembuat_id')::uuid <> v_aktor then
            raise exception 'Hanya pemohon yang dapat membatalkan SPK.';
        end if;
    end if;

    v_hasil := public.k10_pindah_spk(
        p_wo_id, p_versi, p_status_tujuan, p_aksi, v_aktor, p_alasan
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'PINDAH_STATUS_SPK', v_hasil);
    return v_hasil;
end;
$$;

-- 4. Ajukan permintaan bahan untuk SPK BAHAN_KURANG lewat core pengadaan.
create or replace function public.k10_ajukan_permintaan_bahan(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_gudang_id uuid,
    p_tanggal_butuh date,
    p_baris jsonb,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Produksi']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'AJUKAN_PR_BAHAN');
    v_spk jsonb := public.k10_spk(p_wo_id);
    v_pr jsonb;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_spk is null or v_spk->>'status' <> 'BAHAN_KURANG' then
        raise exception 'Permintaan bahan hanya bisa dibuat dari SPK berstatus BAHAN_KURANG.';
    end if;

    v_pr := public.ajukan_pr(
        v_aktor, p_gudang_id, p_tanggal_butuh, p_baris,
        p_keterangan, p_wo_id, p_tanggal_butuh
    );

    v_hasil := jsonb_build_object(
        'permintaan_id', v_pr->>'permintaan_id',
        'wo_id', p_wo_id,
        'nomor', v_pr->'dokumen'->>'nomor',
        'status', v_pr->'dokumen'->>'status'
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'AJUKAN_PR_BAHAN', v_hasil);
    return v_hasil;
end;
$$;


-- 5. Keluarkan bahan: mutasi KELUAR + jurnal + event biaya + first-issue status.
create or replace function public.k10_keluarkan_bahan(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_produk_id uuid,
    p_satuan_id uuid,
    p_gudang_id uuid,
    p_qty numeric,
    p_tanggal timestamptz,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Gudang']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'KELUARKAN_BAHAN');
    v_spk jsonb := public.k10_spk(p_wo_id);
    v_nomor text;
    v_sudah_ada boolean;
    v_mutasi jsonb;
    v_mutasi_id uuid;
    v_harga numeric(18,4);
    v_nilai numeric(18,2);
    v_pengeluaran_id uuid;
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_transisi jsonb;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_spk is null or v_spk->>'status' not in ('BAHAN_CUKUP', 'BAHAN_SIAP', 'REWORK') then
        raise exception 'Bahan hanya dikeluarkan untuk SPK BAHAN_CUKUP, BAHAN_SIAP, atau REWORK.';
    end if;
    if p_qty is null or p_qty <= 0 then
        raise exception 'Jumlah keluar harus lebih dari nol.';
    end if;
    if not exists (select 1 from public.satuan where id = p_satuan_id and aktif = true) then
        raise exception 'Satuan tidak ditemukan atau tidak aktif.';
    end if;

    v_nomor := v_spk->>'nomor';
    select exists (select 1 from public.pengeluaran_bahan where wo_id = p_wo_id)
    into v_sudah_ada;

    v_mutasi := public.catat_mutasi_stok(
        p_produk_id, p_gudang_id, p_tanggal, 'KELUAR', p_qty::numeric(18,4),
        null, 'PEMAKAIAN_BAHAN', public.k10_uuid_dari_kunci(p_kunci_idempotensi),
        p_keterangan, v_aktor
    );
    v_mutasi_id := (v_mutasi->>'mutasi_id')::uuid;
    v_harga := (v_mutasi->>'harga_satuan')::numeric(18,4);
    v_nilai := (v_mutasi->>'nilai')::numeric(18,2);

    insert into public.pengeluaran_bahan (
        wo_id, produk_id, satuan_id, gudang_id, mutasi_stok_id,
        qty_keluar, harga_satuan, nilai_keluar, tanggal, keterangan,
        created_by, updated_by
    ) values (
        p_wo_id, p_produk_id, p_satuan_id, p_gudang_id, v_mutasi_id,
        (v_mutasi->>'qty')::numeric(18,4), v_harga, v_nilai, p_tanggal, p_keterangan,
        v_aktor, v_aktor
    ) returning id into v_pengeluaran_id;

    v_jurnal := public.k10_jurnal(
        p_tanggal, 'PEMAKAIAN_BAHAN', v_pengeluaran_id, v_nomor,
        'Bahan keluar untuk ' || v_nomor,
        'barang_dalam_proses', 'persediaan_bahan', v_nilai, v_aktor
    );
    v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;

    perform public.k10_event(
        p_wo_id, 'BAHAN', 'PEMAKAIAN_BAHAN', v_pengeluaran_id, v_jurnal_id,
        v_nilai, p_tanggal, v_aktor, p_keterangan
    );

    if not v_sudah_ada and v_spk->>'status' in ('BAHAN_CUKUP', 'BAHAN_SIAP') then
        v_transisi := public.k10_pindah_spk(p_wo_id, null, 'BERJALAN', 'MULAI', v_aktor, null);
    end if;

    v_hasil := jsonb_build_object(
        'pengeluaran_id', v_pengeluaran_id,
        'mutasi_id', v_mutasi_id,
        'nilai_keluar', v_nilai::text,
        'harga_satuan', v_harga::text,
        'jurnal_id', v_jurnal_id,
        'dokumen', case when v_transisi is null then null::jsonb else v_transisi->'dokumen' end,
        'riwayat_id', case when v_transisi is null then null::jsonb else v_transisi->'riwayat_id' end,
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'KELUARKAN_BAHAN', v_hasil);
    return v_hasil;
end;
$$;

-- 6. Kembalikan sisa bahan: mutasi MASUK pada harga satuan tersimpan,
--    jurnal pembalik WIP, dan event penyesuaian HPP.
create or replace function public.k10_kembalikan_bahan(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_pengeluaran_id uuid,
    p_qty numeric,
    p_tanggal timestamptz,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Gudang']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'KEMBALIKAN_BAHAN');
    v_wo_id uuid;
    v_produk_id uuid;
    v_gudang_id uuid;
    v_keluar numeric(18,4);
    v_harga numeric(18,4);
    v_sisa numeric(18,4);
    v_sisa_baru numeric(18,4);
    v_nomor text;
    v_mutasi jsonb;
    v_mutasi_id uuid;
    v_nilai numeric(18,2);
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_pemakaian_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    select wo_id, produk_id, gudang_id, qty_keluar, harga_satuan
    into v_wo_id, v_produk_id, v_gudang_id, v_keluar, v_harga
    from public.pengeluaran_bahan where id = p_pengeluaran_id;
    if not found or v_wo_id is distinct from p_wo_id then
        raise exception 'Catatan pengeluaran bahan tidak ditemukan untuk SPK ini.';
    end if;

    select coalesce(sum(qty_sisa), 0) into v_sisa
    from public.pemakaian_bahan where pengeluaran_id = p_pengeluaran_id;
    if p_qty is null or p_qty <= 0 or p_qty::numeric(18,4) > v_keluar - v_sisa then
        raise exception 'Jumlah sisa tidak boleh melebihi jumlah keluar yang belum dikonfirmasi.';
    end if;
    v_sisa_baru := v_sisa + p_qty::numeric(18,4);
    v_nomor := public.k10_spk(p_wo_id)->>'nomor';

    v_mutasi := public.catat_mutasi_stok(
        v_produk_id, v_gudang_id, p_tanggal, 'MASUK', p_qty::numeric(18,4),
        v_harga, 'PEMAKAIAN_BAHAN', public.k10_uuid_dari_kunci(p_kunci_idempotensi),
        p_keterangan, v_aktor
    );
    v_mutasi_id := (v_mutasi->>'mutasi_id')::uuid;
    v_nilai := (v_mutasi->>'nilai')::numeric(18,2);

    v_jurnal := public.k10_jurnal(
        p_tanggal, 'PEMAKAIAN_BAHAN', p_pengeluaran_id, v_nomor,
        'Sisa bahan kembali untuk ' || v_nomor,
        'persediaan_bahan', 'barang_dalam_proses', v_nilai, v_aktor
    );
    v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;

    perform public.k10_event(
        p_wo_id, 'PENYESUAIAN_HPP', 'PEMAKAIAN_BAHAN', p_pengeluaran_id,
        v_jurnal_id, v_nilai, p_tanggal, v_aktor, p_keterangan
    );

    if exists (select 1 from public.pemakaian_bahan where pengeluaran_id = p_pengeluaran_id) then
        update public.pemakaian_bahan
        set qty_sisa = v_sisa_baru,
            qty_terpakai = v_keluar - v_sisa_baru,
            mutasi_stok_sisa_id = v_mutasi_id,
            keterangan = p_keterangan,
            updated_by = v_aktor,
            updated_at = now()
        where pengeluaran_id = p_pengeluaran_id
        returning id into v_pemakaian_id;
    else
        insert into public.pemakaian_bahan (
            pengeluaran_id, wo_id, qty_terpakai, qty_sisa, qty_scrap,
            mutasi_stok_sisa_id, keterangan, created_by, updated_by
        ) values (
            p_pengeluaran_id, p_wo_id, v_keluar - p_qty::numeric(18,4),
            p_qty::numeric(18,4), 0, v_mutasi_id, p_keterangan, v_aktor, v_aktor
        ) returning id into v_pemakaian_id;
    end if;

    v_hasil := jsonb_build_object(
        'pemakaian_id', v_pemakaian_id,
        'mutasi_id', v_mutasi_id,
        'nilai_kembali', v_nilai::text,
        'jurnal_id', v_jurnal_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'KEMBALIKAN_BAHAN', v_hasil);
    return v_hasil;
end;
$$;

-- 7. Konfirmasi pemakaian: tidak menulis stok atau jurnal.
create or replace function public.k10_konfirmasi_pemakaian(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_pengeluaran_id uuid,
    p_qty_scrap numeric,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Produksi']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'KONFIRMASI_PEMAKAIAN');
    v_keluar numeric(18,4);
    v_sisa numeric(18,4);
    v_scrap numeric(18,4);
    v_terpakai numeric(18,4);
    v_pemakaian_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    select qty_keluar into v_keluar
    from public.pengeluaran_bahan where id = p_pengeluaran_id and wo_id = p_wo_id;
    if not found then
        raise exception 'Catatan pengeluaran bahan tidak ditemukan untuk SPK ini.';
    end if;
    select coalesce(qty_sisa, 0) into v_sisa
    from public.pemakaian_bahan where pengeluaran_id = p_pengeluaran_id;
    v_scrap := coalesce(p_qty_scrap, 0)::numeric(18,4);
    if v_scrap < 0 then
        raise exception 'Jumlah scrap tidak boleh negatif.';
    end if;
    v_terpakai := v_keluar - coalesce(v_sisa, 0) - v_scrap;
    if v_terpakai < 0 then
        raise exception 'Terpakai, sisa, dan scrap harus sama dengan jumlah keluar.';
    end if;

    if exists (select 1 from public.pemakaian_bahan where pengeluaran_id = p_pengeluaran_id) then
        update public.pemakaian_bahan
        set qty_terpakai = v_terpakai,
            qty_scrap = v_scrap,
            keterangan = p_keterangan,
            updated_by = v_aktor,
            updated_at = now()
        where pengeluaran_id = p_pengeluaran_id
        returning id into v_pemakaian_id;
    else
        insert into public.pemakaian_bahan (
            pengeluaran_id, wo_id, qty_terpakai, qty_sisa, qty_scrap,
            keterangan, created_by, updated_by
        ) values (
            p_pengeluaran_id, p_wo_id, v_terpakai, 0, v_scrap,
            p_keterangan, v_aktor, v_aktor
        ) returning id into v_pemakaian_id;
    end if;

    v_hasil := jsonb_build_object(
        'pemakaian_id', v_pemakaian_id,
        'qty_terpakai', v_terpakai::text,
        'qty_sisa', coalesce(v_sisa, 0)::text,
        'qty_scrap', v_scrap::text
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'KONFIRMASI_PEMAKAIAN', v_hasil);
    return v_hasil;
end;
$$;

-- 8. Catat hasil produksi (multi-attempt) dan pindah ke HASIL_DICATAT.
drop function if exists public.k10_catat_hasil(uuid, uuid, integer, numeric, timestamptz, text, text);
create or replace function public.k10_catat_hasil(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_percobaan integer,
    p_qty_diproses numeric,
    p_kunci_idempotensi text,
    p_tanggal timestamptz default null,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Produksi']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'CATAT_HASIL');
    v_spk jsonb := public.k10_spk(p_wo_id);
    v_hasil_id uuid;
    v_transisi jsonb;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_spk is null or v_spk->>'status' not in ('BERJALAN', 'REWORK') then
        raise exception 'Hasil hanya bisa dicatat saat perintah BERJALAN atau REWORK.';
    end if;
    if p_percobaan is null or p_percobaan <= 0 or p_qty_diproses is null or p_qty_diproses <= 0 then
        raise exception 'Percobaan dan jumlah diproses harus lebih dari nol.';
    end if;
    if exists (
        select 1 from public.pengeluaran_bahan pb
        where pb.wo_id = p_wo_id
          and not exists (
              select 1 from public.pemakaian_bahan pm where pm.pengeluaran_id = pb.id
          )
    ) then
        raise exception 'Semua bahan yang dikeluarkan harus dikonfirmasi sebelum hasil dicatat.';
    end if;

    insert into public.hasil_produksi (
        wo_id, percobaan, qty_diproses, tanggal, keterangan, created_by, updated_by
    ) values (
        p_wo_id, p_percobaan, p_qty_diproses::numeric(18,4),
        coalesce(p_tanggal, now()), p_keterangan, v_aktor, v_aktor
    ) returning id into v_hasil_id;

    v_transisi := public.k10_pindah_spk(
        p_wo_id, null, 'HASIL_DICATAT', 'CATAT_HASIL', v_aktor, null
    );

    v_hasil := jsonb_build_object(
        'hasil_id', v_hasil_id,
        'percobaan', p_percobaan,
        'dokumen', v_transisi->'dokumen',
        'riwayat_id', v_transisi->'riwayat_id',
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'CATAT_HASIL', v_hasil);
    return v_hasil;
end;
$$;


-- 9. Keputusan QC: pembagian L/R/J, kerugian abnormal, dan status WO.
create or replace function public.k10_catat_qc(
    p_aktor_id uuid,
    p_hasil_id uuid,
    p_wo_id uuid,
    p_qty_lulus numeric,
    p_qty_rework numeric,
    p_qty_reject numeric,
    p_kunci_idempotensi text,
    p_catatan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['QC']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'CATAT_QC');
    v_diproses numeric(18,4);
    v_pencatat uuid;
    v_lulus numeric(18,4) := coalesce(p_qty_lulus, 0)::numeric(18,4);
    v_rework numeric(18,4) := coalesce(p_qty_rework, 0)::numeric(18,4);
    v_reject numeric(18,4) := coalesce(p_qty_reject, 0)::numeric(18,4);
    v_keputusan text;
    v_toleransi numeric(18,4);
    v_total_biaya numeric(18,2);
    v_biaya_per_unit numeric(18,4);
    v_kerugian numeric(18,2);
    v_nilai_per_unit_baik numeric(18,2);
    v_nomor text;
    v_qc_id uuid;
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_transisi jsonb;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_lulus < 0 or v_rework < 0 or v_reject < 0 then
        raise exception 'Jumlah lulus, rework, dan reject tidak boleh negatif.';
    end if;
    select h.qty_diproses, h.created_by into v_diproses, v_pencatat
    from public.hasil_produksi h where h.id = p_hasil_id and h.wo_id = p_wo_id;
    if not found then
        raise exception 'Catatan hasil produksi tidak ditemukan untuk SPK ini.';
    end if;
    if v_pencatat = v_aktor then
        raise exception 'Pencatat hasil tidak boleh menjadi pemeriksa QC untuk hasil yang sama.';
    end if;
    if v_lulus + v_rework + v_reject <> v_diproses then
        raise exception 'Lulus, rework, dan reject harus sama dengan jumlah diproses.';
    end if;
    if exists (select 1 from public.quality_check where hasil_produksi_id = p_hasil_id) then
        raise exception 'Keputusan QC untuk hasil ini sudah tercatat.';
    end if;

    v_keputusan := case
        when v_rework > 0 then 'REWORK'
        when v_lulus = 0 then 'REJECTED'
        else 'QC_PASSED'
    end;

    select bv.toleransi_reject into v_toleransi
    from public.perintah_produksi pp
    join public.bom_versi bv on bv.id = pp.bom_versi_id
    where pp.dokumen_id = p_wo_id;
    select coalesce(sum(case
        when e.jenis = 'KERUGIAN' then -e.nominal
        when e.jenis = 'PENYESUAIAN_HPP' and e.sumber_tipe = 'PEMAKAIAN_BAHAN' then -e.nominal
        else e.nominal
    end), 0)
    into v_total_biaya
    from public.biaya_produksi_event e where e.wo_id = p_wo_id;
    v_biaya_per_unit := round(v_total_biaya / v_diproses, 4);
    v_kerugian := round(
        greatest(0::numeric, v_reject - (coalesce(v_toleransi, 0) / 100) * v_diproses)
        * v_biaya_per_unit, 0
    )::numeric(18,2);
    v_nilai_per_unit_baik := case
        when v_lulus > 0 then round(greatest(0::numeric, v_total_biaya - v_kerugian) / v_lulus, 0)::numeric(18,2)
        else 0::numeric(18,2)
    end;

    if v_kerugian > 0 and not exists (
        select 1 from public.akun
        where peran = 'kerugian_produksi_abnormal' and aktif = true
    ) then
        raise exception 'Akun peran kerugian_produksi_abnormal belum tersedia di COA; jurnal kerugian produksi abnormal menunggu keputusan akun.';
    end if;

    insert into public.quality_check (
        hasil_produksi_id, wo_id, qty_lulus, qty_rework, qty_reject,
        keputusan, catatan, created_by, updated_by
    ) values (
        p_hasil_id, p_wo_id, v_lulus, v_rework, v_reject,
        v_keputusan, p_catatan, v_aktor, v_aktor
    ) returning id into v_qc_id;

    if v_kerugian > 0 then
        v_nomor := public.k10_spk(p_wo_id)->>'nomor';
        v_jurnal := public.k10_jurnal(
            now(), 'HASIL_PRODUKSI', p_hasil_id, v_nomor,
            'Kerugian produksi abnormal ' || v_nomor,
            'kerugian_produksi_abnormal', 'barang_dalam_proses',
            v_kerugian, v_aktor
        );
        v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;
        perform public.k10_event(
            p_wo_id, 'KERUGIAN', 'HASIL_PRODUKSI', p_hasil_id, v_jurnal_id,
            v_kerugian, now(), v_aktor, p_catatan
        );
    end if;

    v_transisi := public.k10_pindah_spk(p_wo_id, null, v_keputusan, 'QC', v_aktor, null);

    v_hasil := jsonb_build_object(
        'qc_id', v_qc_id,
        'keputusan', v_keputusan,
        'nilai_per_unit_baik', v_nilai_per_unit_baik::text,
        'kerugian_abnormal', v_kerugian::text,
        'qty_lulus', v_lulus::text,
        'jurnal_id', case when v_jurnal_id is null then null::jsonb else to_jsonb(v_jurnal_id) end,
        'dokumen', v_transisi->'dokumen',
        'riwayat_id', v_transisi->'riwayat_id',
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'CATAT_QC', v_hasil);
    return v_hasil;
end;
$$;

-- 10. Terima barang jadi lulus; nilai per unit berasal dari registry QC.
create or replace function public.k10_terima_barang_jadi(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_gudang_id uuid,
    p_qty numeric,
    p_tanggal timestamptz,
    p_kunci_qc text,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Gudang']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'TERIMA_BARANG_JADI');
    v_spk jsonb := public.k10_spk(p_wo_id);
    v_qc jsonb;
    v_nilai_per_unit numeric(18,2);
    v_lulus numeric(18,4);
    v_diterima numeric(18,4);
    v_mutasi jsonb;
    v_mutasi_id uuid;
    v_nilai numeric(18,2);
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_transisi jsonb;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_spk is null or v_spk->>'status' <> 'QC_PASSED' then
        raise exception 'Barang jadi hanya diterima dari SPK berstatus QC_PASSED.';
    end if;
    select hasil into v_qc
    from public.k10_idempotensi
    where kunci = p_kunci_qc and operasi = 'CATAT_QC';
    if v_qc is null or v_qc->>'keputusan' <> 'QC_PASSED' then
        raise exception 'Keputusan QC lulus tidak ditemukan untuk kunci ini.';
    end if;
    v_nilai_per_unit := (v_qc->>'nilai_per_unit_baik')::numeric(18,2);
    v_lulus := (v_qc->>'qty_lulus')::numeric(18,4);

    select coalesce(sum(m.qty), 0) into v_diterima
    from public.mutasi_stok m
    where m.sumber_tipe = 'PENERIMAAN_BARANG_JADI'
      and m.sumber_id in (
          select public.k10_uuid_dari_kunci(i.kunci)
          from public.k10_idempotensi i
          where i.operasi = 'TERIMA_BARANG_JADI'
            and i.hasil->>'wo_id' = p_wo_id::text
      );
    if p_qty is null or p_qty <= 0 or v_diterima + p_qty::numeric(18,4) > v_lulus then
        raise exception 'Jumlah diterima melebihi jumlah lulus QC yang tersisa.';
    end if;

    v_mutasi := public.catat_mutasi_stok(
        (select produk_id from public.perintah_produksi where dokumen_id = p_wo_id),
        p_gudang_id, p_tanggal, 'MASUK', p_qty::numeric(18,4),
        v_nilai_per_unit, 'PENERIMAAN_BARANG_JADI',
        public.k10_uuid_dari_kunci(p_kunci_idempotensi), p_keterangan, v_aktor
    );
    v_mutasi_id := (v_mutasi->>'mutasi_id')::uuid;
    v_nilai := (v_mutasi->>'nilai')::numeric(18,2);

    v_jurnal := public.k10_jurnal(
        p_tanggal, 'PENERIMAAN_BARANG_JADI', v_mutasi_id, v_spk->>'nomor',
        'Barang jadi diterima ' || (v_spk->>'nomor'),
        'persediaan_barang_jadi', 'barang_dalam_proses', v_nilai, v_aktor
    );
    v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;

    if v_diterima + p_qty::numeric(18,4) = v_lulus then
        v_transisi := public.k10_pindah_spk(p_wo_id, null, 'SELESAI', 'SELESAI', v_aktor, null);
    end if;

    v_hasil := jsonb_build_object(
        'mutasi_id', v_mutasi_id,
        'nilai', v_nilai::text,
        'jurnal_id', v_jurnal_id,
        'dokumen', case when v_transisi is null then null::jsonb else v_transisi->'dokumen' end,
        'riwayat_id', case when v_transisi is null then null::jsonb else v_transisi->'riwayat_id' end,
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'TERIMA_BARANG_JADI', v_hasil);
    return v_hasil;
end;
$$;

-- 11. Kartu jam kerja per WO/karyawan/tanggal.
create or replace function public.k10_catat_kjk(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_karyawan_id uuid,
    p_tanggal date,
    p_jam_kerja numeric,
    p_tarif_per_jam numeric,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Produksi']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'CATAT_KJK');
    v_kartu_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if public.k10_spk(p_wo_id) is null then
        raise exception 'Perintah produksi tidak ditemukan.';
    end if;
    if p_jam_kerja is null or p_jam_kerja <= 0 or p_tarif_per_jam is null or p_tarif_per_jam < 0 then
        raise exception 'Jam kerja harus lebih dari nol dan tarif tidak boleh negatif.';
    end if;
    if not exists (select 1 from public.karyawan where id = p_karyawan_id) then
        raise exception 'Karyawan tidak ditemukan.';
    end if;

    insert into public.kartu_jam_kerja (
        wo_id, karyawan_id, tanggal, jam_kerja, tarif_per_jam,
        keterangan, created_by, updated_by
    ) values (
        p_wo_id, p_karyawan_id, p_tanggal, p_jam_kerja::numeric(18,4),
        p_tarif_per_jam::numeric(18,4), p_keterangan, v_aktor, v_aktor
    ) returning id into v_kartu_id;

    v_hasil := jsonb_build_object('kartu_id', v_kartu_id);
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'CATAT_KJK', v_hasil);
    return v_hasil;
end;
$$;

-- 12. Tetapkan tarif overhead predeterminasi (D-12).
create or replace function public.k10_tetapkan_tarif_overhead(
    p_aktor_id uuid,
    p_berlaku_dari date,
    p_tarif numeric,
    p_kapasitas_normal numeric,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Accounting']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'TARIF_OVERHEAD');
    v_tarif_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if p_berlaku_dari is null or p_tarif is null or p_tarif < 0
        or p_kapasitas_normal is null or p_kapasitas_normal <= 0 then
        raise exception 'Tarif overhead dan kapasitas normal harus valid.';
    end if;
    if exists (select 1 from public.tarif_overhead where berlaku_dari = p_berlaku_dari) then
        raise exception 'Tarif overhead untuk tanggal berlaku ini sudah ditetapkan.';
    end if;

    insert into public.tarif_overhead (
        berlaku_dari, tarif, kapasitas_normal, keterangan, created_by, updated_by
    ) values (
        p_berlaku_dari, p_tarif::numeric(18,4), p_kapasitas_normal::numeric(18,4),
        p_keterangan, v_aktor, v_aktor
    ) returning id into v_tarif_id;

    v_hasil := jsonb_build_object('tarif_id', v_tarif_id);
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'TARIF_OVERHEAD', v_hasil);
    return v_hasil;
end;
$$;


-- 13. Catat overhead aktual per periode dan akun (D-12, F4).
create or replace function public.k10_catat_overhead_aktual(
    p_aktor_id uuid,
    p_periode date,
    p_akun_id uuid,
    p_nilai numeric,
    p_kunci_idempotensi text,
    p_keterangan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Accounting']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'OVERHEAD_AKTUAL');
    v_id uuid;
    v_nilai numeric(18,2);
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if p_periode is null or p_periode <> date_trunc('month', p_periode)::date then
        raise exception 'Periode overhead aktual harus tanggal awal bulan.';
    end if;
    if p_nilai is null or p_nilai < 0 then
        raise exception 'Nilai overhead aktual tidak boleh negatif.';
    end if;
    if not exists (select 1 from public.akun where id = p_akun_id and aktif = true) then
        raise exception 'Akun tidak ditemukan atau tidak aktif.';
    end if;
    v_nilai := round(p_nilai, 0)::numeric(18,2);
    if exists (
        select 1 from public.overhead_aktual
        where periode = p_periode and akun_id = p_akun_id
    ) then
        raise exception 'Overhead aktual untuk periode dan akun ini sudah tercatat.';
    end if;

    insert into public.overhead_aktual (
        periode, akun_id, nilai, keterangan, created_by, updated_by
    ) values (
        p_periode, p_akun_id, v_nilai, p_keterangan, v_aktor, v_aktor
    ) returning id into v_id;

    v_hasil := jsonb_build_object('overhead_aktual_id', v_id);
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'OVERHEAD_AKTUAL', v_hasil);
    return v_hasil;
end;
$$;

-- 14. Pembebanan TKL: satu jurnal dan event per kartu jam kerja.
create or replace function public.k10_bebankan_tkl(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_kartu_ids uuid[],
    p_tanggal timestamptz,
    p_kunci_idempotensi text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Accounting']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'BEBANKAN_TKL');
    v_nomor text;
    v_kartu_id uuid;
    v_jam numeric(18,4);
    v_tarif numeric(18,4);
    v_nominal numeric(18,2);
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_event_id uuid;
    v_jurnal_ids jsonb := '[]'::jsonb;
    v_event_ids jsonb := '[]'::jsonb;
    v_total numeric(18,2) := 0;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if public.k10_spk(p_wo_id) is null then
        raise exception 'Perintah produksi tidak ditemukan.';
    end if;
    if p_kartu_ids is null or cardinality(p_kartu_ids) = 0 then
        raise exception 'Minimal satu kartu jam kerja wajib dipilih.';
    end if;
    if (select count(*) from (select distinct unnest(p_kartu_ids)) as x) <> cardinality(p_kartu_ids) then
        raise exception 'Kartu jam kerja tidak boleh dibebankan dua kali.';
    end if;
    v_nomor := public.k10_spk(p_wo_id)->>'nomor';

    foreach v_kartu_id in array p_kartu_ids loop
        select jam_kerja, tarif_per_jam into v_jam, v_tarif
        from public.kartu_jam_kerja where id = v_kartu_id and wo_id = p_wo_id;
        if not found then
            raise exception 'Kartu jam kerja tidak ditemukan untuk SPK ini.';
        end if;
        if exists (
            select 1 from public.biaya_produksi_event
            where sumber_tipe = 'PERINTAH_PRODUKSI' and sumber_id = v_kartu_id
        ) then
            raise exception 'Kartu jam kerja sudah dibebankan.';
        end if;
        v_nominal := round(v_jam * v_tarif, 0)::numeric(18,2);
        if v_nominal is null or v_nominal <= 0 then
            raise exception 'Tarif per jam kartu jam kerja harus lebih dari nol.';
        end if;

        v_jurnal := public.k10_jurnal(
            p_tanggal, 'PERINTAH_PRODUKSI', v_kartu_id, v_nomor,
            'TKL kartu ' || v_kartu_id::text,
            'barang_dalam_proses', 'tenaga_kerja_langsung', v_nominal, v_aktor
        );
        v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;
        v_event_id := public.k10_event(
            p_wo_id, 'TKL', 'PERINTAH_PRODUKSI', v_kartu_id, v_jurnal_id,
            v_nominal, p_tanggal, v_aktor, 'Pembebanan TKL kartu ' || v_kartu_id::text
        );
        v_jurnal_ids := v_jurnal_ids || jsonb_build_array(v_jurnal_id);
        v_event_ids := v_event_ids || jsonb_build_array(v_event_id);
        v_total := v_total + v_nominal;
    end loop;

    v_hasil := jsonb_build_object(
        'total', v_total::text,
        'jurnal_ids', v_jurnal_ids,
        'event_ids', v_event_ids,
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'BEBANKAN_TKL', v_hasil);
    return v_hasil;
end;
$$;

-- 15. Pembebanan overhead memakai tarif predeterminasi berlaku (D-12).
create or replace function public.k10_bebankan_overhead(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_dlh numeric,
    p_tanggal timestamptz,
    p_kunci_idempotensi text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Accounting']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'BEBANKAN_OVERHEAD');
    v_nomor text;
    v_tarif_id uuid;
    v_tarif numeric(18,4);
    v_nominal numeric(18,2);
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_event_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if public.k10_spk(p_wo_id) is null then
        raise exception 'Perintah produksi tidak ditemukan.';
    end if;
    if p_dlh is null or p_dlh <= 0 then
        raise exception 'DLH harus lebih dari nol.';
    end if;
    select id, tarif into v_tarif_id, v_tarif
    from public.tarif_overhead
    where berlaku_dari <= p_tanggal::date
    order by berlaku_dari desc
    limit 1;
    if not found then
        raise exception 'Tarif overhead untuk periode ini belum ditetapkan.';
    end if;
    v_nominal := round(p_dlh * v_tarif, 0)::numeric(18,2);
    if v_nominal <= 0 then
        raise exception 'Tarif overhead harus lebih dari nol.';
    end if;
    v_nomor := public.k10_spk(p_wo_id)->>'nomor';

    v_jurnal := public.k10_jurnal(
        p_tanggal, 'PERINTAH_PRODUKSI', v_tarif_id, v_nomor,
        'Overhead-pabrikan ' || v_nomor,
        'barang_dalam_proses', 'overhead_pabrik', v_nominal, v_aktor
    );
    v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;
    v_event_id := public.k10_event(
        p_wo_id, 'OVERHEAD', 'PERINTAH_PRODUKSI', v_tarif_id, v_jurnal_id,
        v_nominal, p_tanggal, v_aktor, 'Pembebanan overhead DLH ' || p_dlh::text
    );

    v_hasil := jsonb_build_object(
        'tarif_id', v_tarif_id,
        'nominal', v_nominal::text,
        'jurnal_id', v_jurnal_id,
        'event_id', v_event_id,
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'BEBANKAN_OVERHEAD', v_hasil);
    return v_hasil;
end;
$$;

-- 16. HPP final: rangkuman event dan penyesuaian sisa WIP dalam transaksi ini.
create or replace function public.k10_hitung_hpp_final(
    p_aktor_id uuid,
    p_wo_id uuid,
    p_kunci_idempotensi text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.k10_assert_peran(p_aktor_id, array['Accounting']);
    v_hasil jsonb := public.k10_idempotensi_mulai(p_kunci_idempotensi, 'HPP_FINAL');
    v_spk jsonb := public.k10_spk(p_wo_id);
    v_lulus numeric(18,4);
    v_total_hpp numeric(18,2);
    v_sisa numeric(18,2);
    v_hpp_per_unit numeric(18,2);
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_event_id uuid;
begin
    if v_hasil is not null then
        return v_hasil;
    end if;
    if v_spk is null or v_spk->>'status' <> 'SELESAI' then
        raise exception 'HPP final hanya dihitung untuk SPK berstatus SELESAI.';
    end if;

    select coalesce(sum(qc.qty_lulus), 0) into v_lulus
    from public.quality_check qc
    join public.hasil_produksi h on h.id = qc.hasil_produksi_id
    where h.wo_id = p_wo_id;

    select coalesce(sum(case
        when e.jenis = 'KERUGIAN' then -e.nominal
        when e.jenis = 'PENYESUAIAN_HPP' and e.sumber_tipe = 'PEMAKAIAN_BAHAN' then -e.nominal
        else e.nominal
    end), 0) into v_total_hpp
    from public.biaya_produksi_event e where e.wo_id = p_wo_id;

    select coalesce(sum(d.debit - d.kredit), 0) into v_sisa
    from public.detail_jurnal d
    join public.akun a on a.id = d.akun_id and a.peran = 'barang_dalam_proses'
    where d.jurnal_id in (
        select distinct (u.jid #>> '{}')::uuid
        from public.k10_idempotensi i
        cross join lateral jsonb_array_elements(
            case
                when jsonb_typeof(i.hasil->'jurnal_ids') = 'array' then i.hasil->'jurnal_ids'
                when i.hasil ? 'jurnal_id' and i.hasil->'jurnal_id' <> 'null'::jsonb
                    then jsonb_build_array(i.hasil->'jurnal_id')
                else '[]'::jsonb
            end
        ) as u(jid)
        where i.hasil->>'wo_id' = p_wo_id::text
    );


    if v_sisa > 0 then
        v_jurnal := public.k10_jurnal(
            now(), 'PERINTAH_PRODUKSI', p_wo_id, v_spk->>'nomor',
            'Penyesuaian HPP final ' || (v_spk->>'nomor'),
            'hpp', 'barang_dalam_proses', v_sisa, v_aktor
        );
        v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;
        v_event_id := public.k10_event(
            p_wo_id, 'PENYESUAIAN_HPP', 'PERINTAH_PRODUKSI', p_wo_id,
            v_jurnal_id, v_sisa, now(), v_aktor, 'Penyesuaian HPP final'
        );
    end if;
    v_total_hpp := v_total_hpp + v_sisa;
    v_hpp_per_unit := case
        when coalesce(v_lulus, 0) > 0 then round(v_total_hpp / v_lulus, 2)::numeric(18,2)
        else 0::numeric(18,2)
    end;

    v_hasil := jsonb_build_object(
        'total_hpp', v_total_hpp::text,
        'qty_lulus', coalesce(v_lulus, 0)::text,
        'hpp_per_unit', v_hpp_per_unit::text,
        'jurnal_id', case when v_jurnal_id is null then null::jsonb else to_jsonb(v_jurnal_id) end,
        'event_id', case when v_event_id is null then null::jsonb else to_jsonb(v_event_id) end,
        'wo_id', p_wo_id
    );
    perform public.k10_idempotensi_simpan(p_kunci_idempotensi, 'HPP_FINAL', v_hasil);
    return v_hasil;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Hak eksekusi: helper dan RPC hanya untuk service_role.
-- ---------------------------------------------------------------------------

revoke all on function public.k10_uuid_dari_kunci(text) from public, anon, authenticated;
revoke all on function public.k10_assert_peran(uuid, text[]) from public, anon, authenticated;
revoke all on function public.k10_idempotensi_mulai(text, text) from public, anon, authenticated;
revoke all on function public.k10_idempotensi_simpan(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.k10_spk(uuid) from public, anon, authenticated;
revoke all on function public.k10_pindah_spk(uuid, bigint, text, text, uuid, text)
    from public, anon, authenticated;
revoke all on function public.k10_jurnal(timestamptz, text, uuid, text, text, text, text, numeric, uuid)
    from public, anon, authenticated;
revoke all on function public.k10_event(uuid, text, text, uuid, uuid, numeric, timestamptz, uuid, text)
    from public, anon, authenticated;

revoke all on function public.k10_simpan_versi_bom(uuid, uuid, date, numeric, numeric, jsonb, text)
    from public, anon, authenticated;
revoke all on function public.k10_buat_spk(uuid, uuid, uuid, uuid, date, date, numeric, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_pindah_status_spk(uuid, uuid, bigint, text, text, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_ajukan_permintaan_bahan(uuid, uuid, uuid, date, jsonb, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_keluarkan_bahan(uuid, uuid, uuid, uuid, uuid, numeric, timestamptz, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_kembalikan_bahan(uuid, uuid, uuid, numeric, timestamptz, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_konfirmasi_pemakaian(uuid, uuid, uuid, numeric, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_catat_hasil(uuid, uuid, integer, numeric, text, timestamptz, text)
    from public, anon, authenticated;
revoke all on function public.k10_catat_qc(uuid, uuid, uuid, numeric, numeric, numeric, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_terima_barang_jadi(uuid, uuid, uuid, numeric, timestamptz, text, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_catat_kjk(uuid, uuid, uuid, date, numeric, numeric, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_tetapkan_tarif_overhead(uuid, date, numeric, numeric, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_catat_overhead_aktual(uuid, date, uuid, numeric, text, text)
    from public, anon, authenticated;
revoke all on function public.k10_bebankan_tkl(uuid, uuid, uuid[], timestamptz, text)
    from public, anon, authenticated;
revoke all on function public.k10_bebankan_overhead(uuid, uuid, numeric, timestamptz, text)
    from public, anon, authenticated;
revoke all on function public.k10_hitung_hpp_final(uuid, uuid, text)
    from public, anon, authenticated;

grant execute on function public.k10_uuid_dari_kunci(text) to service_role;
grant execute on function public.k10_assert_peran(uuid, text[]) to service_role;
grant execute on function public.k10_idempotensi_mulai(text, text) to service_role;
grant execute on function public.k10_idempotensi_simpan(text, text, jsonb) to service_role;
grant execute on function public.k10_spk(uuid) to service_role;
grant execute on function public.k10_pindah_spk(uuid, bigint, text, text, uuid, text) to service_role;
grant execute on function public.k10_jurnal(timestamptz, text, uuid, text, text, text, text, numeric, uuid)
    to service_role;
grant execute on function public.k10_event(uuid, text, text, uuid, uuid, numeric, timestamptz, uuid, text)
    to service_role;

grant execute on function public.k10_simpan_versi_bom(uuid, uuid, date, numeric, numeric, jsonb, text)
    to service_role;
grant execute on function public.k10_buat_spk(uuid, uuid, uuid, uuid, date, date, numeric, text, text)
    to service_role;
grant execute on function public.k10_pindah_status_spk(uuid, uuid, bigint, text, text, text, text)
    to service_role;
grant execute on function public.k10_ajukan_permintaan_bahan(uuid, uuid, uuid, date, jsonb, text, text)
    to service_role;
grant execute on function public.k10_keluarkan_bahan(uuid, uuid, uuid, uuid, uuid, numeric, timestamptz, text, text)
    to service_role;
grant execute on function public.k10_kembalikan_bahan(uuid, uuid, uuid, numeric, timestamptz, text, text)
    to service_role;
grant execute on function public.k10_konfirmasi_pemakaian(uuid, uuid, uuid, numeric, text, text)
    to service_role;
grant execute on function public.k10_catat_hasil(uuid, uuid, integer, numeric, text, timestamptz, text)
    to service_role;
grant execute on function public.k10_catat_qc(uuid, uuid, uuid, numeric, numeric, numeric, text, text)
    to service_role;
grant execute on function public.k10_terima_barang_jadi(uuid, uuid, uuid, numeric, timestamptz, text, text, text)
    to service_role;
grant execute on function public.k10_catat_kjk(uuid, uuid, uuid, date, numeric, numeric, text, text)
    to service_role;
grant execute on function public.k10_tetapkan_tarif_overhead(uuid, date, numeric, numeric, text, text)
    to service_role;
grant execute on function public.k10_catat_overhead_aktual(uuid, date, uuid, numeric, text, text)
    to service_role;
grant execute on function public.k10_bebankan_tkl(uuid, uuid, uuid[], timestamptz, text)
    to service_role;
grant execute on function public.k10_bebankan_overhead(uuid, uuid, numeric, timestamptz, text)
    to service_role;
grant execute on function public.k10_hitung_hpp_final(uuid, uuid, text)
    to service_role;

commit;
