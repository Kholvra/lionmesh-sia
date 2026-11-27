"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Satuan } from "@/core/master/types";

import { simpanKonversiSatuanAction } from "../actions";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type KonversiSatuanFormProps = {
  satuanAktif: readonly Satuan[];
};

export function KonversiSatuanForm({ satuanAktif }: KonversiSatuanFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanKonversiSatuanAction,
    INITIAL_MASTER_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.status === "error" && state.message ? (
        <Notice className={styles.messageError} tone="danger">
          {state.message}
        </Notice>
      ) : null}

      {state.status === "success" && state.message ? (
        <Notice className={styles.messageSuccess} tone="success">
          {state.message}
        </Notice>
      ) : null}

      <div className={styles.formGridTiga}>
        <FormField
          error={fieldErrors.satuan_dari}
          label="Dari satuan"
          name="satuan_dari"
          required
        >
          <Select className={styles.select} name="satuan_dari">
            <option value="">Pilih satuan</option>
            {satuanAktif.map((item) => (
              <option key={item.id} value={item.id}>
                {item.kode} — {item.nama}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={fieldErrors.satuan_ke}
          label="Ke satuan"
          name="satuan_ke"
          required
        >
          <Select className={styles.select} name="satuan_ke">
            <option value="">Pilih satuan</option>
            {satuanAktif.map((item) => (
              <option key={item.id} value={item.id}>
                {item.kode} — {item.nama}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={fieldErrors.faktor}
          helpText="1 kode pertama = faktor kode kedua."
          label="Faktor"
          name="faktor"
          required
        >
          <Input
            autoComplete="off"
            inputMode="decimal"
            name="faktor"
            placeholder="Contoh: 12"
          />
        </FormField>
      </div>

      <div className={styles.formActions}>
        <SubmitButton busy={pending} busyLabel="Menyimpan..." size="lg">
          Tambah konversi
        </SubmitButton>
      </div>
    </form>
  );
}
