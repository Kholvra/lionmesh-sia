-- PG-008: three-way match dan utang usaha.
--
-- Invoice pemasok dicocokkan saat dicatat (COCOK/SELISIH), lalu pengesahan
-- Accounting mengakui utang lewat jurnal Dr 202 + PPN (+/- selisih) / Cr 201.
-- Tidak ada mutasi stok dari invoice.

-- ---------------------------------------------------------------------------
-- Jenis dokumen dan akun sumber jurnal
-- ---------------------------------------------------------------------------

insert into public.jenis_dokumen (tipe, nama, status_awal, perlu_approval, status_menunggu_approval)
values ('INVOICE_PEMASOK', 'Invoice pemasok', 'COCOK', false, null)
on conflict (tipe) do nothing;

insert into public.jenis_dokumen_status (tipe, status, urutan)
values
    ('INVOICE_PEMASOK', 'COCOK', 1),
    ('INVOICE_PEMASOK', 'SELISIH', 2),
    ('INVOICE_PEMASOK', 'TERCATAT', 3),
    ('INVOICE_PEMASOK', 'DIBAYAR_SEBAGIAN', 4),
    ('INVOICE_PEMASOK', 'LUNAS', 5),
    ('INVOICE_PEMASOK', 'DIBATALKAN', 6)
on conflict (tipe, status) do nothing;

insert into public.transisi_dokumen_sah (dari_status, ke_status, aksi, butuh_alasan) values
    ('COCOK', 'SELISIH', 'SELISIH', false),
    ('SELISIH', 'COCOK', 'COCOK_ULANG', false),
    ('COCOK', 'TERCATAT', 'SAHKAN', false),
    ('COCOK', 'DIBATALKAN', 'BATAL', true),
    ('SELISIH', 'DIBATALKAN', 'BATAL', true),
    ('TERCATAT', 'DIBATALKAN', 'BATAL', true),
    ('TERCATAT', 'DIBAYAR_SEBAGIAN', 'BAYAR', false),
    ('TERCATAT', 'LUNAS', 'BAYAR', false),
    ('DIBAYAR_SEBAGIAN', 'LUNAS', 'BAYAR', false)
on conflict (dari_status, ke_status, aksi) do nothing;

insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
values ('INVOICE_PEMASOK', 'Invoice pemasok (pengakuan utang)', array['Accounting'])
on conflict (kode) do nothing;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.invoice_pemasok (
    dokumen_id uuid primary key references public.dokumen (id),
    penerimaan_id uuid not null references public.penerimaan (dokumen_id),
    pemasok_id uuid not null references public.pemasok (id),
    nomor_invoice text not null,
    tanggal date not null,
    termin_hari integer not null,
    jatuh_tempo date not null,
    nomor_faktur_pajak text,
    dpp_total numeric(18,2) not null,
    ppn_nilai numeric(18,2) not null,
    total numeric(18,2) not null,
    catatan text,
    jurnal_id uuid,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_invoice_nomor_not_blank check (length(btrim(nomor_invoice)) > 0),
    constraint ck_invoice_termin_non_negative check (termin_hari >= 0),
    constraint ck_invoice_dpp_non_negative check (dpp_total >= 0),
    constraint ck_invoice_ppn_non_negative check (ppn_nilai >= 0),
    constraint ck_invoice_total_positif check (total > 0),
    constraint ck_invoice_total_konsisten check (total = dpp_total + ppn_nilai)
);

create unique index uq_invoice_pemasok_nomor
on public.invoice_pemasok (pemasok_id, lower(btrim(nomor_invoice)));

create index idx_invoice_pemasok_penerimaan on public.invoice_pemasok (penerimaan_id);

create table public.invoice_pemasok_item (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoice_pemasok (dokumen_id),
    penerimaan_item_id uuid not null references public.penerimaan_item (id),
    qty numeric(18,4) not null,
    harga_satuan_dpp numeric(18,4) not null,
    urutan smallint not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint uq_invoice_item_baris unique (invoice_id, penerimaan_item_id),
    constraint ck_invoice_item_qty check (qty > 0),
    constraint ck_invoice_item_harga check (harga_satuan_dpp >= 0)
);

create index idx_invoice_item_invoice on public.invoice_pemasok_item (invoice_id);

-- ---------------------------------------------------------------------------
-- Matching helpers
-- ---------------------------------------------------------------------------

