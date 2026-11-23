"use client";

import { useActionState, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui";
import type { EntitasMaster } from "@/core/master/types";

import { ubahStatusMasterAction } from "../actions";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import styles from "../master.module.css";

type MasterStatusButtonProps = {
  entitas: EntitasMaster;
  id: string;
  label: string;
  nama: string;
  aktif: boolean;
};

export function MasterStatusButton({
  aktif,
  entitas,
  id,
  label,
  nama,
}: MasterStatusButtonProps) {
  const [state, formAction, pending] = useActionState(
    ubahStatusMasterAction,
    INITIAL_MASTER_ACTION_STATE,
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const aksi = aktif ? "Nonaktifkan" : "Aktifkan";

  function confirm() {
    formRef.current?.requestSubmit();
  }

  return (
    <div className={styles.statusAction}>
      <form action={formAction} ref={formRef}>
        <input name="entitas" type="hidden" value={entitas} />
        <input name="id" type="hidden" value={id} />
        <input name="aktif" type="hidden" value={aktif ? "false" : "true"} />
        <button
          className={aktif ? styles.dangerButton : styles.secondaryButton}
          disabled={pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {pending ? "Memproses..." : aksi}
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
        confirmLabel={aksi}
        description={
          aktif
            ? `${label} ${nama} tidak akan bisa dipilih untuk dokumen baru. Dokumen yang sudah ada tetap terbaca.`
            : `${label} ${nama} akan bisa dipilih lagi untuk dokumen baru.`
        }
        destructive={aktif}
        onConfirm={confirm}
        onOpenChange={setOpen}
        open={open}
        pending={pending}
        title={`${aksi} ${label.toLowerCase()}?`}
      />
    </div>
  );
}
