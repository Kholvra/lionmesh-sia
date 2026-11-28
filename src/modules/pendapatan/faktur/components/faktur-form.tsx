"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createFakturAction } from "../actions";
import {
  hitungBarisFaktur,
  hitungJatuhTempo,
  hitungTotalFaktur,
} from "../calc";
import { PATH_FAKTUR } from "../constants";
import { formatAngka, formatRupiah, formatTanggal } from "../format";
import styles from "../faktur.module.css";
import type { PengirimanSiapFakturRef } from "../types";

type FakturFormProps = {
  pengirimanList: PengirimanSiapFakturRef[];
  tarifPpnDefault: number;
};

export function FakturForm({
  pengirimanList,
  tarifPpnDefault,
}: FakturFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [pengirimanId, setPengirimanId] = useState("");
  const [tanggalFaktur, setTanggalFaktur] = useState(today);
  const [terminHari, setTerminHari] = useState("30");
  const [nomorFakturPajak, setNomorFakturPajak] = useState("");

  const selectedSj =
    pengirimanList.find((sj) => sj.id === pengirimanId) ?? null;

  function handleSelectSj(nextId: string) {
    setPengirimanId(nextId);
    const found = pengirimanList.find((sj) => sj.id === nextId);
    if (found) {
      setTerminHari(String(found.terminHari));
    }
  }

  const parsedTermin = Number(terminHari || 0);
  const jatuhTempo =
    tanggalFaktur && !Number.isNaN(parsedTermin)
      ? hitungJatuhTempo(tanggalFaktur, parsedTermin)
      : "-";

  const totals = selectedSj
    ? hitungTotalFaktur(selectedSj.items, tarifPpnDefault)
    : { dpp: 0, ppn: 0, total: 0 };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!pengirimanId) {
      setErrorMsg("Pengiriman (Surat Jalan) wajib dipilih.");
      return;
    }

    startTransition(async () => {
      const res = await createFakturAction({
        pengirimanId,
        tanggalFaktur,
        terminHari: Number(terminHari),
        nomorFakturPajak: nomorFakturPajak || null,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        router.push(`${PATH_FAKTUR}/${encodeURIComponent(res.data.nomor)}`);
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
        {/* Left: Form & Line Items (7 cols) */}
        <div className={styles.span7}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Informasi Faktur Penjualan</h2>
                <p className={styles.panelSubtitle}>
                  Pilih pengiriman berstatus Dikirim / Diterima yang belum difakturkan.
                </p>
              </div>
            </div>

            <div className={styles.fieldGrid2}>
              <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
                <label className={styles.fieldLabel} htmlFor="pengirimanId">
                  Surat Jalan / Pengiriman *
                </label>
                <select
                  className={styles.selectControl}
                  id="pengirimanId"
                  onChange={(e) => handleSelectSj(e.target.value)}
                  required
                  value={pengirimanId}
                >
                  <option value="">-- Pilih Pengiriman Siap Faktur --</option>
                  {pengirimanList.map((sj) => (
                    <option key={sj.id} value={sj.id}>
                      {sj.nomor} — {sj.pelangganNama} (SO: {sj.pesananNomor})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="tanggalFaktur">
                  Tanggal Faktur *
                </label>
                <input
                  className={styles.inputControl}
                  id="tanggalFaktur"
                  onChange={(e) => setTanggalFaktur(e.target.value)}
                  required
                  type="date"
                  value={tanggalFaktur}
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
              </div>

              <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
                <label className={styles.fieldLabel} htmlFor="nomorFakturPajak">
                  Nomor Faktur Pajak (Opsional saat Draf, Wajib saat Terbit)
                </label>
                <input
                  className={styles.inputControl}
                  id="nomorFakturPajak"
                  onChange={(e) => setNomorFakturPajak(e.target.value)}
                  placeholder="Input manual nomor seri faktur pajak"
                  type="text"
                  value={nomorFakturPajak}
                />
              </div>
            </div>

            <div className={styles.panelHeader} style={{ marginTop: "var(--space-4)" }}>
              <div>
                <h3 className={styles.panelTitle}>Rincian Barang (Sesuai Qty Kirim)</h3>
              </div>
            </div>

            {!selectedSj ? (
              <p className={styles.emptyState}>
                Pilih surat jalan di atas untuk memuat barang yang dikirim.
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th className={styles.alignRight}>Qty Kirim</th>
                      <th className={styles.alignRight}>Harga</th>
                      <th className={styles.alignRight}>Diskon</th>
                      <th className={styles.alignRight}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSj.items.map((it) => {
                      const calc = hitungBarisFaktur(
                        it.qty,
                        it.hargaSatuan,
                        it.diskonPersen,
                        tarifPpnDefault,
                      );
                      return (
                        <tr key={it.pengirimanItemId}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{it.produkNama}</div>
                            <div
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "var(--font-size-caption)",
                              }}
                            >
                              {it.produkKode} · {it.satuanKode}
                            </div>
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatAngka(it.qty)}
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatRupiah(it.hargaSatuan)}
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatAngka(it.diskonPersen)}%
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatRupiah(calc.total)}
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
                <h2 className={styles.panelTitle}>Ringkasan Tagihan</h2>
                <p className={styles.panelSubtitle}>
                  Jatuh tempo: {jatuhTempo !== "-" ? formatTanggal(jatuhTempo) : "-"}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-5)" }}>
              <p className={styles.statLabel}>Total Faktur</p>
              <p className={styles.statKpi}>{formatRupiah(totals.total)}</p>
            </div>

            <dl className={styles.totalsList}>
              <div className={styles.totalRow}>
                <dt>Pelanggan</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {selectedSj ? selectedSj.pelangganNama : "-"}
                </dd>
              </div>
              <div className={styles.totalRow}>
                <dt>DPP</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.dpp)}</dd>
              </div>
              <div className={styles.totalRow}>
                <dt>PPN ({(tarifPpnDefault * 100).toFixed(0)}%)</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.ppn)}</dd>
              </div>
              <div className={styles.totalRowStrong}>
                <dt>Total Piutang</dt>
                <dd className={styles.numeric}>{formatRupiah(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <Link className={styles.secondaryButton} href={PATH_FAKTUR}>
          ← Daftar Faktur
        </Link>

        <div className={styles.actionBarGroup}>
          <Link className={styles.secondaryButton} href={PATH_FAKTUR}>
            Batal
          </Link>
          <button
            className={styles.primaryButton}
            disabled={isPending || !selectedSj}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Draf Faktur"}
          </button>
        </div>
      </div>
    </form>
  );
}
