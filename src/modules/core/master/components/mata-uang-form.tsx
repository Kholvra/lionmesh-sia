"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { FormFooter } from "@/components/ui/form-footer";
import { Notice } from "@/components/ui/notice";
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
        <Notice className={styles.messageError} tone="danger">
          {state.message}
        </Notice>
      ) : null}

      {state.status === "success" && state.message ? (
        <Notice className={styles.messageSuccess} tone="success">
          {state.message}
        </Notice>
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

      <FormFooter
        busy={pending}
        busyLabel="Menyimpan..."
        cancelHref={cancelHref}
        submitLabel={mataUang ? "Simpan perubahan" : "Simpan mata uang"}
      />
    </form>
  );
}
