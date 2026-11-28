"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { FormFooter } from "@/components/ui/form-footer";
import { Notice } from "@/components/ui/notice";
import type { Gudang } from "@/core/master/types";

import { simpanGudangAction } from "../actions";
import { PATH_MASTER_GUDANG } from "../constants";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type GudangFormProps = {
  gudang?: Gudang;
};

export function GudangForm({ gudang }: GudangFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanGudangAction,
    INITIAL_MASTER_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const cancelHref = gudang
    ? `${PATH_MASTER_GUDANG}?id=${gudang.id}`
    : PATH_MASTER_GUDANG;

  return (
    <form action={formAction} className={styles.form} noValidate>
      {gudang ? <input name="id" type="hidden" value={gudang.id} /> : null}

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
        <FormField error={fieldErrors.kode} label="Kode gudang" name="kode" required>
          <Input
            autoComplete="off"
            defaultValue={gudang?.kode ?? ""}
            name="kode"
            placeholder="Contoh: GUDANG-02"
          />
        </FormField>

        <FormField error={fieldErrors.nama} label="Nama gudang" name="nama" required>
          <Input
            autoComplete="off"
            defaultValue={gudang?.nama ?? ""}
            name="nama"
            placeholder="Contoh: Gudang Bahan"
          />
        </FormField>
      </div>

      <FormFooter
        busy={pending}
        busyLabel="Menyimpan..."
        cancelHref={cancelHref}
        submitLabel={gudang ? "Simpan perubahan" : "Simpan gudang"}
      />
    </form>
  );
}
