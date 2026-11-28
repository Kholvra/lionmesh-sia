"use client";

import { Form } from "@/components/ui/form";
import { FormField } from "@/components/ui/form-field";
import { FormFooter } from "@/components/ui/form-footer";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { useAksiForm } from "@/modules/penggajian/karyawan/components/use-aksi-form";
import { ui } from "@/modules/penggajian/ui/kelas";

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
      <FormFooter
        submitDisabled={pending}
        submitLabel={pending ? "Menyimpan…" : "Tambah gaji pokok"}
      />
    </Form>
  );
}
