"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { FormFooter } from "@/components/ui/form-footer";
import { Notice } from "@/components/ui/notice";
import type { Satuan } from "@/core/master/types";

import { simpanSatuanAction } from "../actions";
import { PATH_MASTER_SATUAN } from "../constants";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type SatuanFormProps = {
  satuan?: Satuan;
};

export function SatuanForm({ satuan }: SatuanFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanSatuanAction,
    INITIAL_MASTER_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const cancelHref = satuan
    ? `${PATH_MASTER_SATUAN}?id=${satuan.id}`
    : PATH_MASTER_SATUAN;

  return (
    <form action={formAction} className={styles.form} noValidate>
      {satuan ? <input name="id" type="hidden" value={satuan.id} /> : null}

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
        <FormField error={fieldErrors.kode} label="Kode satuan" name="kode" required>
          <Input
            autoComplete="off"
            defaultValue={satuan?.kode ?? ""}
            name="kode"
            placeholder="Contoh: KG"
          />
        </FormField>

        <FormField error={fieldErrors.nama} label="Nama satuan" name="nama" required>
          <Input
            autoComplete="off"
            defaultValue={satuan?.nama ?? ""}
            name="nama"
            placeholder="Contoh: Kilogram"
          />
        </FormField>
      </div>

      <FormFooter
        busy={pending}
        busyLabel="Menyimpan..."
        cancelHref={cancelHref}
        submitLabel={satuan ? "Simpan perubahan" : "Simpan satuan"}
      />
    </form>
  );
}
