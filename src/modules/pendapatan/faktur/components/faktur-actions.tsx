"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { batalkanFakturAction, terbitkanFakturAction } from "../actions";
import { PATH_FAKTUR } from "../constants";
import styles from "../faktur.module.css";

type FakturActionsProps = {
  fakturId: string;
  nomor: string;
  status: string;
  initialNomorFakturPajak: string | null;
  canIssue: boolean;
};

export function FakturActions({
  fakturId,
  nomor,
  status,
  initialNomorFakturPajak,
  canIssue,
}: FakturActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [mode, setMode] = useState<"terbit" | "batal" | null>(null);
  const [nomorPajak, setNomorPajak] = useState(initialNomorFakturPajak ?? "");
  const [alasanBatal, setAlasanBatal] = useState("");

  function handleTerbitkan(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await terbitkanFakturAction(fakturId, nomorPajak);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
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
      const res = await batalkanFakturAction(fakturId, alasanBatal);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
        setAlasanBatal("");
        router.refresh();
      }
    });
  }

  const showTerbit = canIssue && status === "DRAFT";
  const showBatal =
    canIssue &&
    (status === "DRAFT" ||
      status === "DITERBITKAN" ||
      status === "SEBAGIAN_LUNAS" ||
      status === "LUNAS");

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

      {mode === "terbit" ? (
        <div
          className={styles.panelCard}
          style={{ marginTop: "var(--space-4)", background: "var(--bg-surface-hover)" }}
        >
          <form onSubmit={handleTerbitkan}>
            <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-2)" }}>
              Terbitkan Faktur {nomor}
            </h3>
            <p className={styles.panelSubtitle} style={{ marginBottom: "var(--space-3)" }}>
              Nomor faktur pajak wajib diisi sebelum faktur diterbitkan dan
              diposting ke jurnal (Piutang Usaha Dr, Penjualan Cr, PPN Keluaran Cr).
            </p>
            <div style={{ marginBottom: "var(--space-3)" }}>
              <label className={styles.fieldLabel} htmlFor="nomorPajakInput">
                Nomor Faktur Pajak *
              </label>
              <input
                className={styles.inputControl}
                id="nomorPajakInput"
                onChange={(e) => setNomorPajak(e.target.value)}
                placeholder="Masukkan nomor seri faktur pajak"
                required
                style={{ width: "100%", marginTop: "var(--space-1)" }}
                type="text"
                value={nomorPajak}
              />
            </div>
            <div className={styles.actionBarGroup}>
              <button
                className={styles.primaryButton}
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Memposting..." : "Terbitkan & Posting Jurnal"}
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isPending}
                onClick={() => setMode(null)}
                type="button"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {mode === "batal" ? (
        <div
          className={styles.panelCard}
          style={{ marginTop: "var(--space-4)", background: "var(--bg-surface-hover)" }}
        >
          <form onSubmit={handleBatal}>
            <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-2)" }}>
              Batalkan Faktur {nomor}
            </h3>
            <p className={styles.panelSubtitle} style={{ marginBottom: "var(--space-3)" }}>
              {status === "DITERBITKAN"
                ? "Pembatalan faktur terbit akan membentuk jurnal pembalik dan melepas surat jalan agar dapat difakturkan ulang."
                : "Tuliskan alasan pembatalan faktur."}
            </p>
            <textarea
              aria-label="Alasan pembatalan"
              className={styles.textareaControl}
              onChange={(e) => setAlasanBatal(e.target.value)}
              placeholder="Tuliskan alasan pembatalan..."
              required
              rows={3}
              value={alasanBatal}
            />
            <div className={styles.actionBarGroup} style={{ marginTop: "var(--space-3)" }}>
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
                onClick={() => setMode(null)}
                type="button"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className={styles.actionBar}>
        <Link className={styles.secondaryButton} href={PATH_FAKTUR}>
          ← Daftar Faktur
        </Link>

        <div className={styles.actionBarGroup}>
          {showBatal ? (
            <button
              className={styles.dangerButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setMode("batal");
              }}
              type="button"
            >
              Batalkan Faktur
            </button>
          ) : null}

          {showTerbit ? (
            <button
              className={styles.primaryButton}
              disabled={isPending}
              onClick={() => {
                setErrorMsg(null);
                setMode("terbit");
              }}
              type="button"
            >
              Terbitkan Faktur
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
