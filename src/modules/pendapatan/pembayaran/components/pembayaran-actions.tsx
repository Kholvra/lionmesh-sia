"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { batalkanPembayaranAction, verifikasiPembayaranAction } from "../actions";
import { PATH_PEMBAYARAN } from "../constants";
import styles from "../pembayaran.module.css";

type PembayaranActionsProps = {
  pembayaranId: string;
  nomor: string;
  status: string;
  canRecord: boolean;
  canVerify: boolean;
  isCreator: boolean;
};

export function PembayaranActions({
  pembayaranId,
  nomor,
  status,
  canRecord,
  canVerify,
  isCreator,
}: PembayaranActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [confirmVerifyOpen, setConfirmVerifyOpen] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState("");

  function handleVerifikasi() {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await verifikasiPembayaranAction(pembayaranId);
      setConfirmVerifyOpen(false);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.data.message);
        router.refresh();
      }
    });
  }

  function handleBatal(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await batalkanPembayaranAction(pembayaranId, alasanBatal);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setShowCancelForm(false);
        setAlasanBatal("");
        router.refresh();
      }
    });
  }

  const showVerify = canVerify && status === "DICATAT" && !isCreator;
  const showSegregationNote = canVerify && status === "DICATAT" && isCreator;
  const showBatal =
    (status === "DICATAT" && (canRecord || canVerify)) ||
    (status === "TERVERIFIKASI" && canVerify);

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
          Anda tercatat sebagai pembuat pembayaran ini. Sesuai pemisahan tugas,
          verifikasi harus dilakukan oleh user Accounting lain.
        </div>
      ) : null}

      {showCancelForm ? (
        <div
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-4)",
            borderTop: "var(--border-width-default) solid var(--border-subtle)",
          }}
        >
          <form onSubmit={handleBatal}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="alasan-batal">
                Alasan Pembatalan *
              </label>
              <textarea
                className={styles.textarea}
                id="alasan-batal"
                onChange={(e) => setAlasanBatal(e.target.value)}
                placeholder="Contoh: Kesalahan nominal transfer atau giro ditolak bank"
                required
                value={alasanBatal}
              />
              {status === "TERVERIFIKASI" ? (
                <p className={styles.fieldHint}>
                  Membatalkan pembayaran terverifikasi akan membuat jurnal
                  pembalik dan mengembalikan saldo piutang faktur terkait.
                </p>
              ) : null}
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
                {isPending ? "Memproses..." : "Konfirmasi Pembatalan"}
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isPending}
                onClick={() => {
                  setShowCancelForm(false);
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
        {showVerify ? (
          <button
            className={styles.primaryButton}
            disabled={isPending}
            onClick={() => {
              setErrorMsg(null);
              setShowCancelForm(false);
              setConfirmVerifyOpen(true);
            }}
            type="button"
          >
            Verifikasi Pembayaran
          </button>
        ) : null}

        {showBatal && !showCancelForm ? (
          <button
            className={styles.dangerButton}
            disabled={isPending}
            onClick={() => {
              setErrorMsg(null);
              setShowCancelForm(true);
            }}
            type="button"
          >
            Batalkan Pembayaran
          </button>
        ) : null}

        <Link className={styles.secondaryButton} href={PATH_PEMBAYARAN}>
          Kembali ke Daftar
        </Link>
      </div>

      <ConfirmDialog
        confirmLabel="Ya, Verifikasi"
        description={`Verifikasi pembayaran ${nomor} akan mengalokasikan nominal secara FIFO ke faktur terlama, memposting jurnal penerimaan kas/bank, dan memperbarui status piutang. Lanjutkan?`}
        onConfirm={handleVerifikasi}
        onOpenChange={setConfirmVerifyOpen}
        open={confirmVerifyOpen}
        pending={isPending}
        title="Konfirmasi Verifikasi Pembayaran"
      />
    </div>
  );
}
