"use client";

import { useActionState } from "react";

import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PermintaanPembelianView } from "@/core/pengadaan";
import {
  ajukanUlangPermintaanAction,
  batalkanPermintaanAction,
  kembalikanPermintaanAction,
  periksaPermintaanAction,
  setujuiPermintaanAction,
  tolakPermintaanAction,
} from "../actions";
import { INITIAL_PERMINTAAN_ACTION_STATE } from "../form-state";
import styles from "../permintaan.module.css";

type Props = {
  permintaan: PermintaanPembelianView;
  actorId: string;
  canPeriksa: boolean;
  canAjukan: boolean;
  canSetujui: boolean;
};

function PeriksaForm({ permintaan }: { permintaan: PermintaanPembelianView }) {
  const [state, action, pending] = useActionState(
    periksaPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  return (
    <form action={action} className={styles.actionForm}>
      <input name="id" type="hidden" value={permintaan.dokumenId} />
      <input name="versi" type="hidden" value={permintaan.versi} />
      <label className={styles.detailLabel} htmlFor="estimasi-nilai">
        Estimasi nilai (IDR)
      </label>
      <input
        className={styles.reasonInput}
        defaultValue={permintaan.nominal ?? "0"}
        id="estimasi-nilai"
        inputMode="decimal"
        name="nilai"
        placeholder="0"
      />
      {state.message ? (
        <Notice tone={state.status === "success" ? "success" : "danger"}>
          {state.message}
        </Notice>
      ) : null}
      <SubmitButton busy={pending} size="lg">
        Periksa dan teruskan
      </SubmitButton>
    </form>
  );
}

function KembalikanForm({ permintaan }: { permintaan: PermintaanPembelianView }) {
  const [state, action, pending] = useActionState(
    kembalikanPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  return (
    <form action={action} className={styles.actionForm}>
      <input name="id" type="hidden" value={permintaan.dokumenId} />
      <input name="versi" type="hidden" value={permintaan.versi} />
      <label className={styles.detailLabel} htmlFor="alasan-kembali">
        Alasan pengembalian
      </label>
      <input
        className={styles.reasonInput}
        id="alasan-kembali"
        name="alasan"
        placeholder="Contoh: qty belum sesuai kebutuhan"
      />
      {state.message ? (
        <Notice tone={state.status === "success" ? "success" : "danger"}>
          {state.message}
        </Notice>
      ) : null}
      <SubmitButton busy={pending} size="lg" variant="secondary">
        Kembalikan untuk revisi
      </SubmitButton>
    </form>
  );
}

function AjukanUlangForm({ permintaan }: { permintaan: PermintaanPembelianView }) {
  const [state, action, pending] = useActionState(
    ajukanUlangPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  return (
    <form action={action} className={styles.actionForm}>
      <input name="id" type="hidden" value={permintaan.dokumenId} />
      <input name="versi" type="hidden" value={permintaan.versi} />
      {state.message ? (
        <Notice tone={state.status === "success" ? "success" : "danger"}>
          {state.message}
        </Notice>
      ) : null}
      <SubmitButton busy={pending} size="lg">
        Ajukan ulang
      </SubmitButton>
    </form>
  );
}

function SetujuiForm({ permintaan }: { permintaan: PermintaanPembelianView }) {
  const [state, action, pending] = useActionState(
    setujuiPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  return (
    <form action={action} className={styles.actionForm}>
      <input name="id" type="hidden" value={permintaan.dokumenId} />
      <input name="versi" type="hidden" value={permintaan.versi} />
      <Pesan state={state} />
      <button className={styles.primaryButton} disabled={pending} type="submit">
        {pending ? "Memproses..." : "Setujui jenjang ini"}
      </button>
    </form>
  );
}

function TolakForm({ permintaan }: { permintaan: PermintaanPembelianView }) {
  const [state, action, pending] = useActionState(
    tolakPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  return (
    <form action={action} className={styles.actionForm}>
      <input name="id" type="hidden" value={permintaan.dokumenId} />
      <input name="versi" type="hidden" value={permintaan.versi} />
      <label className={styles.detailLabel} htmlFor="alasan-tolak">
        Alasan penolakan
      </label>
      <input
        className={styles.reasonInput}
        id="alasan-tolak"
        name="alasan"
        placeholder="Contoh: anggaran tidak tersedia"
      />
      <Pesan state={state} />
      <button className={styles.dangerButton} disabled={pending} type="submit">
        {pending ? "Memproses..." : "Tolak permintaan"}
      </button>
    </form>
  );
}

function BatalkanForm({ permintaan }: { permintaan: PermintaanPembelianView }) {
  const [state, action, pending] = useActionState(
    batalkanPermintaanAction,
    INITIAL_PERMINTAAN_ACTION_STATE,
  );
  return (
    <form action={action} className={styles.actionForm}>
      <input name="id" type="hidden" value={permintaan.dokumenId} />
      <input name="versi" type="hidden" value={permintaan.versi} />
      <label className={styles.detailLabel} htmlFor="alasan-batal">
        Alasan pembatalan
      </label>
      <input
        className={styles.reasonInput}
        id="alasan-batal"
        name="alasan"
        placeholder="Contoh: salah input"
      />
      {state.message ? (
        <Notice tone={state.status === "success" ? "success" : "danger"}>
          {state.message}
        </Notice>
      ) : null}
      <SubmitButton busy={pending} size="lg" variant="danger">
        Batalkan permintaan
      </SubmitButton>
    </form>
  );
}

export function PermintaanActions({
  actorId,
  canAjukan,
  canPeriksa,
  canSetujui,
  permintaan,
}: Props) {
  const pemohon = actorId === permintaan.pemohonId;
  const bisaBatal =
    pemohon &&
    ["DIAJUKAN", "REVISI", "MENUNGGU_PERSETUJUAN", "DISETUJUI", "PEMASOK_DITETAPKAN"].includes(
      permintaan.status,
    );

  if (
    !canPeriksa &&
    !canSetujui &&
    !(canAjukan && pemohon && (permintaan.status === "REVISI" || bisaBatal))
  ) {
    return null;
  }

  return (
    <div>
      {canPeriksa && permintaan.status === "DIAJUKAN" ? (
        <div className={styles.actionButtons}>
          <PeriksaForm permintaan={permintaan} />
          <KembalikanForm permintaan={permintaan} />
        </div>
      ) : null}

      {canSetujui && permintaan.status === "MENUNGGU_PERSETUJUAN" ? (
        <div className={styles.actionButtons}>
          <SetujuiForm permintaan={permintaan} />
          <TolakForm permintaan={permintaan} />
        </div>
      ) : null}

      {canAjukan && pemohon && permintaan.status === "REVISI" ? (
        <AjukanUlangForm permintaan={permintaan} />
      ) : null}

      {canAjukan && bisaBatal ? <BatalkanForm permintaan={permintaan} /> : null}
    </div>
  );
}
