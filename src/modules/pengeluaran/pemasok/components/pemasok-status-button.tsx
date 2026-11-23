"use client";

import { useActionState, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui";
import { ubahStatusPemasokAction } from "../actions";
import { INITIAL_PEMASOK_ACTION_STATE } from "../schema";
import styles from "../pemasok.module.css";

type PemasokStatusButtonProps = {
  pemasokId: string;
  nama: string;
  aktif: boolean;
};

export function PemasokStatusButton({
  aktif,
  nama,
  pemasokId,
}: PemasokStatusButtonProps) {
  const [state, formAction, pending] = useActionState(
    ubahStatusPemasokAction,
    INITIAL_PEMASOK_ACTION_STATE,
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const label = aktif ? "Nonaktifkan" : "Aktifkan";

  function confirm() {
    formRef.current?.requestSubmit();
  }

  return (
    <div>
      <form action={formAction} ref={formRef}>
        <input name="id" type="hidden" value={pemasokId} />
        <input name="aktif" type="hidden" value={aktif ? "false" : "true"} />
        <button
          className={aktif ? styles.dangerButton : styles.secondaryButton}
          disabled={pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {pending ? "Memproses..." : label}
        </button>
      </form>

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

      <ConfirmDialog
        confirmLabel={label}
        description={
          aktif
            ? `Pemasok ${nama} tidak akan bisa dipilih untuk dokumen baru. Dokumen yang masih terbuka tetap berjalan.`
            : `Pemasok ${nama} akan bisa dipilih kembali untuk dokumen baru.`
        }
        destructive={aktif}
        onConfirm={confirm}
        onOpenChange={setOpen}
        open={open}
        pending={pending}
        title={`${label} pemasok?`}
      />
    </div>
  );
}
