"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  batalkanReturAction,
  catatQcReturAction,
  setujuiReturAction,
  tolakReturAction,
} from "../actions";
import { PATH_RETUR } from "../constants";
import { formatAngka } from "../format";
import styles from "../retur.module.css";
import type { ReturItemRow } from "../types";

type ReturActionsProps = {
  returId: string;
  nomor: string;
  status: string;
  items: ReturItemRow[];
  isCreator: boolean;
  canApprove: boolean;
  canQc: boolean;
};

export function ReturActions({
  returId,
  nomor,
  status,
  items,
  isCreator,
  canApprove,
  canQc,
}: ReturActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [mode, setMode] = useState<"tolak" | "batal" | "qc" | null>(null);
  const [alasan, setAlasan] = useState("");
  const [qcCatatan, setQcCatatan] = useState("");
  const [qcQtyMap, setQcQtyMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((it) => [it.id, String(it.qtyRetur)])),
  );

  function handleSetujui() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await setujuiReturAction(returId);
      setConfirmApproveOpen(false);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.data.message);
        router.refresh();
      }
    });
  }

  function handleTolak(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await tolakReturAction(returId, alasan);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
        setAlasan("");
        router.refresh();
      }
    });
  }

  function handleBatal(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await batalkanReturAction(returId, alasan);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
        setAlasan("");
        router.refresh();
      }
    });
  }

  function handleQcSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payloadItems = items.map((it) => ({
      itemId: it.id,
      qtyLulus: Number(qcQtyMap[it.id] ?? 0),
    }));

    startTransition(async () => {
      const res = await catatQcReturAction({
        returId,
        catatan: qcCatatan || null,
        items: payloadItems,
      });
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
        setSuccessMsg(res.data.message);
        router.refresh();
      }
    });
  }

  const showApprove = canApprove && status === "DIAJUKAN" && !isCreator;
  const showSegregationNote = canApprove && status === "DIAJUKAN" && isCreator;
  const showQc = canQc && status === "DISETUJUI";
  const showBatal =
    isCreator && (status === "DIAJUKAN" || status === "DISETUJUI");

  return (
    <div>
      {errorMsg ? (
        <div
          className={`${styles.alertBox} ${styles.alertError}`}
          role="alert"
          style={{ marginTop: "var(--space-4)" }}
        >
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div
          className={`${styles.alertBox} ${styles.alertSuccess}`}
          role="status"
          style={{ marginTop: "var(--space-4)" }}
        >
          {successMsg}
        </div>
      ) : null}

      {showSegregationNote ? (
        <div
          className={`${styles.alertBox} ${styles.alertInfo}`}
          role="status"
          style={{ marginTop: "var(--space-4)" }}
        >
          Anda tercatat sebagai pengaju retur ini. Sesuai pemisahan tugas,
          persetujuan harus dilakukan oleh user Accounting lain.
        </div>
      ) : null}

      {mode === "tolak" || mode === "batal" ? (
        <form
          onSubmit={mode === "tolak" ? handleTolak : handleBatal}
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-4)",
            borderTop: "var(--border-width-default) solid var(--border-subtle)",
          }}
        >
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="alasan-retur-aksi">
              {mode === "tolak" ? "Alasan Penolakan *" : "Alasan Pembatalan *"}
            </label>
            <textarea
              className={styles.textarea}
              id="alasan-retur-aksi"
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Tuliskan alasan secara jelas"
              required
              value={alasan}
            />
          </div>
          <div
            className={styles.actionRow}
            style={{ marginTop: "var(--space-3)" }}
          >
            <button
              className={styles.dangerButton}
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Memproses..."
                : mode === "tolak"
                  ? "Konfirmasi Tolak"
                  : "Konfirmasi Pembatalan"}
            </button>
            <button
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={() => {
                setMode(null);
                setErrorMsg(null);
              }}
              type="button"
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}

      {mode === "qc" ? (
        <form
          onSubmit={handleQcSubmit}
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-4)",
            borderTop: "var(--border-width-default) solid var(--border-subtle)",
          }}
        >
          <h3
            className={styles.panelTitle}
            style={{ marginBottom: "var(--space-3)" }}
          >
            Input Hasil Pemeriksaan QC
          </h3>
          {items.map((it) => (
            <div
              className={styles.field}
              key={it.id}
              style={{ marginBottom: "var(--space-3)" }}
            >
              <label className={styles.fieldLabel} htmlFor={`qc-qty-${it.id}`}>
                {it.produkNama} (Disetujui: {formatAngka(it.qtyRetur)}{" "}
                {it.satuanKode})
              </label>
              <input
                className={styles.input}
                id={`qc-qty-${it.id}`}
                max={it.qtyRetur}
                min={0}
                onChange={(e) =>
                  setQcQtyMap((prev) => ({
                    ...prev,
                    [it.id]: e.target.value,
                  }))
                }
                required
                step="any"
                type="number"
                value={qcQtyMap[it.id] ?? "0"}
              />
            </div>
          ))}
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="qc-catatan">
              Catatan QC (wajib jika qty lulus = 0 / ada selisih)
            </label>
            <textarea
              className={styles.textarea}
              id="qc-catatan"
              onChange={(e) => setQcCatatan(e.target.value)}
              placeholder="Contoh: 3 unit layak jual kembali, 2 unit rusak berat"
              value={qcCatatan}
            />
          </div>
          <div
            className={styles.actionRow}
            style={{ marginTop: "var(--space-3)" }}
          >
            <button
              className={styles.primaryButton}
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Memproses QC..." : "Simpan Hasil QC"}
            </button>
            <button
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={() => {
                setMode(null);
                setErrorMsg(null);
              }}
              type="button"
            >
              Batal
            </button>
          </div>
        </form>
      ) : null}

      <div className={styles.actionBar}>
        {showApprove ? (
          <>
            <button
              className={styles.primaryButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setMode(null);
                setConfirmApproveOpen(true);
              }}
              type="button"
            >
              Setujui Retur
            </button>
            <button
              className={styles.dangerButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setMode("tolak");
              }}
              type="button"
            >
              Tolak Retur
            </button>
          </>
        ) : null}

        {showQc && mode !== "qc" ? (
          <button
            className={styles.primaryButton}
            disabled={isPending}
            onClick={() => {
              setErrorMsg(null);
              setMode("qc");
            }}
            type="button"
          >
            Catat Hasil QC
          </button>
        ) : null}

        {showBatal && mode !== "batal" ? (
          <button
            className={styles.dangerButton}
            disabled={isPending}
            onClick={() => {
              setErrorMsg(null);
              setMode("batal");
            }}
            type="button"
          >
            Batalkan Pengajuan
          </button>
        ) : null}

        <Link className={styles.secondaryButton} href={PATH_RETUR}>
          Kembali ke Daftar
        </Link>
      </div>

      <ConfirmDialog
        confirmLabel="Ya, Setujui"
        description={`Setujui pengajuan retur ${nomor} agar dapat diperiksa oleh QC?`}
        onConfirm={handleSetujui}
        onOpenChange={setConfirmApproveOpen}
        open={confirmApproveOpen}
        pending={isPending}
        title="Konfirmasi Persetujuan Retur"
      />
    </div>
  );
}
