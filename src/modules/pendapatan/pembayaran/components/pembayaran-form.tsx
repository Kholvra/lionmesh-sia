"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createPembayaranAction } from "../actions";
import { alokasiFifoPembayaran } from "../calc";
import { METODE_PEMBAYARAN, PATH_PEMBAYARAN } from "../constants";
import { formatRupiah, formatTanggal } from "../format";
import styles from "../pembayaran.module.css";
import type { PelangganTagihanRef } from "../types";

type PembayaranFormProps = {
  pelangganList: PelangganTagihanRef[];
};

export function PembayaranForm({ pelangganList }: PembayaranFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [pelangganId, setPelangganId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [nominalStr, setNominalStr] = useState("");
  const [metode, setMetode] = useState<string>("Transfer");
  const [nomorReferensi, setNomorReferensi] = useState("");

  const selectedPel =
    pelangganList.find((p) => p.id === pelangganId) ?? null;

  const nominalNum = Number(nominalStr.replace(",", ".") || 0);
  const previewFifo =
    selectedPel && nominalNum > 0
      ? alokasiFifoPembayaran(nominalNum, selectedPel.fakturTerbuka)
      : { allocations: [], totalAllocated: 0 };

  const allocMap = new Map(
    previewFifo.allocations.map((a) => [a.fakturId, a.nominal]),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!pelangganId) {
      setErrorMsg("Pelanggan wajib dipilih.");
      return;
    }

    startTransition(async () => {
      const res = await createPembayaranAction({
        pelangganId,
        tanggal,
        nominalStr,
        metode: metode as "Transfer" | "Giro",
        nomorReferensi: nomorReferensi || null,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        router.push(`${PATH_PEMBAYARAN}/${encodeURIComponent(res.data.nomor)}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg ? (
        <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
          {errorMsg}
        </div>
      ) : null}

      <div className={styles.grid12}>
        {/* Left: Form + Open Invoices Preview (7 cols) */}
        <div className={styles.span7}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Data Penerimaan Pembayaran</h2>
                <p className={styles.panelSubtitle}>
                  Hanya mendukung metode Transfer atau Giro (tanpa kelebihan bayar).
                </p>
              </div>
            </div>

            <div className={styles.fieldGrid2}>
              <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
                <label className={styles.fieldLabel} htmlFor="pelangganId">
                  Pelanggan *
                </label>
                <select
                  className={styles.selectControl}
                  id="pelangganId"
                  onChange={(e) => setPelangganId(e.target.value)}
                  required
                  value={pelangganId}
                >
                  <option value="">-- Pilih Pelanggan dengan Tagihan Terbuka --</option>
                  {pelangganList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kodePelanggan} — {p.nama} (Tagihan:{" "}
                      {formatRupiah(p.totalTagihanTerbuka)})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="tanggal">
                  Tanggal Penerimaan *
                </label>
                <input
                  className={styles.inputControl}
                  id="tanggal"
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  type="date"
                  value={tanggal}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="metode">
                  Metode Pembayaran *
                </label>
                <select
                  className={styles.selectControl}
                  id="metode"
                  onChange={(e) => setMetode(e.target.value)}
                  required
                  value={metode}
                >
                  {METODE_PEMBAYARAN.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="nominalStr">
                  Nominal Pembayaran (Rp) *
                </label>
                <input
                  className={styles.inputControl}
                  id="nominalStr"
                  onChange={(e) => setNominalStr(e.target.value)}
                  placeholder="0.00"
                  required
                  type="text"
                  value={nominalStr}
                />
                <p className={styles.fieldHint}>Maksimal 2 angka desimal.</p>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="nomorReferensi">
                  Nomor Referensi / Giro
                </label>
                <input
                  className={styles.inputControl}
                  id="nomorReferensi"
                  onChange={(e) => setNomorReferensi(e.target.value)}
                  placeholder="No. referensi transfer / bilyet giro"
                  type="text"
                  value={nomorReferensi}
                />
              </div>
            </div>

            <div className={styles.panelHeader} style={{ marginTop: "var(--space-4)" }}>
              <div>
                <h3 className={styles.panelTitle}>
                  Simulasi Alokasi FIFO (Tertua Dulu)
                </h3>
              </div>
            </div>

            {!selectedPel ? (
              <p className={styles.emptyState}>
                Pilih pelanggan untuk melihat daftar faktur terbuka dan simulasi
                alokasi otomatis.
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No. Faktur</th>
                      <th>Tanggal</th>
                      <th className={styles.alignRight}>Sisa Tagihan</th>
                      <th className={styles.alignRight}>Estimasi Alokasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPel.fakturTerbuka.map((f) => {
                      const est = allocMap.get(f.id) ?? 0;
                      return (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 500 }}>{f.nomor}</td>
                          <td>{formatTanggal(f.tanggalFaktur)}</td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatRupiah(f.sisaPiutang)}
                          </td>
                          <td
                            className={`${styles.alignRight} ${styles.numeric}`}
                            style={{
                              fontWeight: est > 0 ? 700 : 400,
                              color:
                                est > 0
                                  ? "var(--color-success-text)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {formatRupiah(est)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Read-only Summary (5 cols) */}
        <div className={styles.span5}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Ringkasan Penerimaan</h2>
                <p className={styles.panelSubtitle}>
                  Status awal DICATAT (belum mengubah piutang/jurnal sebelum
                  diverifikasi Accounting).
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-5)" }}>
              <p className={styles.statLabel}>Nominal Dicatat</p>
              <p className={styles.statKpi}>
                {formatRupiah(Number.isNaN(nominalNum) ? 0 : nominalNum)}
              </p>
            </div>

            <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-secondary)" }}>Total Tagihan Terbuka</dt>
                <dd className={styles.numeric} style={{ margin: 0, fontWeight: 600 }}>
                  {formatRupiah(selectedPel?.totalTagihanTerbuka ?? 0)}
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-secondary)" }}>Estimasi Teralokasi</dt>
                <dd className={styles.numeric} style={{ margin: 0, fontWeight: 600 }}>
                  {formatRupiah(previewFifo.totalAllocated)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <Link className={styles.secondaryButton} href={PATH_PEMBAYARAN}>
          ← Daftar Pembayaran
        </Link>

        <div className={styles.actionBarGroup}>
          <Link className={styles.secondaryButton} href={PATH_PEMBAYARAN}>
            Batal
          </Link>
          <button
            className={styles.primaryButton}
            disabled={isPending || !selectedPel}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Catat Pembayaran"}
          </button>
        </div>
      </div>
    </form>
  );
}
