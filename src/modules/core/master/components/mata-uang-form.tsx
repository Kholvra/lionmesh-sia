"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import type { MataUang } from "@/core/master/types";

import { simpanMataUangAction } from "../actions";
import { PATH_MASTER_MATA_UANG } from "../constants";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type MataUangFormProps = {
  mataUang?: MataUang;
};

export function MataUangForm({ mataUang }: MataUangFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanMataUangAction,
    INITIAL_MASTER_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const cancelHref = mataUang
    ? `${PATH_MASTER_MATA_UANG}?id=${mataUang.id}`
    : PATH_MASTER_MATA_UANG;

  return (
    <form action={formAction} className={styles.form} noValidate>
      {mataUang ? <input name="id" type="hidden" value={mataUang.id} /> : null}

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

      <div className={styles.formGrid}>
        <FormField
          error={fieldErrors.kode}
          helpText="Tiga huruf, contoh USD."
          label="Kode mata uang"
          name="kode"
          required
        >
          <Input
            autoComplete="off"
            defaultValue={mataUang?.kode ?? ""}
            maxLength={3}
            name="kode"
            placeholder="Contoh: USD"
          />
        </FormField>

        <FormField
          error={fieldErrors.simbol}
          label="Simbol"
          name="simbol"
        >
          <Input
            autoComplete="off"
            defaultValue={mataUang?.simbol ?? ""}
            name="simbol"
            placeholder="Contoh: $"
          />
        </FormField>

        <div className={styles.fieldFull}>
          <FormField
            error={fieldErrors.nama}
            label="Nama mata uang"
            name="nama"
            required
          >
            <Input
              autoComplete="off"
              defaultValue={mataUang?.nama ?? ""}
              name="nama"
              placeholder="Contoh: Dolar Amerika Serikat"
            />
          </FormField>
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending
            ? "Menyimpan..."
            : mataUang
              ? "Simpan perubahan"
              : "Simpan mata uang"}
        </button>
        <Link className={styles.secondaryButton} href={cancelHref}>
          Batal
        </Link>
      </div>
    </form>
  );
}
