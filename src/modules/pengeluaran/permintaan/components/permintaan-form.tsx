"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { FormField, Input } from "@/components/ui";
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
          error={fieldErrors.gudang_id}
          label="Gudang tujuan"
          name="gudang_id"
          required
        >
          <select
            className={styles.select}
            defaultValue={gudang.length === 1 ? gudang[0]?.id : ""}
            id="gudang_id"
            name="gudang_id"
          >
            <option value="">Pilih gudang</option>
            {gudang.map((item) => (
              <option key={item.id} value={item.id}>
                {item.kode} — {item.nama}
              </option>
            ))}
          </select>
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
          <button
            className={styles.secondaryButton}
            onClick={() =>
              setRows((current) => [
                ...current,
                { key: nextKey++, produkId: "", satuanId: "", qty: "" },
              ])
            }
            type="button"
          >
            Tambah baris
          </button>
        </div>

        {fieldErrors.baris ? (
          <p className={styles.lineError} role="alert">
            {fieldErrors.baris}
          </p>
        ) : null}

        {rows.map((row, index) => (
          <div key={row.key}>
            <div className={styles.lineGrid}>
              <div>
                <label className={styles.detailLabel} htmlFor={`produk-${row.key}`}>
                  Produk
                </label>
                <select
                  className={styles.select}
                  id={`produk-${row.key}`}
                  name="produk_id"
                  onChange={(event) => pilihProduk(row.key, event.target.value)}
                  value={row.produkId}
                >
                  <option value="">Pilih produk</option>
                  {produk.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode} — {item.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.detailLabel} htmlFor={`satuan-${row.key}`}>
                  Satuan
                </label>
                <select
                  className={styles.select}
                  id={`satuan-${row.key}`}
                  name="satuan_id"
                  onChange={(event) => updateRow(row.key, { satuanId: event.target.value })}
                  value={row.satuanId}
                >
                  <option value="">Pilih satuan</option>
                  {satuan.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode}
                    </option>
                  ))}
                </select>
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

              <button
                aria-label={`Hapus baris ${index + 1}`}
                className={styles.secondaryButton}
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((current) => current.filter((item) => item.key !== row.key))
                }
                type="button"
              >
                Hapus
              </button>
            </div>
            {fieldErrors[`baris_${index}`] ? (
              <p className={styles.lineError} role="alert">
                Baris {index + 1}: {fieldErrors[`baris_${index}`]}
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Mengajukan..." : "Ajukan permintaan"}
        </button>
        <Link className={styles.secondaryButton} href={PATH_PERMINTAAN}>
          Batal
        </Link>
      </div>
    </form>
  );
}
