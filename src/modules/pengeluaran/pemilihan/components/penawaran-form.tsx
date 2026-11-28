"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { simpanHargaAction } from "../actions";
import { INITIAL_PEMILIHAN_ACTION_STATE } from "../form-state";
import styles from "../../permintaan/permintaan.module.css";

type ItemOption = { id: string; label: string };
type PemasokOption = { id: string; nama: string };

type Props = {
  permintaanId: string;
  items: readonly ItemOption[];
  pemasok: readonly PemasokOption[];
  hariIni: string;
};

export function PenawaranForm({ items, pemasok, permintaanId, hariIni }: Props) {
  const [state, action, pending] = useActionState(
    simpanHargaAction,
    INITIAL_PEMILIHAN_ACTION_STATE,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="permintaan_id" type="hidden" value={permintaanId} />

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
        <div className={styles.fieldFull}>
          <FormField id="penawaran-item" label="Barang" name="item_id" required>
            <select
              className={styles.select}
              defaultValue={items.length === 1 ? items[0]?.id : ""}
              id="penawaran-item"
              name="item_id"
            >
              <option value="">Pilih barang</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField id="penawaran-pemasok" label="Pemasok" name="pemasok_id" required>
          <select
            className={styles.select}
            id="penawaran-pemasok"
            name="pemasok_id"
          >
            <option value="">Pilih pemasok</option>
            {pemasok.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nama}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          helpText="Harga net sebelum PPN, dalam IDR."
          id="penawaran-harga"
          label="Harga pembanding"
          name="harga"
          required
        >
          <Input
            id="penawaran-harga"
            inputMode="decimal"
            name="harga"
            placeholder="0"
          />
        </FormField>

        <FormField id="penawaran-tanggal" label="Tanggal harga" name="tanggal" required>
          <Input
            defaultValue={hariIni}
            id="penawaran-tanggal"
            name="tanggal"
            type="date"
          />
        </FormField>
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Menyimpan..." : "Simpan harga"}
        </button>
      </div>
    </form>
  );
}
