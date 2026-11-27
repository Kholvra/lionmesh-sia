"use client";

import { useActionState } from "react";

import { FormField } from "@/components/ui";
import { batalkanPenerimaanAction } from "../actions";
import { INITIAL_PENERIMAAN_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";

type Props = {
  dokumenId: string;
  versi: number;
};

export function PenerimaanActions({ dokumenId, versi }: Props) {
  const [state, action, pending] = useActionState(
    batalkanPenerimaanAction,
    INITIAL_PENERIMAAN_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <FormField
        helpText="Penerimaan tidak bisa diedit. Batalkan lalu catat penerimaan baru."
        id="penerimaan-alasan-batal"
        label="Alasan pembatalan"
        name="alasan"
      >
        <textarea
          className={common.textarea}
          id="penerimaan-alasan-batal"
          name="alasan"
          placeholder="Contoh: salah input qty"
        />
      </FormField>
      {state.status === "error" && state.message ? (
        <p className={common.messageError} role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className={common.messageSuccess} role="status">
          {state.message}
        </p>
      ) : null}
      <button className={common.dangerButton} disabled={pending} type="submit">
        {pending ? "Membatalkan..." : "Batalkan penerimaan"}
      </button>
    </form>
  );
}
