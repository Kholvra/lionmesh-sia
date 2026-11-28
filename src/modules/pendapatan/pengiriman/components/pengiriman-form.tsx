"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createPengirimanAction } from "../actions";
import { PATH_PENGIRIMAN } from "../constants";
import { formatAngka } from "../format";
import styles from "../pengiriman.module.css";
import type { PesananSiapKirimRef } from "../types";

type PengirimanFormProps = {
  pesananList: PesananSiapKirimRef[];
};

export function PengirimanForm({ pesananList }: PengirimanFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [pesananId, setPesananId] = useState("");
  const [tanggalPengiriman, setTanggalPengiriman] = useState(today);
  const [keterangan, setKeterangan] = useState("");
  const [qtyMap, setQtyMap] = useState<Record<string, string>>({});

  const selectedPesanan = pesananList.find((p) => p.id === pesananId) ?? null;

  function handleSelectPesanan(nextId: string) {
    setPesananId(nextId);
    const found = pesananList.find((p) => p.id === nextId);
    if (found) {
      const init: Record<string, string> = {};
      for (const it of found.items) {
        const key = `${it.pesananItemId}:${it.gudangId}`;
        const sisaPesanan = Math.max(0, it.qtyPesanan - it.qtyTerkirimSebelumnya);
        const maxKirim = Math.min(it.qtyAlokasiAktif, sisaPesanan);
        init[key] = maxKirim > 0 ? String(maxKirim) : "0";
      }
      setQtyMap(init);
    } else {
      setQtyMap({});
    }
  }

  const activeItems = selectedPesanan
    ? selectedPesanan.items
        .map((it) => {
          const key = `${it.pesananItemId}:${it.gudangId}`;
          const qty = Number(qtyMap[key] ?? 0);
          return { ...it, key, qty };
        })
        .filter((it) => it.qty > 0)
    : [];

  const totalQty = activeItems.reduce((acc, it) => acc + it.qty, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!pesananId || !selectedPesanan) {
      setErrorMsg("Pilih pesanan yang siap dikirim.");
      return;
    }

    if (activeItems.length === 0) {
      setErrorMsg("Minimal satu barang harus memiliki jumlah kirim > 0.");
      return;
    }

    startTransition(async () => {
      const res = await createPengirimanAction({
        pesananId,
        tanggalPengiriman,
        keterangan: keterangan || null,
        items: activeItems.map((it) => ({
          pesananItemId: it.pesananItemId,
          produkId: it.produkId,
          gudangId: it.gudangId,
          qty: it.qty,
        })),
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        router.push(`${PATH_PENGIRIMAN}/${encodeURIComponent(res.data.nomor)}`);
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
        {/* Left: Form + Line Items (7 cols) */}
        <div className={styles.span7}>
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Data Pengiriman & Surat Jalan</h2>
                <p className={styles.panelSubtitle}>
                  Pilih pesanan berstatus Siap Kirim atau Terkirim Sebagian.
                </p>
              </div>
            </div>

            <div className={styles.fieldGrid2}>
              <div className={styles.fieldGroup} style={{ gridColumn: "span 2" }}>
                <label className={styles.fieldLabel} htmlFor="pesananId">
                  Pesanan Penjualan (SO) *
                </label>
                <select
                  className={styles.selectControl}
                  id="pesananId"
                  onChange={(e) => handleSelectPesanan(e.target.value)}
                  required
                  value={pesananId}
                >
                  <option value="">-- Pilih Pesanan Terverifikasi & Teralokasi --</option>
                  {pesananList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nomor} — {p.pelangganNama} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="tanggalPengiriman">
                  Tanggal Pengiriman *
                </label>
                <input
                  className={styles.inputControl}
                  id="tanggalPengiriman"
                  onChange={(e) => setTanggalPengiriman(e.target.value)}
                  required
                  type="date"
                  value={tanggalPengiriman}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="keterangan">
                  Catatan / Kendaraan / Sopir
                </label>
                <input
                  className={styles.inputControl}
                  id="keterangan"
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Truk B 1234 ABC - Budi"
                  type="text"
                  value={keterangan}
                />
              </div>
            </div>

            <div className={styles.panelHeader} style={{ marginTop: "var(--space-4)" }}>
              <div>
                <h3 className={styles.panelTitle}>Rincian Barang Dikirim</h3>
              </div>
            </div>

            {!selectedPesanan ? (
              <p className={styles.emptyState}>
                Pilih pesanan di atas untuk memuat barang yang telah dialokasikan.
              </p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produk & Gudang</th>
                      <th className={styles.alignRight}>Sisa Pesanan</th>
                      <th className={styles.alignRight}>Alokasi Aktif</th>
                      <th className={styles.alignRight} style={{ width: "130px" }}>
                        Qty Kirim
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPesanan.items.map((it) => {
                      const key = `${it.pesananItemId}:${it.gudangId}`;
                      const sisaPesanan = Math.max(
                        0,
                        it.qtyPesanan - it.qtyTerkirimSebelumnya,
                      );
                      return (
                        <tr key={key}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{it.produkNama}</div>
                            <div
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "var(--font-size-caption)",
                              }}
                            >
                              {it.produkKode} · Gudang: {it.gudangNama} ({it.satuanKode})
                            </div>
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatAngka(sisaPesanan)}
                          </td>
                          <td className={`${styles.alignRight} ${styles.numeric}`}>
                            {formatAngka(it.qtyAlokasiAktif)}
                          </td>
                          <td className={styles.alignRight}>
                            <input
                              aria-label={`Qty kirim ${it.produkNama}`}
                              className={styles.inputControl}
                              min="0"
                              onChange={(e) =>
                                setQtyMap((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              step="any"
                              style={{ width: "110px", textAlign: "right" }}
                              type="number"
                              value={qtyMap[key] ?? "0"}
                            />
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
                <h2 className={styles.panelTitle}>Ringkasan Pengiriman</h2>
                <p className={styles.panelSubtitle}>
                  Draf tidak mengubah saldo stok sampai dikonfirmasi Kirim.
                </p>
              </div>
            </div>

            <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-secondary)" }}>Pelanggan</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {selectedPesanan ? selectedPesanan.pelangganNama : "-"}
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-secondary)" }}>Jumlah Baris</dt>
                <dd className={styles.numeric} style={{ margin: 0, fontWeight: 600 }}>
                  {activeItems.length} baris
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-secondary)" }}>Total Kuantitas</dt>
                <dd className={styles.numeric} style={{ margin: 0, fontWeight: 700 }}>
                  {formatAngka(totalQty)} unit
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <Link className={styles.secondaryButton} href={PATH_PENGIRIMAN}>
          ← Daftar Pengiriman
        </Link>

        <div className={styles.actionBarGroup}>
          <Link className={styles.secondaryButton} href={PATH_PENGIRIMAN}>
            Batal
          </Link>
          <button
            className={styles.primaryButton}
            disabled={isPending || !selectedPesanan}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Draf Pengiriman"}
          </button>
        </div>
      </div>
    </form>
  );
}
