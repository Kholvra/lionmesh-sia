"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ConfirmDialog, Form, FormField, Input } from "@/components/ui";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { useAksiForm } from "@/modules/penggajian/karyawan/components/use-aksi-form";
import { Notice } from "@/modules/penggajian/ui/notice";
import ui from "@/modules/penggajian/ui/ui.module.css";

type NonaktifFormProps = {
  aksi: (state: AksiState, formData: FormData) => Promise<AksiState>;
  nama: string;
  batalHref: string;
};

export function NonaktifForm({ aksi, batalHref, nama }: NonaktifFormProps) {
  const { fieldErrors: e, kirim, message, pending } = useAksiForm(aksi);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <Form
        className={ui.card}
        onSubmit={(event) => {
          event.preventDefault();
          formRef.current = event.currentTarget;
          setKonfirmasi(true);
        }}
      >
        {message ? <Notice title={message} tone="danger" /> : null}
        <h2 className={ui.cardTitle}>Perubahan status</h2>
        <dl className={ui.facts}>
          <div className={ui.fact}>
            <dt>Status saat ini</dt>
            <dd>Aktif</dd>
          </div>
          <div className={ui.fact}>
            <dt>Status baru</dt>
            <dd>Nonaktif</dd>
          </div>
        </dl>
        <div className={ui.formGrid}>
          <FormField error={e.tanggalKeluar} label="Tanggal keluar" name="tanggalKeluar" required>
            <Input type="date" />
          </FormField>
        </div>
        <div className={ui.formActions}>
          <button className={`${ui.button} ${ui.danger}`} disabled={pending} type="submit">
            {pending ? "Menyimpan…" : "Nonaktifkan karyawan"}
          </button>
          <Link className={ui.button} href={batalHref}>
            Batal
          </Link>
        </div>
      </Form>
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel="Ya, nonaktifkan"
        destructive
        description="Data, riwayat gaji, dan presensi tetap tersimpan. Karyawan nonaktif tidak bisa dipilih untuk dokumen baru."
        onConfirm={() => {
          setKonfirmasi(false);
          if (formRef.current) kirim(formRef.current);
        }}
        onOpenChange={setKonfirmasi}
        open={konfirmasi}
        title={`Nonaktifkan ${nama}?`}
      />
    </>
  );
}
