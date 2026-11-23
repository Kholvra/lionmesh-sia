"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
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

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending
            ? "Menyimpan..."
            : satuan
              ? "Simpan perubahan"
              : "Simpan satuan"}
        </button>
        <Link className={styles.secondaryButton} href={cancelHref}>
          Batal
        </Link>
      </div>
    </form>
  );
}
