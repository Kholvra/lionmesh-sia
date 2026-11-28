"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createReturAction } from "../actions";
import { hitungKreditMemoBaris, round2 } from "../calc";
import { PATH_RETUR } from "../constants";
import { formatAngka, formatRupiah, formatTanggal } from "../format";
import styles from "../retur.module.css";
import type { FakturReturRef } from "../types";

type ReturFormProps = {
  fakturList: FakturReturRef[];
};

export function ReturForm({ fakturList }: ReturFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [fakturId, setFakturId] = useState("");
  const [tanggal, setTanggal] = useState(today);
  const [alasan, setAlasan] = useState("");
  const [qtyMap, setQtyMap] = useState<Record<string, string>>({});

  const selectedFaktur = fakturList.find((f) => f.id === fakturId) ?? null;

  function handleFakturChange(nextId: string) {
    setFakturId(nextId);
    setQtyMap({});
    setErrorMsg(null);
  }

  let estDpp = 0;
  let estPpn = 0;
  let estTotal = 0;
  if (selectedFaktur) {
    for (const item of selectedFaktur.items) {
      const q = Number(qtyMap[item.id] ?? 0);
      if (q > 0) {
        const km = hitungKreditMemoBaris({
          qtyLulus: q,
          hargaSatuan: item.hargaSatuan,
          diskonPersen: item.diskonPersen,
          tarifPpn: selectedFaktur.tarifPpn,
        });
        estDpp = round2(estDpp + km.dpp);
        estPpn = round2(estPpn + km.ppn);
        estTotal = round2(estTotal + km.total);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFaktur) {
      setErrorMsg("Retur harus merujuk faktur penjualan.");
      return;
    }

    const itemsPayload = selectedFaktur.items
      .map((item) => ({
        fakturItemId: item.id,
        qtyRetur: Number(qtyMap[item.id] ?? 0),
      }))
      .filter((i) => !Number.isNaN(i.qtyRetur) && i.qtyRetur > 0);

    if (itemsPayload.length === 0) {
      setErrorMsg("Minimal satu barang harus memiliki jumlah retur lebih dari nol.");
      return;
    }

    startTransition(async () => {
      const res = await createReturAction({
        fakturId: selectedFaktur.id,
        tanggal,
        alasan,
        items: itemsPayload,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        router.push(`${PATH_RETUR}/${encodeURIComponent(res.data.nomor)}`);
        router.refresh();
      }
    });
  }

  return (
    <form className={styles.grid12} onSubmit={handleSubmit}>
      <div className={styles.span7}>
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Data Pengajuan Retur</h2>
              <p className={styles.panelSubtitle}>
                Pilih faktur asal dan tentukan jumlah barang yang dikembalikan.
              </p>
            </div>
          </div>

          {errorMsg ? (
            <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
              {errorMsg}
            </div>
          ) : null}

          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.fieldLabel} htmlFor="faktur-id">
                Faktur Penjualan Asal *
              </label>
              <select
                className={styles.select}
                id="faktur-id"
                onChange={(e) => handleFakturChange(e.target.value)}
                required
                value={fakturId}
              >
                <option value="">-- Pilih Faktur Penjualan --</option>
                {fakturList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nomor} — {f.pelangganNama} (Sisa:{" "}
                    {formatRupiah(f.sisaPiutang)})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="tanggal-retur">
                Tanggal Retur *
              </label>
              <input
                className={styles.input}
                id="tanggal-retur"
                onChange={(e) => setTanggal(e.target.value)}
                required
                type="date"
                value={tanggal}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.fieldLabel} htmlFor="alasan-retur">
                Alasan Retur *
              </label>
              <textarea
                className={styles.textarea}
                id="alasan-retur"
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Contoh: Barang mengalami kerusakan las saat pengiriman"
                required
                value={alasan}
              />
            </div>
          </div>

          {selectedFaktur ? (
            <div style={{ marginTop: "var(--space-6)" }}>
              <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-3)" }}>
                Baris Barang Faktur ({selectedFaktur.nomor})
              </h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produk & Gudang</th>
                      <th className={styles.alignRight}>Dikirim</th>
                      <th className={styles.alignRight}>Sisa Boleh Retur</th>
                      <th className={styles.alignRight}>Qty Retur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFaktur.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.produkNama}</div>
                          <div className={styles.fieldHint}>
                            {item.produkKode} · Gudang: {item.gudangNama}
                          </div>
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatAngka(item.qtyDikirim)} {item.satuanKode}
                        </td>
                        <td className={`${styles.alignRight} ${styles.numeric}`}>
                          {formatAngka(item.sisaBolehRetur)} {item.satuanKode}
                        </td>
                        <td className={styles.alignRight}>
                          <input
                            aria-label={`Qty retur ${item.produkNama}`}
                            className={styles.input}
                            max={item.sisaBolehRetur}
                            min={0}
                            onChange={(e) =>
                              setQtyMap((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="0"
                            step="any"
                            style={{ width: "110px", textAlign: "right" }}
                            type="number"
                            value={qtyMap[item.id] ?? ""}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className={styles.actionBar}>
            <button
              className={styles.primaryButton}
              disabled={isPending || !selectedFaktur}
              type="submit"
            >
              {isPending ? "Menyimpan..." : "Ajukan Retur"}
            </button>
            <Link className={styles.secondaryButton} href={PATH_RETUR}>
              Batal
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.span5}>
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Estimasi Kredit Memo</h2>
              <p className={styles.panelSubtitle}>
                Dihitung final saat QC mencatat qty lulus
              </p>
            </div>
          </div>

          {!selectedFaktur ? (
            <p className={styles.emptyState}>
              Pilih faktur asal untuk melihat ringkasan sisa piutang dan
              estimasi nilai kredit memo.
            </p>
          ) : (
            <>
              <dl className={styles.metaList}>
                <div className={styles.metaRow}>
                  <dt>Pelanggan</dt>
                  <dd>{selectedFaktur.pelangganNama}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Tanggal Faktur</dt>
                  <dd>{formatTanggal(selectedFaktur.tanggalFaktur)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Sisa Piutang Faktur</dt>
                  <dd className={styles.numeric}>
                    {formatRupiah(selectedFaktur.sisaPiutang)}
                  </dd>
                </div>
              </dl>

              <div style={{ marginTop: "var(--space-5)" }}>
                <dl className={styles.totalsList}>
                  <div className={styles.totalRow}>
                    <dt>Estimasi DPP Retur</dt>
                    <dd className={styles.numeric}>{formatRupiah(estDpp)}</dd>
                  </div>
                  <div className={styles.totalRow}>
                    <dt>
                      Estimasi PPN ({(selectedFaktur.tarifPpn * 100).toFixed(0)}%)
                    </dt>
                    <dd className={styles.numeric}>{formatRupiah(estPpn)}</dd>
                  </div>
                  <div className={styles.totalRowStrong}>
                    <dt>Estimasi Kredit Memo</dt>
                    <dd className={styles.numeric}>{formatRupiah(estTotal)}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
