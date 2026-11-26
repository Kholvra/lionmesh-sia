"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import type { Satuan } from "@/core/master/types";

import { simpanKonversiSatuanAction } from "../actions";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";
import { Select } from "./select";

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
        <p className={styles.messageError} role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p className={styles.messageSuccess} role="status">
          {state.message}
        </p>
      ) : null}

      <div className={styles.formGridTiga}>
        <FormField
          error={fieldErrors.satuan_dari}
          label="Dari satuan"
          name="satuan_dari"
          required
        >
          <Select name="satuan_dari">
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
          <Select name="satuan_ke">
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
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Menyimpan..." : "Tambah konversi"}
        </button>
      </div>
    </form>
  );
}
