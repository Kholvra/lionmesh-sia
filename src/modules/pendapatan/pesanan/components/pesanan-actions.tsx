"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  batalkanPesananAction,
  overrideKreditAction,
  revisiPesananAction,
  verifikasiPesananAction,
} from "../actions";
import { PATH_PESANAN } from "../constants";
import styles from "../pesanan.module.css";

type PesananActionsProps = {
  pesananId: string;
  nomor: string;
  status: string;
  isCreator: boolean;
  canEdit: boolean;
  canVerify: boolean;
  canOverride: boolean;
  canCancel: boolean;
};

type ReasonMode = "revisi" | "override" | "batal" | null;

export function PesananActions({
  pesananId,
  nomor,
  status,
  isCreator,
  canEdit,
  canVerify,
  canOverride,
  canCancel,
}: PesananActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [reasonMode, setReasonMode] = useState<ReasonMode>(null);
  const [alasan, setAlasan] = useState("");

  function handleVerifikasi() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await verifikasiPesananAction(pesananId);
      setVerifyDialogOpen(false);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.data.message);
        router.refresh();
      }
    });
  }

  function handleReasonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      let res;
      if (reasonMode === "revisi") {
        res = await revisiPesananAction(pesananId, alasan);
      } else if (reasonMode === "override") {
        res = await overrideKreditAction(pesananId, alasan);
      } else if (reasonMode === "batal") {
        res = await batalkanPesananAction(pesananId, alasan);
      }

      if (res && !res.ok) {
        setErrorMsg(res.message);
      } else {
        setReasonMode(null);
        setAlasan("");
        router.refresh();
      }
    });
  }

  const showEdit = canEdit && isCreator && (status === "DRAFT" || status === "REVISI");
  const showVerify = canVerify && (status === "DRAFT" || status === "REVISI");
  const showRevisi = canVerify && !isCreator && status === "DRAFT";
  const showOverride = canOverride && status === "MENUNGGU_PERSETUJUAN_KREDIT";
  const showCancel =
    canCancel &&
    (status === "DRAFT" ||
      status === "REVISI" ||
      status === "MENUNGGU_PERSETUJUAN_KREDIT" ||
      status === "VERIFIED");

  return (
    <div>
      {errorMsg ? (
        <div className={`${styles.alertBox} ${styles.alertError}`} role="alert" style={{ marginTop: "var(--space-4)" }}>
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className={`${styles.alertBox} ${styles.alertSuccess}`} role="status" style={{ marginTop: "var(--space-4)" }}>
          {successMsg}
        </div>
      ) : null}

      {reasonMode ? (
        <div
          className={styles.panelCard}
          style={{ marginTop: "var(--space-4)", background: "var(--bg-surface-hover)" }}
        >
          <form onSubmit={handleReasonSubmit}>
            <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-2)" }}>
              {reasonMode === "revisi"
                ? `Kembalikan Pesanan ${nomor} untuk Revisi`
                : reasonMode === "override"
                  ? `Override Batas Kredit — ${nomor}`
                  : `Batalkan Pesanan ${nomor}`}
            </h3>
            <p className={styles.panelSubtitle} style={{ marginBottom: "var(--space-3)" }}>
              {reasonMode === "revisi"
                ? "Tuliskan alasan pengembalian agar pembuat dapat memperbaiki draf."
                : reasonMode === "override"
                  ? "Wewenang Manajemen: Alasan tertulis wajib dicatat pada riwayat audit."
                  : "Pesanan yang dibatalkan tidak dapat dibuka kembali. Tuliskan alasan pembatalan."}
            </p>
            <textarea
              aria-label="Alasan"
              className={styles.textareaControl}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Tuliskan alasan secara jelas..."
              required
              rows={3}
              value={alasan}
            />
            <div className={styles.actionBarGroup} style={{ marginTop: "var(--space-3)" }}>
              <button
                className={
                  reasonMode === "batal" ? styles.dangerButton : styles.primaryButton
                }
                disabled={isPending}
                type="submit"
              >
                {isPending
                  ? "Memproses..."
                  : reasonMode === "revisi"
                    ? "Kirim Revisi"
                    : reasonMode === "override"
                      ? "Setujui Override"
                      : "Konfirmasi Pembatalan"}
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isPending}
                onClick={() => {
                  setReasonMode(null);
                  setAlasan("");
                  setErrorMsg(null);
                }}
                type="button"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={styles.actionBar}>
        <Link className={styles.secondaryButton} href={PATH_PESANAN}>
          ← Daftar Pesanan
        </Link>

        <div className={styles.actionBarGroup}>
          {showCancel ? (
            <button
              className={styles.dangerButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setReasonMode("batal");
              }}
              type="button"
            >
              Batalkan Pesanan
            </button>
          ) : null}

          {showRevisi ? (
            <button
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setReasonMode("revisi");
              }}
              type="button"
            >
              Kembalikan (Revisi)
            </button>
          ) : null}

          {showEdit ? (
            <Link
              className={styles.secondaryButton}
              href={`${PATH_PESANAN}/${pesananId}?mode=edit`}
            >
              Ubah Pesanan
            </Link>
          ) : null}

          {showVerify ? (
            <button
              className={styles.primaryButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setVerifyDialogOpen(true);
              }}
              type="button"
            >
              Verifikasi Pesanan
            </button>
          ) : null}

          {showOverride ? (
            <button
              className={styles.primaryButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setReasonMode("override");
              }}
              type="button"
            >
              Override Batas Kredit
            </button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Ya, Verifikasi"
        description={`Verifikasi pesanan ${nomor}? Sistem akan mengunci rincian pesanan dan menjalankan pemeriksaan exposure terhadap batas kredit pelanggan.`}
        onConfirm={handleVerifikasi}
        onOpenChange={setVerifyDialogOpen}
        open={verifyDialogOpen}
        pending={isPending}
        title="Verifikasi pesanan penjualan?"
      />
    </div>
  );
}