-- Tolerance passes only when both the nominal and the percentage limits hold
-- together (R-03, D-15); zero defaults mean any difference is a selisih.
create or replace function public.invoice_dalam_toleransi(
    p_selisih numeric,
    p_dasar numeric,
    p_toleransi_nominal numeric,
    p_toleransi_persen numeric
)
returns boolean
language sql
immutable
as $$
    select abs(coalesce(p_selisih, 0)) <= coalesce(p_toleransi_nominal, 0)
       and (
            coalesce(p_dasar, 0) = 0
            or abs(coalesce(p_selisih, 0)) * 100
               <= coalesce(p_toleransi_persen, 0) * coalesce(p_dasar, 0)
       );
$$;

-- Shared matching routine: recomputes status and reasons from stored rows.
create or replace function public.invoice_hitung_cocok(
    p_invoice_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_invoice public.invoice_pemasok;
    v_toleransi_nominal numeric(18,2);
    v_toleransi_persen numeric(5,2);
    v_tarif numeric(5,2);
    v_ppn_hitung numeric(18,2);
    v_total_po numeric(18,2) := 0;
    v_dpp numeric(18,2) := 0;
    v_alasan text := '';
    v_baris record;
    v_selisih_baris numeric(18,2);
    v_qty_lulus numeric(18,4);
begin
    select * into v_invoice from public.invoice_pemasok where dokumen_id = p_invoice_id;
    if not found then
        raise exception 'Invoice pemasok tidak ditemukan.';
    end if;

    select toleransi_persen, toleransi_nominal
    into v_toleransi_persen, v_toleransi_nominal
    from public.pemasok where id = v_invoice.pemasok_id;

    v_tarif := public.tarif_ppn_untuk(v_invoice.tanggal);
    if v_tarif is null then
        raise exception 'Tarif PPN untuk tanggal ini belum tersedia';
    end if;

    for v_baris in
        select
            ii.id,
            ii.qty,
            ii.harga_satuan_dpp,
            qi.qty_lulus,
            pi.harga_satuan as harga_po
        from public.invoice_pemasok_item ii
        join public.penerimaan_item qi on qi.id = ii.penerimaan_item_id
        join public.po_item pi on pi.id = qi.po_item_id
        where ii.invoice_id = p_invoice_id
        order by ii.urutan
    loop
        v_qty_lulus := coalesce(v_baris.qty_lulus, 0);
        if v_baris.qty <> v_qty_lulus then
            v_alasan := v_alasan || format(
                'Qty tagih %s berbeda dari qty lulus %s. ', v_baris.qty, v_qty_lulus
            );
        end if;

        v_total_po := v_total_po + round(v_baris.qty * v_baris.harga_po, 2);
        v_dpp := v_dpp + round(v_baris.qty * v_baris.harga_satuan_dpp, 2);
        v_selisih_baris := round(v_baris.qty * (v_baris.harga_satuan_dpp - v_baris.harga_po), 2);

        if not public.invoice_dalam_toleransi(
            v_selisih_baris,
            v_baris.qty * v_baris.harga_po,
            v_toleransi_nominal,
            v_toleransi_persen
        ) then
            v_alasan := v_alasan || format(
                'Harga baris di luar toleransi (selisih %s). ', v_selisih_baris
            );
        end if;
    end loop;

    if not public.invoice_dalam_toleransi(
        v_dpp - v_total_po, v_total_po, v_toleransi_nominal, v_toleransi_persen
    ) then
        v_alasan := v_alasan || format('Total DPP di luar toleransi (selisih %s). ', v_dpp - v_total_po);
    end if;

    v_ppn_hitung := round(v_dpp * v_tarif / 100, 0);
    if round(v_invoice.ppn_nilai, 2) <> v_ppn_hitung then
        v_alasan := v_alasan || format(
            'PPN invoice %s tidak sama dengan PPN hitung %s. ', v_invoice.ppn_nilai, v_ppn_hitung
        );
    end if;

    update public.invoice_pemasok
    set dpp_total = v_dpp,
        total = v_dpp + ppn_nilai,
        catatan = nullif(btrim(v_alasan), ''),
        updated_at = now()
    where dokumen_id = p_invoice_id;

    return jsonb_build_object(
        'status', case when btrim(v_alasan) = '' then 'COCOK' else 'SELISIH' end,
        'alasan', nullif(btrim(v_alasan), ''),
        'dpp_total', v_dpp::text,
        'total_po', v_total_po::text,
        'ppn_hitung', v_ppn_hitung::text,
        'tarif', v_tarif::text
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Entry points
-- ---------------------------------------------------------------------------

create or replace function public.catat_invoice_pemasok(
    p_penerimaan_id uuid,
    p_nomor_invoice text,
    p_tanggal date,
    p_termin_hari integer,
    p_nomor_faktur_pajak text,
    p_ppn_nilai numeric,
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
    v_penerimaan public.penerimaan;
    v_dokumen public.dokumen;
    v_pemasok public.pemasok;
    v_hasil jsonb;
    v_invoice_id uuid;
    v_i integer := 0;
    v_elem jsonb;
    v_item_id uuid;
    v_qty numeric(18,4);
    v_harga numeric(18,4);
    v_qty_lulus numeric(18,4);
    v_jumlah_item integer;
    v_jumlah_baris integer;
    v_aktif public.invoice_pemasok;
    v_cocok jsonb;
    v_dpp numeric(18,2) := 0;
    v_ppn numeric(18,2) := round(coalesce(p_ppn_nilai, 0), 2);
begin
    if p_nomor_invoice is null or length(btrim(p_nomor_invoice)) = 0 then
        raise exception 'Nomor invoice wajib diisi';
    end if;

    if p_tanggal is null then
        raise exception 'Tanggal invoice wajib diisi';
    end if;

    if p_termin_hari is null then
        raise exception 'Termin invoice wajib diisi';
    end if;

    if p_termin_hari < 0 then
        raise exception 'Termin invoice tidak boleh negatif';
    end if;

    select * into v_penerimaan from public.penerimaan where dokumen_id = p_penerimaan_id for update;
    if not found then
        raise exception 'Penerimaan tidak ditemukan.';
    end if;

    select * into v_dokumen from public.dokumen where id = p_penerimaan_id;
    if v_dokumen.status not in ('QC_LULUS', 'QC_GAGAL') then
        raise exception 'Invoice hanya bisa dicatat setelah QC penerimaan final.';
    end if;

    select p.* into v_pemasok
    from public.pemasok p
    join public.po po on po.pemasok_id = p.id
    where po.dokumen_id = v_penerimaan.po_id;

    if not found or not v_pemasok.aktif then
        raise exception 'Pemasok nonaktif atau tidak ditemukan';
    end if;

    select * into v_aktif
    from public.invoice_pemasok iv
    join public.dokumen d on d.id = iv.dokumen_id
    where iv.penerimaan_id = p_penerimaan_id
      and d.status <> 'DIBATALKAN'
    limit 1;

    if found then
        raise exception 'Penerimaan ini sudah punya invoice aktif: %.', v_aktif.nomor_invoice;
    end if;

    if exists (
        select 1 from public.penerimaan_item
        where penerimaan_id = p_penerimaan_id and qty_lulus is null
    ) then
        raise exception 'Semua baris penerimaan harus sudah QC final sebelum invoice dicatat.';
    end if;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Invoice harus memuat minimal satu baris';
    end if;

    select count(*) into v_jumlah_item
    from public.penerimaan_item
    where penerimaan_id = p_penerimaan_id;

    select count(distinct (b->>'penerimaan_item_id')::uuid) into v_jumlah_baris
    from jsonb_array_elements(p_baris) b;

    if v_jumlah_baris <> v_jumlah_item or jsonb_array_length(p_baris) <> v_jumlah_item then
        raise exception 'Semua baris penerimaan harus ditagihkan';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;

        v_item_id := nullif(v_elem->>'penerimaan_item_id', '')::uuid;
        if v_item_id is null then
            raise exception 'Baris invoice % wajib merujuk baris penerimaan', v_i;
        end if;

        if coalesce(v_elem->>'qty', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Qty invoice baris % harus lebih dari 0', v_i;
        end if;
        v_qty := (v_elem->>'qty')::numeric(18,4);
        if v_qty <= 0 then
            raise exception 'Qty invoice baris % harus lebih dari 0', v_i;
        end if;

        if coalesce(v_elem->>'harga_satuan_dpp', '') !~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,4})?$' then
            raise exception 'Harga DPP baris % tidak valid', v_i;
        end if;
        v_harga := (v_elem->>'harga_satuan_dpp')::numeric(18,4);

        select qty_lulus into v_qty_lulus
        from public.penerimaan_item
        where id = v_item_id and penerimaan_id = p_penerimaan_id;

        if not found then
            raise exception 'Baris invoice % bukan bagian dari penerimaan ini', v_i;
        end if;

        if v_qty > coalesce(v_qty_lulus, 0) then
            raise exception 'Qty invoice baris % (%) melebihi qty lulus QC (%)',
                v_i, v_qty, coalesce(v_qty_lulus, 0);
        end if;

        v_dpp := v_dpp + round(v_qty * v_harga, 2);
    end loop;

    if v_dpp <= 0 then
        raise exception 'Total DPP invoice harus lebih dari 0';
    end if;

    if v_ppn < 0 then
        raise exception 'PPN invoice tidak boleh negatif';
    end if;

    v_hasil := public.buat_dokumen('INVOICE_PEMASOK', v_aktor, v_dpp + v_ppn, p_tanggal);
    v_invoice_id := (v_hasil->'dokumen'->>'id')::uuid;

    insert into public.invoice_pemasok (
        dokumen_id, penerimaan_id, pemasok_id, nomor_invoice, tanggal, termin_hari,
        jatuh_tempo, nomor_faktur_pajak, dpp_total, ppn_nilai, total, created_by, updated_by
    ) values (
        v_invoice_id,
        p_penerimaan_id,
        v_pemasok.id,
        btrim(p_nomor_invoice),
        p_tanggal,
        p_termin_hari,
        p_tanggal + p_termin_hari,
        nullif(btrim(coalesce(p_nomor_faktur_pajak, '')), ''),
        v_dpp,
        v_ppn,
        v_dpp + v_ppn,
        v_aktor,
        v_aktor
    );

    v_i := 0;
    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;
        insert into public.invoice_pemasok_item (
            invoice_id, penerimaan_item_id, qty, harga_satuan_dpp, urutan, created_by, updated_by
        ) values (
            v_invoice_id,
            (v_elem->>'penerimaan_item_id')::uuid,
            (v_elem->>'qty')::numeric(18,4),
            (v_elem->>'harga_satuan_dpp')::numeric(18,4),
            v_i,
            v_aktor,
            v_aktor
        );
    end loop;

    v_cocok := public.invoice_hitung_cocok(v_invoice_id);

    if v_cocok->>'status' = 'SELISIH' then
        perform public.pindah_status_dokumen(
            v_invoice_id, 0, 'SELISIH', 'SELISIH', v_aktor,
            v_cocok->>'alasan'
        );
    end if;

    return v_hasil || jsonb_build_object(
        'invoice_id', v_invoice_id,
        'status', v_cocok->>'status',
        'alasan', v_cocok->>'alasan',
        'dpp_total', v_cocok->>'dpp_total',
        'ppn_nilai', v_ppn::text,
        'total', (v_dpp + v_ppn)::text
    );
end;
$$;

create or replace function public.cocokkan_ulang_invoice(
    p_dokumen_id uuid,
    p_versi bigint,
    p_ppn_nilai numeric,
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
    v_dokumen public.dokumen;
    v_invoice public.invoice_pemasok;
    v_i integer := 0;
    v_elem jsonb;
    v_qty numeric(18,4);
    v_harga numeric(18,4);
    v_qty_lulus numeric(18,4);
    v_dpp numeric(18,2) := 0;
    v_cocok jsonb;
    v_baru bigint;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found then
        raise exception 'Invoice pemasok tidak ditemukan.';
    end if;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;
    if v_dokumen.status <> 'SELISIH' then
        raise exception 'Hanya invoice berstatus SELISIH yang bisa dikoreksi. Status saat ini: %.', v_dokumen.status;
    end if;

    select * into v_invoice from public.invoice_pemasok where dokumen_id = p_dokumen_id;

    if p_baris is null or jsonb_typeof(p_baris) <> 'array' or jsonb_array_length(p_baris) = 0 then
        raise exception 'Invoice harus memuat minimal satu baris';
    end if;

    for v_elem in select * from jsonb_array_elements(p_baris) loop
        v_i := v_i + 1;
        v_qty := (v_elem->>'qty')::numeric(18,4);
        v_harga := (v_elem->>'harga_satuan_dpp')::numeric(18,4);

        if v_qty <= 0 then
            raise exception 'Qty invoice baris % harus lebih dari 0', v_i;
        end if;

        select qty_lulus into v_qty_lulus
        from public.penerimaan_item
        where id = (v_elem->>'penerimaan_item_id')::uuid
          and penerimaan_id = v_invoice.penerimaan_id;
        if not found then
            raise exception 'Baris invoice % bukan bagian dari penerimaan ini', v_i;
        end if;
        if v_qty > coalesce(v_qty_lulus, 0) then
            raise exception 'Qty invoice baris % (%) melebihi qty lulus QC (%)',
                v_i, v_qty, coalesce(v_qty_lulus, 0);
        end if;

        v_dpp := v_dpp + round(v_qty * v_harga, 2);
    end loop;

    if coalesce(p_ppn_nilai, -1) < 0 then
        raise exception 'PPN invoice tidak boleh negatif';
    end if;

    update public.invoice_pemasok_item ii
    set qty = (b->>'qty')::numeric(18,4),
        harga_satuan_dpp = (b->>'harga_satuan_dpp')::numeric(18,4),
        updated_by = v_aktor,
        updated_at = now()
    from jsonb_array_elements(p_baris) b
    where ii.invoice_id = p_dokumen_id
      and ii.penerimaan_item_id = (b->>'penerimaan_item_id')::uuid;

    update public.invoice_pemasok
    set ppn_nilai = round(p_ppn_nilai, 2),
        dpp_total = v_dpp,
        total = v_dpp + round(p_ppn_nilai, 2),
        updated_by = v_aktor,
        updated_at = now()
    where dokumen_id = p_dokumen_id;

    v_cocok := public.invoice_hitung_cocok(p_dokumen_id);

    if v_cocok->>'status' = 'COCOK' then
        perform public.pindah_status_dokumen(
            p_dokumen_id, p_versi, 'COCOK', 'COCOK_ULANG', v_aktor, null
        );
    else
        -- Still SELISIH: keep the status but move the version forward so a
        -- concurrent edit is rejected, and record the revision.
        update public.dokumen
        set versi = versi + 1, updated_by = v_aktor, updated_at = now()
        where id = p_dokumen_id and versi = p_versi
        returning versi into v_baru;

        insert into public.riwayat_status (
            dokumen_id, tipe_dokumen, aksi, status_asal, status_tujuan, alasan, actor_id, created_by, updated_by
        ) values (
            p_dokumen_id, 'INVOICE_PEMASOK', 'REVISI', 'SELISIH', 'SELISIH',
            v_cocok->>'alasan', v_aktor, v_aktor, v_aktor
        );
    end if;

    return v_cocok || jsonb_build_object('invoice_id', p_dokumen_id);
end;
$$;

create or replace function public.sahkan_invoice_pemasok(
    p_dokumen_id uuid,
    p_versi bigint,
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
    v_invoice public.invoice_pemasok;
    v_total_po numeric(18,2) := 0;
    v_selisih numeric(18,2);
    v_baris jsonb := '[]'::jsonb;
    v_jurnal jsonb;
    v_jurnal_id uuid;
    v_hasil jsonb;
begin
    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found then
        raise exception 'Invoice pemasok tidak ditemukan.';
    end if;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;
    if v_dokumen.status <> 'COCOK' then
        raise exception 'Hanya invoice COCOK yang bisa disahkan. Status saat ini: %.', v_dokumen.status;
    end if;
    if v_dokumen.pembuat_id = v_aktor then
        raise exception 'Pencatat invoice tidak bisa mengesahkan invoice yang sama.';
    end if;

    select * into v_invoice from public.invoice_pemasok where dokumen_id = p_dokumen_id;

    select coalesce(sum(round(ii.qty * pi.harga_satuan, 2)), 0) into v_total_po
    from public.invoice_pemasok_item ii
    join public.penerimaan_item qi on qi.id = ii.penerimaan_item_id
    join public.po_item pi on pi.id = qi.po_item_id
    where ii.invoice_id = p_dokumen_id;

    v_selisih := round(v_invoice.dpp_total - v_total_po, 2);

    if v_total_po > 0 then
        v_baris := v_baris || jsonb_build_object(
            'akun_peran', 'gr_ir', 'debit', v_total_po::text, 'kredit', '0'
        );
    end if;

    if v_invoice.ppn_nilai > 0 then
        v_baris := v_baris || jsonb_build_object(
            'akun_peran', 'ppn_masukan', 'debit', v_invoice.ppn_nilai::text, 'kredit', '0'
        );
    end if;

    if v_selisih > 0 then
        v_baris := v_baris || jsonb_build_object(
            'akun_peran', 'selisih_harga_pembelian', 'debit', v_selisih::text, 'kredit', '0'
        );
    elsif v_selisih < 0 then
        v_baris := v_baris || jsonb_build_object(
            'akun_peran', 'selisih_harga_pembelian', 'debit', '0', 'kredit', (-v_selisih)::text
        );
    end if;

    v_baris := v_baris || jsonb_build_object(
        'akun_peran', 'utang_usaha', 'debit', '0', 'kredit', v_invoice.total::text
    );

    v_jurnal := public.post_journal(
        now(),
        'INVOICE_PEMASOK',
        p_dokumen_id,
        v_dokumen.nomor,
        'SAHKAN',
        v_baris,
        'IDR',
        v_aktor,
        null
    );
    v_jurnal_id := (v_jurnal->>'jurnal_id')::uuid;

    update public.invoice_pemasok
    set jurnal_id = v_jurnal_id, updated_by = v_aktor, updated_at = now()
    where dokumen_id = p_dokumen_id;

    v_hasil := public.pindah_status_dokumen(
        p_dokumen_id, p_versi, 'TERCATAT', 'SAHKAN', v_aktor, null
    );

    return v_hasil || jsonb_build_object(
        'jurnal_id', v_jurnal_id,
        'total_po', v_total_po::text,
        'selisih', v_selisih::text
    );
end;
$$;

create or replace function public.batalkan_invoice_pemasok(
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
    v_aktor uuid := public.pengadaan_assert_peran(p_aktor_id, array['Accounting']);
    v_dokumen public.dokumen;
    v_invoice public.invoice_pemasok;
    v_hasil jsonb;
begin
    if p_alasan is null or length(btrim(p_alasan)) = 0 then
        raise exception 'Alasan pembatalan wajib diisi';
    end if;

    select * into v_dokumen from public.dokumen where id = p_dokumen_id for update;
    if not found then
        raise exception 'Invoice pemasok tidak ditemukan.';
    end if;
    if v_dokumen.versi <> p_versi then
        raise exception 'Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.';
    end if;
    if v_dokumen.status not in ('COCOK', 'SELISIH', 'TERCATAT') then
        raise exception 'Invoice berstatus % tidak bisa dibatalkan.', v_dokumen.status;
    end if;

    select * into v_invoice from public.invoice_pemasok where dokumen_id = p_dokumen_id;

    if v_dokumen.status = 'TERCATAT' and v_invoice.jurnal_id is not null then
        perform public.reverse_journal(
            v_invoice.jurnal_id,
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

    return v_hasil;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------

alter table public.invoice_pemasok enable row level security;
alter table public.invoice_pemasok_item enable row level security;

revoke all on public.invoice_pemasok from anon, authenticated;
revoke all on public.invoice_pemasok_item from anon, authenticated;

grant select on public.invoice_pemasok to authenticated;
grant select on public.invoice_pemasok_item to authenticated;
grant all on public.invoice_pemasok to service_role;
grant all on public.invoice_pemasok_item to service_role;

create policy "Staf aktif boleh baca invoice pemasok"
on public.invoice_pemasok for select to authenticated
using (public.is_active_staff());

create policy "Staf aktif boleh baca baris invoice pemasok"
on public.invoice_pemasok_item for select to authenticated
using (public.is_active_staff());

revoke all on function public.invoice_dalam_toleransi(numeric, numeric, numeric, numeric)
from public, anon, authenticated;
revoke all on function public.invoice_hitung_cocok(uuid) from public, anon, authenticated;
revoke all on function public.catat_invoice_pemasok(uuid, text, date, integer, text, numeric, jsonb, uuid)
from public, anon, authenticated;
revoke all on function public.cocokkan_ulang_invoice(uuid, bigint, numeric, jsonb, uuid)
from public, anon, authenticated;
revoke all on function public.sahkan_invoice_pemasok(uuid, bigint, uuid)
from public, anon, authenticated;
revoke all on function public.batalkan_invoice_pemasok(uuid, bigint, text, uuid)
from public, anon, authenticated;

grant execute on function public.invoice_dalam_toleransi(numeric, numeric, numeric, numeric) to service_role;
grant execute on function public.invoice_hitung_cocok(uuid) to service_role;
grant execute on function public.catat_invoice_pemasok(uuid, text, date, integer, text, numeric, jsonb, uuid)
to service_role;
grant execute on function public.cocokkan_ulang_invoice(uuid, bigint, numeric, jsonb, uuid)
to service_role;
grant execute on function public.sahkan_invoice_pemasok(uuid, bigint, uuid) to service_role;
grant execute on function public.batalkan_invoice_pemasok(uuid, bigint, text, uuid) to service_role;
