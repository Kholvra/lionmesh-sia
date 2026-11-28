"use client";

import { useActionState } from "react";

import { catatLokasiAction } from "../actions";
import { INITIAL_QC_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type Props = {
  penerimaanItemId: string;
  label: string;
  qtyGagal: string;
  lokasi: string | null;
};

export function LokasiForm({ label, lokasi, penerimaanItemId, qtyGagal }: Props) {
  const [state, action, pending] = useActionState(
    catatLokasiAction,
    INITIAL_QC_ACTION_STATE,
  );

  return (
    <form action={action} className={table.inlineForm}>
      <input name="penerimaan_item_id" type="hidden" value={penerimaanItemId} />
      <span className={common.panelMeta}>
        {label} · gagal {qtyGagal}
      </span>
      <input
        aria-label={`Lokasi pemisahan ${label}`}
        className={table.qtyInput}
        defaultValue={lokasi ?? ""}
        name="lokasi"
        placeholder="Karantina"
      />
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "..." : "Simpan"}
      </button>
      {state.status === "error" && state.message ? (
        <span className={common.messageError} role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" && state.message ? (
        <span className={common.messageSuccess} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
