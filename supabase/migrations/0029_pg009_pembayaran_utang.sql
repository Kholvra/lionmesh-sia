-- PG-009: pembayaran utang pemasok.
--
-- Finance mencatat pembayaran, Accounting memverifikasi, lalu Finance mencatat
-- hasil transfer. Hanya transfer berhasil yang memposting jurnal Dr 201 / Cr 102
-- dan mengurangi sisa utang invoice. Status berhasil memakai DIPOSTING.

-- ---------------------------------------------------------------------------
-- Master rekening bank (placeholder, menunggu keputusan tech lead)
-- ---------------------------------------------------------------------------

create table public.rekening_bank (
    id uuid primary key default gen_random_uuid(),
    nama_bank text not null,
    nomor text not null,
    nama_pemilik text not null,
    aktif boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_rekening_bank_nama_not_blank check (length(btrim(nama_bank)) > 0),
    constraint ck_rekening_bank_nomor check (nomor ~ '^[0-9]+$'),
    constraint ck_rekening_bank_pemilik_not_blank check (length(btrim(nama_pemilik)) > 0)
);

create unique index uq_rekening_bank_nomor on public.rekening_bank (nama_bank, nomor);

-- ---------------------------------------------------------------------------
-- Jenis dokumen pembayaran
-- ---------------------------------------------------------------------------

insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('PEMBAYARAN_PEMASOK', 'Pembayaran pemasok', 'DIAJUKAN', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('PEMBAYARAN_PEMASOK', 'DIAJUKAN', 1),
    ('PEMBAYARAN_PEMASOK', 'DIPOSTING', 2),
    ('PEMBAYARAN_PEMASOK', 'GAGAL_TRANSFER', 3),
    ('PEMBAYARAN_PEMASOK', 'DIBATALKAN', 4)
on conflict (tipe, status) do nothing;

insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan) values
    ('DIAJUKAN', 'DIPOSTING', 'POSTING', false),
    ('DIAJUKAN', 'GAGAL_TRANSFER', 'GAGAL', true),
    ('DIPOSTING', 'DIBATALKAN', 'BATAL', true),
    -- Invoice status is recomputed when a payment is reversed (R-09); these
    -- edges are the backward form of TERCATAT -> DIBAYAR_SEBAGIAN -> LUNAS.
    ('LUNAS', 'DIBAYAR_SEBAGIAN', 'BATAL_BAYAR', false),
    ('DIBAYAR_SEBAGIAN', 'TERCATAT', 'BATAL_BAYAR', false),
    ('LUNAS', 'TERCATAT', 'BATAL_BAYAR', false)
on conflict (dari_status, ke_status, aksi) do nothing;

insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('PEMBAYARAN_PEMASOK', 'Pembayaran pemasok', array['Finance'])
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.pembayaran_pemasok (
    dokumen_id uuid primary key references public.dokumen (id),
    pemasok_id uuid not null references public.pemasok (id),
    rekening_bank_id uuid not null references public.rekening_bank (id),
    nominal numeric(18,2) not null,
    tanggal date not null,
    alasan_gagal text,
    bukti_transfer_path text,
    jurnal_id uuid,
    diverifikasi_oleh uuid,
    diverifikasi_pada timestamptz,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_pembayaran_nominal_positif check (nominal > 0),
    constraint ck_pembayaran_nominal_bulat check (nominal = trunc(nominal))
);

create index idx_pembayaran_pemasok_pemasok on public.pembayaran_pemasok (pemasok_id);
create index idx_pembayaran_pemasok_tanggal on public.pembayaran_pemasok (tanggal);

create table public.pembayaran_pemasok_alokasi (
    id uuid primary key default gen_random_uuid(),
    pembayaran_id uuid not null references public.pembayaran_pemasok (dokumen_id),
    invoice_id uuid not null references public.invoice_pemasok (dokumen_id),
    nominal numeric(18,2) not null,
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_pembayaran_alokasi unique (pembayaran_id, invoice_id),
    constraint ck_pembayaran_alokasi_nominal check (nominal > 0),
    constraint ck_pembayaran_alokasi_urutan check (urutan > 0)
);

