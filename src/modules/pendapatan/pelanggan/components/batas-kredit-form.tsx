"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import { updateBatasKreditAction } from "../actions";
import { INITIAL_FORM_STATE } from "../form-state";
import styles from "../pelanggan.module.css";

type BatasKreditFormProps = {
  id: string;
  nama: string;
  batasKreditSaatIni: string;
};

export function BatasKreditForm({
  id,
  nama,
  batasKreditSaatIni,
}: BatasKreditFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateBatasKreditAction,
    INITIAL_FORM_STATE
  );

  if (state.ok && state.message) {
    return (
      <div style={{ marginTop: "var(--space-4)" }}>
        <p className={`${styles.alertBox} ${styles.alertSuccess}`}>
          {state.message}
        </p>
        <button
          className={styles.secondaryButton}
          onClick={() => {
            setOpen(false);
            router.refresh();
          }}
          type="button"
        >
          Selesai
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        className={styles.secondaryButton}
        onClick={() => setOpen(true)}
        type="button"
      >
        Ubah Batas Kredit
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: "var(--space-4)",
        padding: "var(--space-4)",
        border: "var(--border-width-default) solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-surface-hover)",
      }}
    >
      <h3
        style={{
          margin: "0 0 var(--space-2)",
          fontSize: "var(--font-size-body)",
          fontWeight: 600,
        }}
      >
        Ubah Batas Kredit — {nama}
      </h3>
      <p
        style={{
          margin: "0 0 var(--space-3)",
          color: "var(--text-muted)",
          fontSize: "var(--font-size-caption)",
        }}
      >
        Wewenang Manajemen: Batas kredit menentukan pagu piutang maksimal sebelum
        pesanan ditahan untuk approval. Isi 0 untuk transaksi tunai.
      </p>

      {state.message && !state.ok ? (
        <div className={`${styles.alertBox} ${styles.alertError}`}>
          {state.message}
        </div>
      ) : null}

      <form action={formAction}>
        <input name="id" type="hidden" value={id} />

        <div style={{ marginBottom: "var(--space-3)" }}>
          <label
            htmlFor="batasKreditInput"
            style={{
              display: "block",
              marginBottom: "var(--space-1)",
              fontSize: "var(--font-size-caption)",
              fontWeight: 500,
            }}
          >
            Batas Kredit Baru (Rp)
          </label>
          <input
            className={styles.searchInput}
            defaultValue={batasKreditSaatIni}
            id="batasKreditInput"
            name="batasKredit"
            placeholder="0"
            required
            type="number"
          />
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            className={styles.primaryButton}
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Batas Kredit"}
          </button>
          <button
            className={styles.secondaryButton}
            disabled={isPending}
            onClick={() => setOpen(false)}
            type="button"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
