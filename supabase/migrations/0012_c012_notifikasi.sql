-- C-012: notifikasi in-app dan antrean kirim email.
-- DDL disusun dari docs/product/items/C-012-notifikasi (01-requirement, 04-design-contract).
-- Nomor migrasi diberikan tech lead (D-09); migrasi yang sudah diterapkan tidak diubah.
--
-- Notifikasi disimpan di core (D-04). Kanal email tidak dipanggil dari modul
-- (D-25): modul hanya menitipkan kejadian lewat public.buat_notifikasi(), dan
-- pengiriman email berjalan terpisah dari transaksi pemicu (INV-02).

-- Daftar kejadian PT-01 (`[USULAN-AGEN]`) adalah satu-satunya pemilik label.
-- Klien tidak boleh mengirim judul bebas, supaya isi notifikasi tidak bisa dipalsukan.
create table public.jenis_notifikasi_sah (
    jenis text primary key,
    label text not null,
    kanal_email boolean not null default true,
    sumber text not null default 'PT-01',
    created_at timestamptz not null default now(),
    constraint ck_jenis_notifikasi_sah_jenis check (jenis ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    constraint ck_jenis_notifikasi_sah_label check (length(btrim(label)) > 0)
);

insert into public.jenis_notifikasi_sah (jenis, label, kanal_email) values
    ('DOKUMEN_MENUNGGU_PERSETUJUAN', 'Dokumen menunggu persetujuan Anda', true),
    ('PR_DISETUJUI', 'Permintaan pembelian disetujui', true),
    ('PR_DITOLAK', 'Permintaan pembelian ditolak', true),
    ('PAYROLL_DIVERIFIKASI', 'Payroll menunggu persetujuan Direksi', true),
    ('PAYROLL_DISETUJUI', 'Payroll disetujui', true),
    ('PAYROLL_DIBAYAR', 'Gaji sudah dibayar; terbitkan slip', true);

create table public.notifikasi (
    id uuid primary key default gen_random_uuid(),
    penerima_id uuid not null references auth.users (id),
    jenis text not null references public.jenis_notifikasi_sah (jenis),
    judul text not null,
    nomor_dokumen text,
    tautan text,
    kanal_email boolean not null default true,
    dibaca_at timestamptz,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_by uuid,
    updated_at timestamptz not null default now(),
    constraint ck_notifikasi_judul check (length(btrim(judul)) > 0),
    constraint ck_notifikasi_tautan check (tautan is null or tautan ~ '^/')
);

create index idx_notifikasi_penerima on public.notifikasi (penerima_id, created_at desc, id desc);
create index idx_notifikasi_belum_dibaca
on public.notifikasi (penerima_id)
where dibaca_at is null;

-- Antrean kirim email: satu baris per notifikasi, status PT-07.
create table public.pengiriman_email (
    id uuid primary key default gen_random_uuid(),
    notifikasi_id uuid not null references public.notifikasi (id),
    alamat text,
    status text not null default 'menunggu',
    percobaan smallint not null default 0,
    alasan text,
    jadwal_berikutnya timestamptz,
    -- Lease singkat supaya dua pemanggil tidak mengirim email yang sama.
    diklaim_pada timestamptz,
    terkirim_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_pengiriman_email_notifikasi unique (notifikasi_id),
    constraint ck_pengiriman_email_status check (status in ('menunggu', 'terkirim', 'gagal')),
    -- 0 = belum dicoba; 4 = percobaan pertama + tiga percobaan otomatis (PT-07).
    constraint ck_pengiriman_email_percobaan check (percobaan between 0 and 4),
    constraint ck_pengiriman_email_terkirim check (
        (status = 'terkirim' and terkirim_at is not null)
        or (status <> 'terkirim' and terkirim_at is null)
    ),
    constraint ck_pengiriman_email_jadwal check (
        (status = 'menunggu' and jadwal_berikutnya is not null)
        or (status <> 'menunggu' and jadwal_berikutnya is null)
    ),
    constraint ck_pengiriman_email_alasan check (
        status <> 'gagal' or (alasan is not null and length(btrim(alasan)) > 0)
    )
);

create index idx_pengiriman_email_due
on public.pengiriman_email (jadwal_berikutnya)
where status = 'menunggu';

-- INV-03/AC-08: tidak ada transisi keluar dari `gagal` maupun `terkirim`.
create or replace function public.trg_pengiriman_email_transisi()
returns trigger
language plpgsql
as $$
begin
    if old.status = 'gagal' and new.status <> 'gagal' then
        raise exception 'Pengiriman email yang gagal tidak bisa dikirim ulang di versi awal.';
    end if;
    if old.status = 'terkirim' and new.status <> 'terkirim' then
        raise exception 'Pengiriman email yang sudah terkirim tidak bisa diubah.';
    end if;
    if new.percobaan < old.percobaan then
        raise exception 'Jumlah percobaan pengiriman email tidak bisa berkurang.';
    end if;
    new.updated_at := now();
    return new;
end;
$$;

create trigger trg_pengiriman_email_transisi
before update on public.pengiriman_email
for each row execute function public.trg_pengiriman_email_transisi();

-- Notifikasi hanya boleh berubah pada status baca; isi dan penerimanya tetap.
create or replace function public.trg_notifikasi_immutable()
returns trigger
language plpgsql
as $$
begin
    if new.id <> old.id
        or new.penerima_id <> old.penerima_id
        or new.jenis <> old.jenis
        or new.judul <> old.judul
        or new.kanal_email <> old.kanal_email
        or new.created_at <> old.created_at then
        raise exception 'Isi dan penerima notifikasi tidak bisa diubah.';
    end if;
    new.updated_at := now();
    return new;
end;
$$;

create trigger trg_notifikasi_immutable
before update on public.notifikasi
for each row execute function public.trg_notifikasi_immutable();

create or replace function public.trg_notifikasi_no_delete()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Notifikasi tidak bisa dihapus.';
end;
$$;

create trigger trg_notifikasi_no_delete
before delete on public.notifikasi
for each row execute function public.trg_notifikasi_no_delete();

alter table public.jenis_notifikasi_sah enable row level security;
alter table public.notifikasi enable row level security;
alter table public.pengiriman_email enable row level security;

revoke all on public.jenis_notifikasi_sah from anon, authenticated;
revoke all on public.notifikasi from anon, authenticated;
revoke all on public.pengiriman_email from anon, authenticated;

grant select on public.jenis_notifikasi_sah to authenticated;
grant select on public.notifikasi to authenticated;
grant select on public.pengiriman_email to authenticated;
grant all on public.jenis_notifikasi_sah to service_role;
grant all on public.notifikasi to service_role;
grant all on public.pengiriman_email to service_role;

create policy "Staf aktif boleh baca daftar jenis notifikasi"
on public.jenis_notifikasi_sah for select
to authenticated
using (public.is_active_staff());

-- INV-01: penerima hanya melihat barisnya sendiri, dan hanya staf aktif (D-53).
create policy "Penerima boleh baca notifikasinya"
on public.notifikasi for select
to authenticated
using (penerima_id = (select auth.uid()) and public.is_active_staff());

-- PT-05: pengguna biasa hanya melihat status pengiriman email miliknya sendiri.
create policy "Penerima boleh baca status email notifikasinya"
on public.pengiriman_email for select
to authenticated
using (
    public.is_active_staff()
    and exists (
        select 1
        from public.notifikasi n
        where n.id = pengiriman_email.notifikasi_id
          and n.penerima_id = (select auth.uid())
    )
);

-- B-01/PRE-01: kejadian masuk lewat satu pintu; penerima divalidasi, judul dari
-- daftar jenis, dan antrean email dibuat dalam transaksi yang sama dengan baris
-- notifikasi. Penyedia email tidak dipanggil di sini (INV-02).
create or replace function public.buat_notifikasi(
    p_jenis text,
    p_penerima_ids uuid[],
    p_nomor_dokumen text default null,
    p_tautan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_aktor uuid := auth.uid();
    v_penerima uuid;
    v_notifikasi_id uuid;
    v_ids uuid[] := '{}';
    v_alamat text;
    v_jenis public.jenis_notifikasi_sah;
begin
    if v_aktor is null then
        raise exception 'Sesi Anda sudah berakhir. Silakan masuk lagi.' using errcode = '42501';
    end if;

    if not public.is_active_staff() then
        raise exception 'Peran Anda tidak berwenang mengirim notifikasi.' using errcode = '42501';
    end if;

    select * into v_jenis from public.jenis_notifikasi_sah where jenis = p_jenis;
    if not found then
        raise exception 'Jenis notifikasi tidak dikenal.';
    end if;

    if p_tautan is not null and p_tautan !~ '^/' then
        raise exception 'Tautan notifikasi harus berupa path aplikasi.';
    end if;

    if p_penerima_ids is null or cardinality(p_penerima_ids) = 0 then
        raise exception 'Penerima notifikasi wajib diisi.';
    end if;

    for v_penerima in select distinct unnest(p_penerima_ids) loop
        if not exists (
            select 1
            from public.profiles
            where id = v_penerima
              and aktif = true
              and peran is not null
              and peran <> 'Karyawan'
        ) then
            raise exception 'Penerima notifikasi tidak ditemukan atau bukan staf aktif.';
        end if;

        insert into public.notifikasi (
            penerima_id, jenis, judul, nomor_dokumen, tautan, kanal_email,
            created_by, updated_by
        ) values (
            v_penerima,
            v_jenis.jenis,
            case
                when nullif(btrim(p_nomor_dokumen), '') is null then v_jenis.label
                else v_jenis.label || ' — ' || btrim(p_nomor_dokumen)
            end,
            nullif(btrim(p_nomor_dokumen), ''),
            p_tautan,
            v_jenis.kanal_email,
            v_aktor, v_aktor
        )
        returning id into v_notifikasi_id;

        v_ids := v_ids || v_notifikasi_id;

        if v_jenis.kanal_email then
            select u.email into v_alamat from auth.users u where u.id = v_penerima;

            if v_alamat is null or length(btrim(v_alamat)) = 0 then
                -- AC-05: alamat kosong membuat kiriman gagal, notifikasi in-app tetap ada.
                insert into public.pengiriman_email (
                    notifikasi_id, alamat, status, percobaan, alasan, jadwal_berikutnya
                ) values (
                    v_notifikasi_id, null, 'gagal', 0,
                    'Alamat email penerima belum diisi.', null
                );
            else
                insert into public.pengiriman_email (
                    notifikasi_id, alamat, status, percobaan, jadwal_berikutnya
                ) values (
                    v_notifikasi_id, v_alamat, 'menunggu', 0, now()
                );
            end if;
        end if;
    end loop;

    return jsonb_build_object('notifikasi_ids', to_jsonb(v_ids));
end;
$$;

-- B-02: status baca hanya berubah untuk penerima yang sah.
create or replace function public.tandai_notifikasi_dibaca(p_notifikasi_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
    v_aktor uuid := auth.uid();
    v_dibaca timestamptz;
begin
    if v_aktor is null then
        raise exception 'Sesi Anda sudah berakhir. Silakan masuk lagi.' using errcode = '42501';
    end if;

    update public.notifikasi
    set dibaca_at = coalesce(dibaca_at, now()),
        updated_by = v_aktor
    where id = p_notifikasi_id
      and penerima_id = v_aktor
    returning dibaca_at into v_dibaca;

    if v_dibaca is null then
        raise exception 'Notifikasi tidak ditemukan untuk akun Anda.';
    end if;

    return v_dibaca;
end;
$$;

revoke all on function public.buat_notifikasi(text, uuid[], text, text) from public, anon;
revoke all on function public.tandai_notifikasi_dibaca(uuid) from public, anon;
grant execute on function public.buat_notifikasi(text, uuid[], text, text) to authenticated;
grant execute on function public.tandai_notifikasi_dibaca(uuid) to authenticated;
