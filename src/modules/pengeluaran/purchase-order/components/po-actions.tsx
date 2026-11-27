"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { batalkanPoAction, catatKonfirmasiAction } from "../actions";
import { INITIAL_PO_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";

type Props = {
  dokumenId: string;
  versi: number;
  catatanKonfirmasi: string | null;
  bisaBatalkan: boolean;
};

export function PoActions({
  bisaBatalkan,
  catatanKonfirmasi,
  dokumenId,
  versi,
}: Props) {
  return (
    <div>
      <KonfirmasiForm
        catatanKonfirmasi={catatanKonfirmasi}
        dokumenId={dokumenId}
      />
      {bisaBatalkan ? <BatalkanForm dokumenId={dokumenId} versi={versi} /> : null}
    </div>
  );
}

function KonfirmasiForm({
  catatanKonfirmasi,
  dokumenId,
}: {
  catatanKonfirmasi: string | null;
  dokumenId: string;
}) {
  const [state, action, pending] = useActionState(
    catatKonfirmasiAction,
    INITIAL_PO_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <FormField
        helpText="Catatan konfirmasi pemasok, bukan status dokumen."
        id="po-konfirmasi"
        label="Konfirmasi pemasok"
        name="catatan"
      >
        <Input
          defaultValue={catatanKonfirmasi ?? ""}
          id="po-konfirmasi"
          name="catatan"
          placeholder="Contoh: dikonfirmasi via telepon 27/11"
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
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "Menyimpan..." : "Simpan konfirmasi"}
      </button>
    </form>
  );
}

function BatalkanForm({ dokumenId, versi }: { dokumenId: string; versi: number }) {
  const [state, action, pending] = useActionState(
    batalkanPoAction,
    INITIAL_PO_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <FormField
        helpText="PO dan permintaannya dibatalkan. Pemesanan ulang lewat permintaan baru."
        id="po-alasan-batal"
        label="Alasan pembatalan"
        name="alasan"
      >
        <Input
          id="po-alasan-batal"
          name="alasan"
          placeholder="Contoh: pemasok membatalkan harga"
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
        {pending ? "Membatalkan..." : "Batalkan PO"}
      </button>
    </form>
  );
}
