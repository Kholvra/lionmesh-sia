-- An attempted delivery must never be retried until its outcome is known.
alter table public.pengiriman_email
    drop constraint ck_pengiriman_email_status,
    drop constraint ck_pengiriman_email_alasan;

alter table public.pengiriman_email
    add constraint ck_pengiriman_email_status
        check (status in ('menunggu', 'terkirim', 'gagal', 'perlu_pemeriksaan')),
    add constraint ck_pengiriman_email_alasan
        check (status not in ('gagal', 'perlu_pemeriksaan') or
               (alasan is not null and length(btrim(alasan)) > 0));
