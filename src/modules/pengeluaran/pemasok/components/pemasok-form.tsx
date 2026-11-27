"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { FormFooter } from "@/components/ui/form-footer";
import { Notice } from "@/components/ui/notice";
import type { Pemasok } from "@/core/pemasok";
import { simpanPemasokAction } from "../actions";
import { PATH_PEMASOK } from "../constants";
import { INITIAL_PEMASOK_ACTION_STATE } from "../form-state";
import styles from "../pemasok.module.css";

type PemasokFormProps = {
  pemasok?: Pemasok;
};

export function PemasokForm({ pemasok }: PemasokFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanPemasokAction,
    INITIAL_PEMASOK_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const cancelHref = pemasok
    ? `${PATH_PEMASOK}?pemasok=${pemasok.id}`
    : PATH_PEMASOK;

  return (
    <form action={formAction} className={styles.form} noValidate>
      {pemasok ? <input name="id" type="hidden" value={pemasok.id} /> : null}

      {state.status === "error" && state.message ? (
        <Notice tone="danger">{state.message}</Notice>
      ) : null}

      {state.status === "success" && state.message ? (
        <Notice tone="success">{state.message}</Notice>
      ) : null}

      <div className={styles.formGrid}>
        <div className={styles.fieldFull}>
          <FormField
            error={fieldErrors.nama}
            label="Nama pemasok"
            name="nama"
            required
          >
            <Input
              autoComplete="organization"
              defaultValue={pemasok?.nama ?? ""}
              name="nama"
              placeholder="Contoh: PT Baja Sentosa"
            />
          </FormField>
        </div>

        <div className={styles.fieldFull}>
          <FormField label="Alamat" name="alamat">
            <Input
              autoComplete="street-address"
              defaultValue={pemasok?.alamat ?? ""}
              name="alamat"
              placeholder="Alamat perusahaan"
            />
          </FormField>
        </div>

        <FormField label="NPWP" name="npwp">
          <Input
            defaultValue={pemasok?.npwp ?? ""}
            name="npwp"
            placeholder="Opsional"
          />
        </FormField>

        <FormField label="Kontak perusahaan" name="kontak_perusahaan">
          <Input
            autoComplete="tel"
            defaultValue={pemasok?.kontak_perusahaan ?? ""}
            name="kontak_perusahaan"
            placeholder="Telepon atau email perusahaan"
          />
        </FormField>

        <FormField
          helpText="Hanya Purchasing dan Accounting yang dapat melihat data PIC."
          label="Nama PIC"
          name="kontak_pic_nama"
        >
          <Input
            autoComplete="name"
            defaultValue={pemasok?.kontak_pic_nama ?? ""}
            name="kontak_pic_nama"
            placeholder="Nama kontak PIC"
          />
        </FormField>

        <FormField label="Telepon PIC" name="kontak_pic_telepon">
          <Input
            autoComplete="tel"
            defaultValue={pemasok?.kontak_pic_telepon ?? ""}
            name="kontak_pic_telepon"
            placeholder="Nomor telepon PIC"
          />
        </FormField>

        <FormField
          error={fieldErrors.termin_hari}
          helpText="Tidak ada nilai default. Wajib diisi."
          label="Termin pembayaran (hari)"
          name="termin_hari"
          required
        >
          <Input
            defaultValue={pemasok ? String(pemasok.termin_hari) : ""}
            inputMode="numeric"
            min={0}
            name="termin_hari"
            placeholder="Contoh: 30"
            step={1}
            type="number"
          />
        </FormField>

        <FormField
          error={fieldErrors.toleransi_persen}
          helpText="Berlaku untuk selisih harga dan total; default 0."
          label="Toleransi persen (%)"
          name="toleransi_persen"
        >
          <Input
            defaultValue={pemasok?.toleransi_persen ?? "0"}
            inputMode="decimal"
            max={100}
            min={0}
            name="toleransi_persen"
            step="0.01"
            type="number"
          />
        </FormField>

        <FormField
          error={fieldErrors.toleransi_nominal}
          helpText="Dalam IDR; default 0."
          label="Toleransi nominal (Rp)"
          name="toleransi_nominal"
        >
          <Input
            defaultValue={pemasok?.toleransi_nominal ?? "0"}
            inputMode="decimal"
            min={0}
            name="toleransi_nominal"
            step="0.01"
            type="number"
          />
        </FormField>
      </div>

      <FormFooter
        busy={pending}
        busyLabel="Menyimpan..."
        cancelHref={cancelHref}
        size="lg"
        submitLabel={pemasok ? "Simpan perubahan" : "Simpan pemasok"}
      />
    </form>
  );
}
