"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createPesananAction, updatePesananAction } from "../actions";
import { hitungBarisPesanan, hitungTotalPesanan } from "../calc";
import { PATH_PESANAN } from "../constants";
import { formatRupiah } from "../format";
import styles from "../pesanan.module.css";
import type { PelangganRef, PesananDetail, ProdukRef } from "../types";

type LineDraft = {
  key: string;
  produkId: string;
  qty: string;
  hargaSatuan: string;
  diskonPersen: string;
};

type PesananFormProps = {
  pelangganList: PelangganRef[];
  produkList: ProdukRef[];
  tarifPpn: number;
  initialPesanan?: PesananDetail | null;
};

export function PesananForm({
  pelangganList,
  produkList,
  tarifPpn,
  initialPesanan,
}: PesananFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEdit = Boolean(initialPesanan);
  const today = new Date().toISOString().split("T")[0];

  const [pelangganId, setPelangganId] = useState(
    initialPesanan?.pelangganId ?? "",
  );
  const [tanggal, setTanggal] = useState(
    initialPesanan?.tanggal ?? today,
  );
  const [terminHari, setTerminHari] = useState(
    String(initialPesanan?.terminHari ?? 30),
  );

  const [lines, setLines] = useState<LineDraft[]>(() => {
    if (initialPesanan && initialPesanan.items.length > 0) {
      return initialPesanan.items.map((it, idx) => ({
        key: `${it.id}-${idx}`,
        produkId: it.produkId,
        qty: String(it.qty),
        hargaSatuan: String(it.hargaSatuan),
        diskonPersen: String(it.diskonPersen),
      }));
    }
    return [
      {
        key: "line-1",
        produkId: "",
        qty: "1",
        hargaSatuan: "0",
        diskonPersen: "0",
      },
    ];
  });

  function handlePelangganChange(nextPelId: string) {
    setPelangganId(nextPelId);
    const found = pelangganList.find((p) => p.id === nextPelId);
    if (found) {
      setTerminHari(String(found.terminHari));
    }
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        key: `line-${Date.now()}-${prev.length}`,
        produkId: "",
        qty: "1",
        hargaSatuan: "0",
        diskonPersen: "0",
      },
    ]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  const parsedLines = lines
    .filter((l) => l.produkId !== "")
    .map((l) => ({
      produkId: l.produkId,
      qty: Number(l.qty || 0),
      hargaSatuan: Number(l.hargaSatuan || 0),
      diskonPersen: Number(l.diskonPersen || 0),
    }));

  const totals = hitungTotalPesanan(parsedLines, tarifPpn);

  const hasPelanggan = Boolean(pelangganId);
  const hasLines = parsedLines.length > 0;
  const allQtyPositive =
    parsedLines.length > 0 && parsedLines.every((l) => l.qty > 0);
  const validTermin = /^\d+$/.test(terminHari.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!pelangganId) {
      setErrorMsg("Pelanggan wajib dipilih.");
      return;
    }

    if (!validTermin) {
      setErrorMsg("Termin pembayaran harus berupa jumlah hari, minimal 0.");
      return;
    }

    const itemsPayload = lines.map((l) => ({
      produkId: l.produkId,
      qty: Number(l.qty),
      hargaSatuan: Number(l.hargaSatuan),
      diskonPersen: Number(l.diskonPersen || 0),
    }));

    startTransition(async () => {
      if (isEdit && initialPesanan) {
        const res = await updatePesananAction(initialPesanan.id, {
          pelangganId,
          tanggal,
          terminHari: Number(terminHari),
          items: itemsPayload,
        });
        if (!res.ok) {
          setErrorMsg(res.message);
        } else {
          router.push(`${PATH_PESANAN}/${initialPesanan.id}`);
          router.refresh();
        }
      } else {
        const res = await createPesananAction({
          pelangganId,
          tanggal,
          terminHari: Number(terminHari),
          items: itemsPayload,
        });
        if (!res.ok) {
          setErrorMsg(res.message);
        } else {
          router.push(`${PATH_PESANAN}/${res.data.id}`);
          router.refresh();
        }
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
        {/* Left: Form + Line Items (7 cols) */}
        <div className={styles.span7}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Informasi Pesanan</h2>
                <p className={styles.panelSubtitle}>
                  Pilih pelanggan aktif dan tentukan termin serta barang pesanan.
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
                  onChange={(e) => handlePelangganChange(e.target.value)}
                  required
                  value={pelangganId}
                >
                  <option value="">-- Pilih Pelanggan Aktif --</option>
                  {pelangganList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kodePelanggan} — {p.nama} (Termin: {p.terminHari} hari)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="tanggal">
                  Tanggal Pesanan *
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
                <label className={styles.fieldLabel} htmlFor="terminHari">
                  Termin Pembayaran (Hari) *
                </label>
                <input
                  className={styles.inputControl}
                  id="terminHari"
                  min={0}
                  onChange={(e) => setTerminHari(e.target.value)}
                  required
                  type="number"
                  value={terminHari}
                />
                <p className={styles.fieldHint}>
                  Otomatis dari master pelanggan; dapat disesuaikan per pesanan.
                </p>
              </div>
            </div>

            <div className={styles.panelHeader} style={{ marginTop: "var(--space-6)" }}>
              <div>
                <h3 className={styles.panelTitle}>Rincian Barang</h3>
              </div>
              <button
                className={styles.secondaryButton}
                onClick={addLine}
                type="button"
              >
                + Tambah Baris
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th style={{ width: "90px" }}>Qty</th>
                    <th style={{ width: "140px" }}>Harga (Rp)</th>
                    <th style={{ width: "90px" }}>Diskon %</th>
                    <th className={styles.alignRight}>Total Baris</th>
                    <th style={{ width: "60px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <p className={styles.emptyState}>
                          Belum ada baris produk. Klik &quot;+ Tambah Baris&quot;.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, index) => {
                      const calc = hitungBarisPesanan(
                        Number(line.qty || 0),
                        Number(line.hargaSatuan || 0),
                        Number(line.diskonPersen || 0),
                        tarifPpn,
                      );
                      return (
                        <tr key={line.key}>
                          <td>
                            <select
                              aria-label={`Produk baris ${index + 1}`}
                              className={styles.selectControl}
                              onChange={(e) =>
                                updateLine(index, { produkId: e.target.value })
                              }
                              required
                              style={{ width: "100%" }}
                              value={line.produkId}
                            >
                              <option value="">-- Pilih Produk --</option>
                              {produkList.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.kode} — {prod.nama} ({prod.satuanKode})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              aria-label={`Qty baris ${index + 1}`}
                              className={styles.inputControl}
                              min="0.01"
                              onChange={(e) =>
                                updateLine(index, { qty: e.target.value })
                              }
                              required
                              step="any"
                              style={{ width: "100%" }}
                              type="number"
                              value={line.qty}
                            />
                          </td>
                          <td>
                            <input
                              aria-label={`Harga baris ${index + 1}`}
                              className={styles.inputControl}
                              min="0"
                              onChange={(e) =>
                                updateLine(index, {
                                  hargaSatuan: e.target.value,
                                })
                              }
                              required
                              step="any"
                              style={{ width: "100%" }}
                              type="number"
                              value={line.hargaSatuan}
                            />
                          </td>
                          <td>
                            <input
                              aria-label={`Diskon baris ${index + 1}`}
                              className={styles.inputControl}
                              max="100"
                              min="0"
                              onChange={(e) =>
                                updateLine(index, {
                                  diskonPersen: e.target.value,
                                })
                              }
                              step="any"
                              style={{ width: "100%" }}
                              type="number"
                              value={line.diskonPersen}
                            />
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatRupiah(calc.total)}
                          </td>
                          <td>
                            <button
                              aria-label={`Hapus baris ${index + 1}`}
                              className={styles.dangerButton}
                              onClick={() => removeLine(index)}
                              style={{ padding: "0 var(--space-2)" }}
                              type="button"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Read-only Summary & Validation Checks (5 cols) */}
        <div className={styles.span5}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Ringkasan Nilai</h2>
                <p className={styles.panelSubtitle}>
                  Perhitungan otomatis (Tarif PPN {(tarifPpn * 100).toFixed(0)}%)
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-5)" }}>
              <p className={styles.statLabel}>Estimasi Total Pesanan</p>
              <p className={styles.statKpi}>{formatRupiah(totals.total)}</p>
            </div>

            <dl className={styles.totalsList}>
              <div className={styles.totalRow}>
                <dt>Subtotal (Nilai Kotor)</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.nilaiKotor)}</dd>
              </div>
              <div className={styles.totalRow}>
                <dt>Total Diskon</dt>
                <dd className={styles.numeric}>- {formatRupiah(totals.diskonTotal)}</dd>
              </div>
              <div className={styles.totalRow}>
                <dt>Dasar Pengenaan Pajak (DPP)</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.dpp)}</dd>
              </div>
              <div className={styles.totalRow}>
                <dt>PPN ({(tarifPpn * 100).toFixed(0)}%)</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.ppn)}</dd>
              </div>
              <div className={styles.totalRowStrong}>
                <dt>Total</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.total)}</dd>
              </div>
            </dl>

            <ul className={styles.checklist}>
              <li className={hasPelanggan ? styles.checkItemOk : styles.checkItemWarn}>
                {hasPelanggan ? "✓ Pelanggan aktif dipilih" : "! Pilih pelanggan aktif"}
              </li>
              <li className={hasLines ? styles.checkItemOk : styles.checkItemWarn}>
                {hasLines
                  ? `✓ ${parsedLines.length} baris barang terisi`
                  : "! Minimal satu baris barang untuk verifikasi"}
              </li>
              <li className={allQtyPositive ? styles.checkItemOk : styles.checkItemWarn}>
                {allQtyPositive
                  ? "✓ Kuantitas seluruh baris valid (> 0)"
                  : "! Kuantitas harus lebih dari nol"}
              </li>
              <li className={validTermin ? styles.checkItemOk : styles.checkItemWarn}>
                {validTermin ? "✓ Termin pembayaran valid" : "! Termin tidak valid"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <Link
          className={styles.secondaryButton}
          href={initialPesanan ? `${PATH_PESANAN}/${initialPesanan.id}` : PATH_PESANAN}
        >
          ← {initialPesanan ? "Kembali ke Detail" : "Daftar Pesanan"}
        </Link>

        <div className={styles.actionBarGroup}>
          <Link
            className={styles.secondaryButton}
            href={initialPesanan ? `${PATH_PESANAN}/${initialPesanan.id}` : PATH_PESANAN}
          >
            Batal
          </Link>
          <button
            className={styles.primaryButton}
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? "Menyimpan..."
              : isEdit
                ? "Simpan Perubahan"
                : "Simpan Draf Pesanan"}
          </button>
        </div>
      </div>
    </form>
  );
}
