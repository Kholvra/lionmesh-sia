"use client";

import { useActionState, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { ubahStatusPemasokAction } from "../actions";
import { INITIAL_PEMASOK_ACTION_STATE } from "../form-state";

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
        <SubmitButton
          onClick={() => setOpen(true)}
          size="lg"
          type="button"
          variant={aktif ? "danger" : "secondary"}
        >
          {label}
        </SubmitButton>
      </form>

      {state.status === "error" && state.message ? (
        <Notice tone="danger">{state.message}</Notice>
      ) : null}

      {state.status === "success" && state.message ? (
        <Notice tone="success">{state.message}</Notice>
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