create index idx_pembayaran_alokasi_pembayaran on public.pembayaran_pemasok_alokasi (pembayaran_id);
create index idx_pembayaran_alokasi_invoice on public.pembayaran_pemasok_alokasi (invoice_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Sisa utang invoice dihitung dari alokasi pembayaran yang masih aktif
-- (DIAJUKAN menunggu hasil, DIPOSTING sudah mengurangi utang).
create or replace function public.invoice_pemasok_sisa(p_invoice_id uuid)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select greatest(
        coalesce(i.total, 0) - coalesce((
            select sum(a.nominal)
            from public.pembayaran_pemasok_alokasi a
            join public.dokumen d on d.id = a.pembayaran_id
            where a.invoice_id = p_invoice_id
              and d.status in ('DIAJUKAN', 'DIPOSTING')
        ), 0),
        0
    )
    from public.invoice_pemasok i
    where i.dokumen_id = p_invoice_id;
$$;

create or replace function public.pembayaran_pemasok_aktif(p_pemasok_id uuid)
returns table (invoice_id uuid, nomor text, tanggal date, sisa numeric)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select i.dokumen_id, d.nomor, i.tanggal, public.invoice_pemasok_sisa(i.dokumen_id)
    from public.invoice_pemasok i
    join public.dokumen d on d.id = i.dokumen_id
    where i.pemasok_id = p_pemasok_id
      and d.status in ('TERCATAT', 'DIBAYAR_SEBAGIAN')
      and public.invoice_pemasok_sisa(i.dokumen_id) > 0
    order by i.tanggal asc, d.nomor asc;
$$;

-- Recompute one invoice status after a payment is posted or reversed.
create or replace function public.pembayaran_pemasok_sinkron_invoice(
    p_invoice_id uuid,
    p_aktor_id uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_dokumen public.dokumen;
    v_total numeric(18,2);
    v_sisa numeric(18,2);
    v_target text;
    v_aksi text;
begin
    select * into v_dokumen from public.dokumen where id = p_invoice_id for update;
    if not found then
        return null;
    end if;

    select total into v_total from public.invoice_pemasok where dokumen_id = p_invoice_id;
    v_sisa := public.invoice_pemasok_sisa(p_invoice_id);

    v_target := case
        when v_sisa <= 0 then 'LUNAS'
        when v_sisa < v_total then 'DIBAYAR_SEBAGIAN'
        else 'TERCATAT'
    end;

    if v_target = v_dokumen.status then
        return v_target;
    end if;

    v_aksi := case
        when v_target = 'LUNAS' or (v_target = 'DIBAYAR_SEBAGIAN' and v_dokumen.status = 'TERCATAT')
            then 'BAYAR'
        else 'BATAL_BAYAR'
    end;

    perform public.pindah_status_dokumen(
        p_invoice_id, v_dokumen.versi, v_target, v_aksi, p_aktor_id, null
    );

    return v_target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Entry points
-- ---------------------------------------------------------------------------

create or replace function public.catat_pembayaran_pemasok(
    p_pemasok_id uuid,
    p_rekening_bank_id uuid,
    p_nominal numeric,
    p_tanggal date,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Finance']);
    v_pemasok public.pemasok;
    v_rekening public.rekening_bank;
    v_total_sisa numeric(18,2) := 0;
    v_sisa numeric(18,2);
    v_alokasi numeric(18,2);
    v_tanggal date := coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date);
    v_invoice record;
    v_hasil jsonb;
    v_bayar_id uuid;
    v_i integer := 0;
    v_pemohon uuid;
begin
    if p_nominal is null or p_nominal <= 0 or p_nominal <> trunc(p_nominal) then
        raise exception 'Nominal pembayaran harus bilangan bulat lebih dari nol';
    end if;

    select * into v_pemasok from public.pemasok where id = p_pemasok_id and aktif = true;
    if not found then
        raise exception 'Pemasok tidak ditemukan atau nonaktif';
    end if;

    select * into v_rekening from public.rekening_bank where id = p_rekening_bank_id and aktif = true;
    if not found then
        raise exception 'Rekening bank tidak ditemukan atau nonaktif';
    end if;

    -- Oldest invoice first (R-01), locked so two payments cannot book the same sisa.
    for v_invoice in
        select * from public.pembayaran_pemasok_aktif(p_pemasok_id) for update
    loop
        v_total_sisa := v_total_sisa + v_invoice.sisa;
    end loop;

    if v_total_sisa <= 0 then
        raise exception 'Pemasok ini tidak punya utang yang bisa dibayar';
    end if;

    if p_nominal > v_total_sisa then
        raise exception 'Nominal pembayaran (%) melebihi total sisa utang pemasok (%)',
            p_nominal, v_total_sisa;
    end if;

    -- Separation of duty: the requester of the underlying PR cannot pay it (R-11).
    select d.pembuat_id into v_pemohon
    from public.invoice_pemasok i
    join public.penerimaan pn on pn.dokumen_id = i.penerimaan_id
    join public.po po on po.dokumen_id = pn.po_id
    join public.dokumen d on d.id = po.permintaan_id
    where i.pemasok_id = p_pemasok_id
      and d.status <> 'DIBATALKAN'
    limit 1;
    if v_pemohon = v_aktor then
        raise exception 'Pemohon permintaan pembelian tidak boleh membayar invoice dari permintaannya sendiri';
    end if;

    v_hasil := public.buat_dokumen('PEMBAYARAN_PEMASOK', v_aktor, p_nominal, v_tanggal);
    v_bayar_id := (v_hasil->'dokumen'->>'id')::uuid;

    insert into public.pembayaran_pemasok (
        dokumen_id, pemasok_id, rekening_bank_id, nominal, tanggal, created_by, updated_by
    ) values (
        v_bayar_id, p_pemasok_id, p_rekening_bank_id, p_nominal, v_tanggal, v_aktor, v_aktor
    );

    v_alokasi := p_nominal;
    for v_invoice in
        select * from public.pembayaran_pemasok_aktif(p_pemasok_id) for update
    loop
        exit when v_alokasi <= 0;
        v_sisa := v_invoice.sisa;
        v_i := v_i + 1;

        insert into public.pembayaran_pemasok_alokasi (
            pembayaran_id, invoice_id, nominal, urutan, created_by, updated_by
        ) values (
            v_bayar_id,
            v_invoice.invoice_id,
            least(v_sisa, v_alokasi),
            v_i,
            v_aktor,
            v_aktor
        );

        v_alokasi := v_alokasi - least(v_sisa, v_alokasi);
    end loop;

    if v_alokasi <> 0 then
        raise exception 'Alokasi pembayaran tidak habis (% tersisa)', v_alokasi;
    end if;

    return v_hasil || jsonb_build_object(
        'pembayaran_id', v_bayar_id,
        'alokasi', (
            select jsonb_agg(jsonb_build_object('invoice_id', a.invoice_id, 'nominal', a.nominal::text) order by a.urutan)
            from public.pembayaran_pemasok_alokasi a
            where a.pembayaran_id = v_bayar_id
        )
    );
end;
$$;

create or replace function public.verifikasi_pembayaran_pemasok(
    p_dokumen_id uuid,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_dokumen public.dokumen;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found or not exists (
        select 1 from public.pembayaran_pemasok where dokumen_id = p_dokumen_id
    ) then
        raise exception 'Pembayaran pemasok tidak ditemukan.';
    end if;

    if v_dokumen.status <> 'DIAJUKAN' then
        raise exception 'Pembayaran berstatus % tidak bisa diverifikasi.', v_dokumen.status;
    end if;

    if v_dokumen.pembuat_id = v_aktor then
        raise exception 'Pencatat pembayaran tidak bisa memverifikasi pembayarannya sendiri.';
    end if;

    update public.pembayaran_pemasok
    set diverifikasi_oleh = v_aktor,
        diverifikasi_pada = now(),
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    return jsonb_build_object('dokumen_id', p_dokumen_id, 'diverifikasi', true);
end;
$$;

create or replace function public.catat_hasil_transfer_pemasok(
    p_dokumen_id uuid,
    p_versi bigint,
    p_berhasil boolean,
    p_bukti_path text,
    p_alasan text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Finance']);
    v_dokumen public.dokumen;
    v_bayar public.pembayaran_pemasok;
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_hasil jsonb;
    v_invoice uuid;
begin
    select * into v_bayar from public.pembayaran_pemasok where dokumen_id = p_dokumen_id for update;
    if not found then
        raise exception 'Pembayaran pemasok tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;
    if v_dokumen.status <> 'DIAJUKAN' then
        raise exception 'Pembayaran berstatus % tidak bisa mencatat hasil transfer.', v_dokumen.status;
    end if;
    if v_bayar.diverifikasi_oleh is null then
        raise exception 'Pembayaran belum diverifikasi Accounting';
    end if;

    if p_berhasil then
        if p_bukti_path is null or length(btrim(p_bukti_path)) = 0 then
            raise exception 'Bukti transfer wajib dilampirkan';
        end if;

        v_jurnal := public.post_journal(
            v_bayar.tanggal::timestamptz,
            'PEMBAYARAN_PEMASOK',
            p_dokumen_id,
            v_dokumen.nomor,
            'POSTING',
            jsonb_build_array(
                jsonb_build_object('akun_peran', 'utang_usaha', 'debit', v_bayar.nominal::text, 'kredit', '0'),
                jsonb_build_object('akun_peran', 'kas_bank', 'debit', '0', 'kredit', v_bayar.nominal::text)
            ),
            'IDR',
            v_aktor,
            null
        );
        v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;

        update public.pembayaran_pemasok
        set bukti_transfer_path = btrim(p_bukti_path),
            jurnal_id = v_jurnal_id,
            updated_by = v_aktor,
            updated_at = now()
        where dokumen_id = p_dokumen_id;

        v_hasil := public.pindah_status_dokumen(
            p_dokumen_id, p_versi, 'DIPOSTING', 'POSTING', v_aktor, null
        );

        for v_invoice in
            select invoice_id from public.pembayaran_pemasok_alokasi where pembayaran_id = p_dokumen_id
        loop
            perform public.pembayaran_pemasok_sinkron_invoice(v_invoice, v_aktor);
        end loop;

        return v_hasil || jsonb_build_object('jurnal_id', v_jurnal_id, 'status', 'DIPOSTING');
    end if;

    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan kegagalan transfer wajib diisi';
    end if;

    update public.pembayaran_pemasok
    set alasan_gagal = btrim(p_alasan),
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    v_hasil := public.pindah_status_dokumen(
        p_dokumen_id, p_versi, 'GAGAL_TRANSFER', 'GAGAL', v_aktor, btrim(p_alasan)
    );

    return v_hasil || jsonb_build_object('status', 'GAGAL_TRANSFER');
end;
$$;

create or replace function public.batalkan_pembayaran_pemasok(
    p_dokumen_id uuid,
    p_versi bigint,
    p_alasan text,
    p_aktor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Finance']);
    v_dokumen public.dokumen;
    v_bayar public.pembayaran_pemasok;
    v_hasil jsonb;
    v_invoice uuid;
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pembatalan wajib diisi';
    end if;

    select * into v_bayar from public.pembayaran_pemasok where dokumen_id = p_dokumen_id for update;
    if not found then
        raise exception 'Pembayaran pemasok tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;
    if v_dokumen.status <> 'DIPOSTING' then
        raise exception 'Hanya pembayaran berstatus DIPOSTING yang bisa dibatalkan.';
    end if;

    if v_bayar.jurnal_id is not null then
        perform public.reverse_journal(
            v_bayar.jurnal_id,
            now(),
            p_dokumen_id,
            v_dokumen.nomor,
            'BATAL',
            v_aktor
        );
    end if;

    v_hasil := public.pindah_status_dokumen(
        p_dokumen_id, p_versi, 'DIBATALKAN', 'BATAL', v_aktor, btrim(p_alasan)
    );

    for v_invoice in
        select invoice_id from public.pembayaran_pemasok_alokasi where pembayaran_id = p_dokumen_id
    loop
        perform public.pembayaran_pemasok_sinkron_invoice(v_invoice, v_aktor);
    end loop;

    return v_hasil;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage for transfer proof (bucket is private; server uses the service role)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('bukti-transfer', 'bukti-transfer', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.rekening_bank enable row level security;
alter table public.pembayaran_pemasok enable row level security;
alter table public.pembayaran_pemasok_alokasi enable row level security;

revoke all on public.rekening_bank from anon, authenticated;
revoke all on public.pembayaran_pemasok from anon, authenticated;
revoke all on public.pembayaran_pemasok_alokasi from anon, authenticated;

grant select on public.rekening_bank to authenticated;
grant select on public.pembayaran_pemasok to authenticated;
grant select on public.pembayaran_pemasok_alokasi to authenticated;
grant all on public.rekening_bank to service_role;
grant all on public.pembayaran_pemasok to service_role;
grant all on public.pembayaran_pemasok_alokasi to service_role;

create policy "Staf aktif boleh baca rekening bank"
on public.rekening_bank for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca pembayaran pemasok"
on public.pembayaran_pemasok for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca alokasi pembayaran"
on public.pembayaran_pemasok_alokasi for select to authenticated
using (public.is_active_staff());

revoke all on function public.invoice_pemasok_sisa(uuid) from public, anon, authenticated;
revoke all on function public.pembayaran_pemasok_aktif(uuid) from public, anon, authenticated;
revoke all on function public.pembayaran_pemasok_sinkron_invoice(uuid, uuid) from public, anon, authenticated;
revoke all on function public.catat_pembayaran_pemasok(uuid, uuid, numeric, date, uuid)
from public, anon, authenticated;
revoke all on function public.verifikasi_pembayaran_pemasok(uuid, uuid)
from public, anon, authenticated;
revoke all on function public.catat_hasil_transfer_pemasok(uuid, bigint, boolean, text, text, uuid)
from public, anon, authenticated;
revoke all on function public.batalkan_pembayaran_pemasok(uuid, bigint, text, uuid)
from public, anon, authenticated;

grant execute on function public.invoice_pemasok_sisa(uuid) to service_role;
grant execute on function public.pembayaran_pemasok_aktif(uuid) to service_role;
grant execute on function public.pembayaran_pemasok_sinkron_invoice(uuid, uuid) to service_role;
grant execute on function public.catat_pembayaran_pemasok(uuid, uuid, numeric, date, uuid) to service_role;
grant execute on function public.verifikasi_pembayaran_pemasok(uuid, uuid) to service_role;
grant execute on function public.catat_hasil_transfer_pemasok(uuid, bigint, boolean, text, text, uuid)
to service_role;
grant execute on function public.batalkan_pembayaran_pemasok(uuid, bigint, text, uuid) to service_role;
