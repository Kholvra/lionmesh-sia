"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { KategoriProduk } from "@/core/master/types";

import { simpanKategoriProdukAction } from "../actions";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type KategoriProdukFormProps = {
  kategori?: KategoriProduk;
};

export function KategoriProdukForm({ kategori }: KategoriProdukFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanKategoriProdukAction,
    INITIAL_MASTER_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      {kategori ? <input name="id" type="hidden" value={kategori.id} /> : null}

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
        <FormField error={fieldErrors.kode} label="Kode kategori" name="kode" required>
          <Input
            autoComplete="off"
            defaultValue={kategori?.kode ?? ""}
            name="kode"
            placeholder="Contoh: KAT-01"
          />
        </FormField>

        <FormField error={fieldErrors.nama} label="Nama kategori" name="nama" required>
          <Input
            autoComplete="off"
            defaultValue={kategori?.nama ?? ""}
            name="nama"
            placeholder="Contoh: Bahan Baku"
          />
        </FormField>

        <SubmitButton busy={pending} busyLabel="Menyimpan..." size="lg">
          {kategori ? "Simpan" : "Tambah kategori"}
        </SubmitButton>
      </div>
    </form>
  );
}
