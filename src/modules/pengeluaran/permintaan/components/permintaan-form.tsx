"use client";

import { useActionState, useState } from "react";

import { FormField, Input } from "@/components/ui";
import { FormFooter } from "@/components/ui/form-footer";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Gudang, Produk, Satuan } from "@/core/master";
import type { Peran } from "@/lib/auth/types";
import { ajukanPermintaanAction } from "../actions";
import { PATH_PERMINTAAN } from "../constants";
import { INITIAL_PERMINTAAN_ACTION_STATE } from "../form-state";
import styles from "../permintaan.module.css";

type Row = {
  key: number;
  produkId: string;
  satuanId: string;
  qty: string;
};

type Props = {
  produk: readonly Produk[];
  satuan: readonly Satuan[];
  gudang: readonly Gudang[];
  peran: Peran | null;
};

let nextKey = 2;

export function PermintaanForm({ gudang, peran, produk, satuan }: Props) {
  const [state, formAction, pending] = useActionState(
    ajukanPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  const [rows, setRows] = useState<Row[]>([
    { key: 1, produkId: "", satuanId: "", qty: "" },
  ]);

  const fieldErrors = state.fieldErrors ?? {};
  const isProduksi = peran === "Produksi";

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function pilihProduk(key: number, produkId: string) {
    const selected = produk.find((item) => item.id === produkId);
    updateRow(key, {
      produkId,
      satuanId: selected?.satuan_dasar_id ?? "",
    });
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.status === "error" && state.message ? (
        <Notice tone="danger">{state.message}</Notice>
      ) : null}
      {state.status === "success" && state.message ? (
        <Notice tone="success">{state.message}</Notice>
      ) : null}

      <div className={styles.formGrid}>
        <FormField
          error={fieldErrors.gudang_id}
          label="Gudang tujuan"
          name="gudang_id"
          required
        >
          <Select
            defaultValue={gudang.length === 1 ? gudang[0]?.id : ""}
            options={[
              { label: "Pilih gudang", value: "" },
              ...gudang.map((item) => ({
                label: `${item.kode} — ${item.nama}`,
                value: item.id,
              })),
            ]}
          />
        </FormField>

        <FormField
          error={fieldErrors.tanggal_butuh}
          label="Tanggal butuh"
          name="tanggal_butuh"
          required
        >
          <Input id="tanggal_butuh" name="tanggal_butuh" type="date" />
        </FormField>

        {isProduksi ? (
          <div className={styles.fieldFull}>
            <FormField
              error={fieldErrors.wo_id}
              helpText="Referensi perintah produksi; wajib untuk pemohon Produksi."
              label="Referensi perintah produksi"
              name="wo_id"
              required
            >
              <Input id="wo_id" name="wo_id" placeholder="UUID perintah produksi" />
            </FormField>
          </div>
        ) : null}

        <div className={styles.fieldFull}>
          <FormField label="Keterangan" name="keterangan">
            <textarea
              className={styles.textarea}
              id="keterangan"
              name="keterangan"
              placeholder="Keterangan kebutuhan (opsional)"
            />
          </FormField>
        </div>
      </div>

      <section aria-labelledby="baris-permintaan">
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle} id="baris-permintaan">
              Barang yang diminta
            </h2>
            <p className={styles.panelMeta}>
              Minimal satu baris. Qty memakai maksimal 4 angka desimal.
            </p>
          </div>
          <SubmitButton
            onClick={() =>
              setRows((current) => [
                ...current,
                { key: nextKey++, produkId: "", satuanId: "", qty: "" },
              ])
            }
            size="lg"
            type="button"
            variant="secondary"
          >
            Tambah baris
          </SubmitButton>
        </div>

        {fieldErrors.baris ? (
          <Notice tone="danger">{fieldErrors.baris}</Notice>
        ) : null}

        {rows.map((row, index) => (
          <div key={row.key}>
            <div className={styles.lineGrid}>
              <div>
                <label className={styles.detailLabel} htmlFor={`produk-${row.key}`}>
                  Produk
                </label>
                <Select
                  id={`produk-${row.key}`}
                  name="produk_id"
                  onChange={(event) => pilihProduk(row.key, event.target.value)}
                  options={[
                    { label: "Pilih produk", value: "" },
                    ...produk.map((item) => ({
                      label: `${item.kode} — ${item.nama}`,
                      value: item.id,
                    })),
                  ]}
                  value={row.produkId}
                />
              </div>

              <div>
                <label className={styles.detailLabel} htmlFor={`satuan-${row.key}`}>
                  Satuan
                </label>
                <Select
                  id={`satuan-${row.key}`}
                  name="satuan_id"
                  onChange={(event) => updateRow(row.key, { satuanId: event.target.value })}
                  options={[
                    { label: "Pilih satuan", value: "" },
                    ...satuan.map((item) => ({
                      label: item.kode,
                      value: item.id,
                    })),
                  ]}
                  value={row.satuanId}
                />
              </div>

              <div>
                <label className={styles.detailLabel} htmlFor={`qty-${row.key}`}>
                  Qty
                </label>
                <Input
                  id={`qty-${row.key}`}
                  inputMode="decimal"
                  name="qty"
                  onChange={(event) => updateRow(row.key, { qty: event.target.value })}
                  placeholder="0"
                  value={row.qty}
                />
              </div>

              <SubmitButton
                aria-label={`Hapus baris ${index + 1}`}
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((current) => current.filter((item) => item.key !== row.key))
                }
                size="lg"
                type="button"
                variant="secondary"
              >
                Hapus
              </SubmitButton>
            </div>
            {fieldErrors[`baris_${index}`] ? (
              <Notice tone="danger">
                Baris {index + 1}: {fieldErrors[`baris_${index}`]}
              </Notice>
            ) : null}
          </div>
        ))}
      </section>

      <FormFooter
        busy={pending}
        busyLabel="Mengajukan..."
        cancelHref={PATH_PERMINTAAN}
        size="lg"
        submitLabel="Ajukan permintaan"
      />
    </form>
  );
}
