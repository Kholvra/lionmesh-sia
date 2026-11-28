"use client";

import { useActionState } from "react";

import { FormField } from "@/components/ui";
import {
  batalkanReturAction,
  putuskanReturAction,
} from "../actions";
import { INITIAL_QC_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";

type Props = {
  dokumenId: string;
  versi: number;
  status: string;
  bisaPutuskan: boolean;
  bisaBatal: boolean;
};

export function ReturActions({
  bisaBatal,
  bisaPutuskan,
  dokumenId,
  status,
  versi,
}: Props) {
  if (!bisaPutuskan && !bisaBatal) return null;

  return (
    <div>
      {bisaPutuskan && status === "DIAJUKAN" ? (
        <div className={common.actionButtons}>
          <KeputusanForm dokumenId={dokumenId} setuju versi={versi} />
          <KeputusanForm dokumenId={dokumenId} setuju={false} versi={versi} />
        </div>
      ) : null}

      {bisaBatal && status === "DIAJUKAN" ? (
        <BatalForm dokumenId={dokumenId} versi={versi} />
      ) : null}
    </div>
  );
}

function KeputusanForm({
  dokumenId,
  setuju,
  versi,
}: {
  dokumenId: string;
  setuju: boolean;
  versi: number;
}) {
  const [state, action, pending] = useActionState(
    putuskanReturAction,
    INITIAL_QC_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <input name="setuju" type="hidden" value={setuju ? "true" : "false"} />
      {setuju ? null : (
        <FormField id="retur-alasan-tolak" label="Alasan penolakan" name="alasan">
          <textarea
            className={common.textarea}
            id="retur-alasan-tolak"
            name="alasan"
            placeholder="Contoh: qty gagal tidak sesuai berita acara"
          />
        </FormField>
      )}
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
      <button
        className={setuju ? common.primaryButton : common.dangerButton}
        disabled={pending}
        type="submit"
      >
        {pending ? "Memproses..." : setuju ? "Setujui retur" : "Tolak retur"}
      </button>
    </form>
  );
}

function BatalForm({ dokumenId, versi }: { dokumenId: string; versi: number }) {
  const [state, action, pending] = useActionState(
    batalkanReturAction,
    INITIAL_QC_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <FormField
        id="retur-alasan-batal"
        label="Alasan pembatalan retur"
        name="alasan"
      >
        <textarea
          className={common.textarea}
          id="retur-alasan-batal"
          name="alasan"
          placeholder="Contoh: salah pilih baris penerimaan"
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
        {pending ? "Membatalkan..." : "Batalkan retur"}
      </button>
    </form>
  );
}
