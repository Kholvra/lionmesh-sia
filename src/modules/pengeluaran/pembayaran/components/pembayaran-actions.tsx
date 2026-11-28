"use client";

import { useActionState } from "react";

import { FormField } from "@/components/ui";
import {
  batalkanPembayaranAction,
  catatHasilTransferAction,
  verifikasiPembayaranAction,
} from "../actions";
import { INITIAL_BAYAR_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";

type Props = {
  dokumenId: string;
  versi: number;
  status: string;
  terverifikasi: boolean;
  bisaVerifikasi: boolean;
  bisaHasil: boolean;
  bisaBatal: boolean;
};

export function PembayaranActions({
  bisaBatal,
  bisaHasil,
  bisaVerifikasi,
  dokumenId,
  status,
  terverifikasi,
  versi,
}: Props) {
  return (
    <div>
      {bisaVerifikasi && status === "DIAJUKAN" && !terverifikasi ? (
        <VerifikasiForm dokumenId={dokumenId} />
      ) : null}

      {bisaHasil && status === "DIAJUKAN" && terverifikasi ? (
        <div className={common.actionButtons}>
          <HasilForm berhasil dokumenId={dokumenId} versi={versi} />
          <HasilForm berhasil={false} dokumenId={dokumenId} versi={versi} />
        </div>
      ) : null}

      {bisaBatal && status === "DIPOSTING" ? (
        <BatalForm dokumenId={dokumenId} versi={versi} />
      ) : null}
    </div>
  );
}

function VerifikasiForm({ dokumenId }: { dokumenId: string }) {
  const [state, action, pending] = useActionState(
    verifikasiPembayaranAction,
    INITIAL_BAYAR_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
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
        {pending ? "Memverifikasi..." : "Verifikasi pembayaran"}
      </button>
    </form>
  );
}

function HasilForm({
  berhasil,
  dokumenId,
  versi,
}: {
  berhasil: boolean;
  dokumenId: string;
  versi: number;
}) {
  const [state, action, pending] = useActionState(
    catatHasilTransferAction,
    INITIAL_BAYAR_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm} encType="multipart/form-data">
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <input name="berhasil" type="hidden" value={berhasil ? "true" : "false"} />

      {berhasil ? (
        <FormField
          helpText="PDF, JPG, atau PNG. Maksimal 5 MB."
          id="bukti-transfer"
          label="Bukti transfer"
          name="bukti"
          required
        >
          <input
            accept="application/pdf,image/jpeg,image/png"
            className={common.reasonInput}
            id="bukti-transfer"
            name="bukti"
            type="file"
          />
        </FormField>
      ) : (
        <FormField id="alasan-gagal" label="Alasan kegagalan" name="alasan">
          <textarea
            className={common.textarea}
            id="alasan-gagal"
            name="alasan"
            placeholder="Contoh: rekening tujuan ditolak bank"
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
        className={berhasil ? common.primaryButton : common.dangerButton}
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Menyimpan..."
          : berhasil
            ? "Catat transfer berhasil"
            : "Catat transfer gagal"}
      </button>
    </form>
  );
}

function BatalForm({ dokumenId, versi }: { dokumenId: string; versi: number }) {
  const [state, action, pending] = useActionState(
    batalkanPembayaranAction,
    INITIAL_BAYAR_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <FormField
        helpText="Jurnal pembalik dibuat dan sisa utang kembali."
        id="batal-bayar-alasan"
        label="Alasan pembatalan"
        name="alasan"
      >
        <textarea
          className={common.textarea}
          id="batal-bayar-alasan"
          name="alasan"
          placeholder="Contoh: transfer salah rekening"
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
        {pending ? "Membatalkan..." : "Batalkan pembayaran"}
      </button>
    </form>
  );
}
