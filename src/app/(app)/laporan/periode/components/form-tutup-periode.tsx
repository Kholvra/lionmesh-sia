"use client";

import Link from "next/link";
import { useActionState } from "react";

import { tutupPeriodeAction, type AksiTutupState } from "../actions";
import styles from "../periode.module.css";

interface FormTutupPeriodeProps {
  periode: string;
  bisaDitutup: boolean;
}

export function FormTutupPeriode({
  periode,
  bisaDitutup,
}: FormTutupPeriodeProps) {
  const [state, formAction, pending] = useActionState<AksiTutupState, FormData>(
    tutupPeriodeAction,
    null,
  );

  return (
    <div className={styles.actions}>
      <form action={formAction} className={styles.formInline}>
        <input name="periode" type="hidden" value={periode} />
        <button
          className={styles.primaryButton}
          disabled={!bisaDitutup || pending}
          type="submit"
        >
          {pending ? "Menutup…" : "Tutup periode"}
        </button>
      </form>

      <Link className={styles.secondaryButton} href="/laporan/periode">
        Batal
      </Link>

      {state?.ok === false ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
