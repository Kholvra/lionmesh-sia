"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

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
        <SubmitButton
          className={styles.primaryButton}
          busyLabel="Menutup…"
          disabled={!bisaDitutup || pending}
          pending={pending}
          type="submit"
        >
          Tutup periode
        </SubmitButton>
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
