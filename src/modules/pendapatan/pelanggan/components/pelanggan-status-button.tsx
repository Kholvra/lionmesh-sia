"use client";

import { useActionState, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateStatusPelangganAction } from "../actions";
import { INITIAL_FORM_STATE } from "../form-state";
import styles from "../pelanggan.module.css";

type PelangganStatusButtonProps = {
  id: string;
  nama: string;
  status: "aktif" | "nonaktif";
};

export function PelangganStatusButton({
  id,
  nama,
  status,
}: PelangganStatusButtonProps) {
  const [state, formAction, pending] = useActionState(
    updateStatusPelangganAction,
    INITIAL_FORM_STATE
  );
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isAktif = status === "aktif";
  const statusBaru = isAktif ? "nonaktif" : "aktif";
  const labelTombol = isAktif ? "Nonaktifkan" : "Aktifkan";

  function confirm() {
    formRef.current?.requestSubmit();
  }

  return (
    <div>
      <form action={formAction} ref={formRef}>
        <input name="id" type="hidden" value={id} />
        <input name="status" type="hidden" value={statusBaru} />
        <button
          className={isAktif ? styles.dangerButton : styles.secondaryButton}
          disabled={pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {pending ? "Memproses..." : labelTombol}
        </button>
      </form>

      {state.message && !state.ok ? (
        <p className={styles.alertError} style={{ marginTop: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}

      <ConfirmDialog
        confirmLabel={isAktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        description={
          isAktif
            ? `Pelanggan ${nama} tidak akan bisa dipilih untuk dokumen baru. Dokumen yang masih terbuka tetap berjalan.`
            : `Pelanggan ${nama} akan bisa dipilih kembali untuk dokumen baru.`
        }
        destructive={isAktif}
        onConfirm={confirm}
        onOpenChange={setOpen}
        open={open}
        pending={pending}
        title={`${labelTombol} pelanggan?`}
      />
    </div>
  );
}
