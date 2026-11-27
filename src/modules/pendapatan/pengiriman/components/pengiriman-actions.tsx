"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  batalkanPengirimanAction,
  kirimPengirimanAction,
  terimaPengirimanAction,
} from "../actions";
import { PATH_PENGIRIMAN } from "../constants";
import styles from "../pengiriman.module.css";

type PengirimanActionsProps = {
  pengirimanId: string;
  nomor: string;
  status: string;
  canAct: boolean;
};

export function PengirimanActions({
  pengirimanId,
  nomor,
  status,
  canAct,
}: PengirimanActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [kirimDialogOpen, setKirimDialogOpen] = useState(false);
  const [mode, setMode] = useState<"batal" | "terima" | null>(null);
  const [alasanBatal, setAlasanBatal] = useState("");
  const [tanggalTerima, setTanggalTerima] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [namaPenerima, setNamaPenerima] = useState("");

  function handleKirim() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await kirimPengirimanAction(pengirimanId);
      setKirimDialogOpen(false);
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
    startTransition(async () => {
      const res = await batalkanPengirimanAction(pengirimanId, alasanBatal);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
        setAlasanBatal("");
        router.refresh();
      }
    });
  }

  function handleTerima(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await terimaPengirimanAction(
        pengirimanId,
        tanggalTerima,
        namaPenerima,
      );
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setMode(null);
        router.refresh();
      }
    });
  }

  const showKirim = canAct && status === "DRAFT";
  const showBatal = canAct && status === "DRAFT";
  const showTerima = canAct && status === "DIKIRIM";

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

      {mode === "batal" ? (
        <div
          className={styles.panelCard}
          style={{ marginTop: "var(--space-4)", background: "var(--bg-surface-hover)" }}
        >
          <form onSubmit={handleBatal}>
            <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-2)" }}>
              Batalkan Pengiriman {nomor}
            </h3>
            <p className={styles.panelSubtitle} style={{ marginBottom: "var(--space-3)" }}>
              Pengiriman berstatus DRAFT dapat dibatalkan tanpa mengubah saldo stok.
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

      {mode === "terima" ? (
        <div
          className={styles.panelCard}
          style={{ marginTop: "var(--space-4)", background: "var(--bg-surface-hover)" }}
        >
          <form onSubmit={handleTerima}>
            <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-2)" }}>
              Catat Bukti Terima — {nomor}
            </h3>
            <p className={styles.panelSubtitle} style={{ marginBottom: "var(--space-3)" }}>
              Masukkan tanggal diterima dan nama penerima di pihak pelanggan.
            </p>
            <div className={styles.fieldGrid2}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="tanggalTerima">
                  Tanggal Terima *
                </label>
                <input
                  className={styles.inputControl}
                  id="tanggalTerima"
                  onChange={(e) => setTanggalTerima(e.target.value)}
                  required
                  type="date"
                  value={tanggalTerima}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="namaPenerima">
                  Nama Penerima *
                </label>
                <input
                  className={styles.inputControl}
                  id="namaPenerima"
                  onChange={(e) => setNamaPenerima(e.target.value)}
                  placeholder="Nama penerima di lokasi tujuan"
                  required
                  type="text"
                  value={namaPenerima}
                />
              </div>
            </div>
            <div className={styles.actionBarGroup}>
              <button
                className={styles.primaryButton}
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Menyimpan..." : "Simpan Bukti Terima"}
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
        <Link className={styles.secondaryButton} href={PATH_PENGIRIMAN}>
          ← Daftar Pengiriman
        </Link>

        <div className={styles.actionBarGroup}>
          {showBatal ? (
            <button
              className={styles.dangerButton}
              disabled={isPending}
              onClick={() => setMode("batal")}
              type="button"
            >
              Batalkan Pengiriman
            </button>
          ) : null}

          {showKirim ? (
            <button
              className={styles.primaryButton}
              disabled={isPending}
              onClick={() => setKirimDialogOpen(true)}
              type="button"
            >
              Kirim & Terbitkan Surat Jalan
            </button>
          ) : null}

          {showTerima ? (
            <button
              className={styles.primaryButton}
              disabled={isPending}
              onClick={() => setMode("terima")}
              type="button"
            >
              Catat Bukti Terima
            </button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Ya, Kirim Barang"
        description={`Konfirmasi pengiriman ${nomor}? Stok fisik gudang akan dikurangi permanen sebesar qty kirim, alokasi dilepas, dan surat jalan resmi diterbitkan.`}
        onConfirm={handleKirim}
        onOpenChange={setKirimDialogOpen}
        open={kirimDialogOpen}
        pending={isPending}
        title="Konfirmasi Pengiriman Barang?"
      />
    </div>
  );
}
