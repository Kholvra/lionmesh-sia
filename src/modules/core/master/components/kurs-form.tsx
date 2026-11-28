"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { MataUang } from "@/core/master/types";

import { simpanKursAction } from "../actions";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type KursFormProps = {
  mataUangAktif: readonly MataUang[];
  mataUangTerpilih?: string;
};

export function KursForm({ mataUangAktif, mataUangTerpilih }: KursFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanKursAction,
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
          error={fieldErrors.mata_uang}
          label="Mata uang"
          name="mata_uang"
          required
        >
          <Select className={styles.select} defaultValue={mataUangTerpilih ?? ""} name="mata_uang">
            <option value="">Pilih mata uang</option>
            {mataUangAktif.map((item) => (
              <option key={item.id} value={item.id}>
                {item.kode} — {item.nama}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={fieldErrors.tanggal}
          label="Tanggal kurs"
          name="tanggal"
          required
        >
          <Input name="tanggal" type="date" />
        </FormField>

        <FormField
          error={fieldErrors.nilai}
          helpText="Dalam IDR; transaksi tetap IDR (D-38)."
          label="Nilai kurs"
          name="nilai"
          required
        >
          <Input
            autoComplete="off"
            inputMode="decimal"
            name="nilai"
            placeholder="Contoh: 16250,75"
          />
        </FormField>
      </div>

      <div className={styles.formActions}>
        <SubmitButton busy={pending} busyLabel="Menyimpan..." size="lg">
          Tambah kurs
        </SubmitButton>
      </div>
    </form>
  );
}
