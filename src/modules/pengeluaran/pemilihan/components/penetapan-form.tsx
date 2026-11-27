"use client";

import { useActionState } from "react";

import { FormField } from "@/components/ui";
import { tetapkanPemasokAction } from "../actions";
import { INITIAL_PEMILIHAN_ACTION_STATE } from "../form-state";
import styles from "../../permintaan/permintaan.module.css";

type PemasokOption = {
  id: string;
  nama: string;
  lengkap: boolean;
  total: string | null;
  termurah: boolean;
};

type Props = {
  permintaanId: string;
  versi: number;
  pemasok: readonly PemasokOption[];
};

export function PenetapanForm({ pemasok, permintaanId, versi }: Props) {
  const [state, action, pending] = useActionState(
    tetapkanPemasokAction,
    INITIAL_PEMILIHAN_ACTION_STATE,
  );

  const lengkap = pemasok.filter((item) => item.lengkap);

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="permintaan_id" type="hidden" value={permintaanId} />
      <input name="versi" type="hidden" value={versi} />

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

      {lengkap.length === 0 ? (
        <p className={styles.emptyState}>
          Belum ada pemasok yang punya harga untuk semua barang. Isi harga pembanding
          lebih dulu.
        </p>
      ) : (
        <>
          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <FormField
                helpText="Hanya pemasok dengan harga lengkap yang bisa ditetapkan."
                id="penetapan-pemasok"
                label="Pemasok terpilih"
                name="pemasok_id"
                required
              >
                <select
                  className={styles.select}
                  id="penetapan-pemasok"
                  name="pemasok_id"
                >
                  <option value="">Pilih pemasok</option>
                  {lengkap.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                      {item.termurah ? " — total terendah" : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className={styles.fieldFull}>
              <FormField
                helpText="Wajib bila pemasok bukan total harga terendah."
                id="penetapan-alasan"
                label="Alasan pemilihan"
                name="alasan"
              >
                <textarea
                  className={styles.textarea}
                  id="penetapan-alasan"
                  name="alasan"
                  placeholder="Contoh: waktu kirim lebih cepat"
                />
              </FormField>
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.primaryButton} disabled={pending} type="submit">
              {pending ? "Menetapkan..." : "Tetapkan pemasok"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
