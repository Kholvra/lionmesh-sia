"use client";

import { Form, FormField, Input } from "@/components/ui";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { useAksiForm } from "@/modules/penggajian/karyawan/components/use-aksi-form";
import { Notice } from "@/modules/penggajian/ui/notice";
import ui from "@/modules/penggajian/ui/ui.module.css";

type GajiPokokFormProps = {
  aksi: (state: AksiState, formData: FormData) => Promise<AksiState>;
};

export function GajiPokokForm({ aksi }: GajiPokokFormProps) {
  const { fieldErrors: e, message, onSubmit, pending } = useAksiForm(aksi);

  return (
    <Form onSubmit={onSubmit}>
      {message ? <Notice title={message} tone="danger" /> : null}
      <p className={ui.cardHint}>
        Entri lama tidak diubah. Untuk mengoreksi nominal yang salah, tambahkan entri baru dengan tanggal
        berlaku sesudahnya.
      </p>
      <FormField error={e.nominal} helpText="Rupiah, tanpa desimal." label="Gaji pokok baru" name="nominal" required>
        <Input className={ui.numeric} inputMode="numeric" />
      </FormField>
      <FormField error={e.tanggalBerlaku} label="Tanggal berlaku" name="tanggalBerlaku" required>
        <Input type="date" />
      </FormField>
      <div className={ui.formActions}>
        <button className={`${ui.button} ${ui.primary}`} disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Tambah gaji pokok"}
        </button>
      </div>
    </Form>
  );
}
