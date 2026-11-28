"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { alokasiStokAction } from "../actions";
import { formatAngka } from "../format";
import styles from "../pesanan.module.css";
import type { KetersediaanPesananData } from "../types";

type AlokasiStokPanelProps = {
  pesananId: string;
  status: string;
  canAllocate: boolean;
  data: KetersediaanPesananData;
};

export function AlokasiStokPanel({
  pesananId,
  status,
  canAllocate,
  data,
}: AlokasiStokPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const singleGudang = data.gudangList.length === 1;
  const defaultGudangId = singleGudang ? data.gudangList[0].id : "";

  const [selectedGudang, setSelectedGudang] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const b of data.baris) {
        init[b.pesananItemId] = defaultGudangId;
      }
      return init;
    },
  );

  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const b of data.baris) {
      const tersedia = defaultGudangId
        ? (b.tersediaPerGudang[defaultGudangId]?.tersediaQty ?? 0)
        : 0;
      const suggested = Math.max(0, Math.min(b.qtySisaKebutuhan, tersedia));
      init[b.pesananItemId] = suggested > 0 ? String(suggested) : "0";
    }
    return init;
  });

  const canEditAlokasi =
    canAllocate && (status === "VERIFIED" || status === "MENUNGGU_STOK");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = data.baris
      .filter((b) => b.qtySisaKebutuhan > 0)
      .map((b) => ({
        pesananItemId: b.pesananItemId,
        produkId: b.produkId,
        gudangId: selectedGudang[b.pesananItemId] ?? defaultGudangId,
        qtyAlokasi: Number(qtyInputs[b.pesananItemId] ?? 0),
      }))
      .filter((r) => r.qtyAlokasi > 0);

    if (payload.length === 0) {
      setErrorMsg("Masukkan jumlah alokasi lebih dari nol.");
      return;
    }

    startTransition(async () => {
      const res = await alokasiStokAction(pesananId, payload);
      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.data.message);
        router.refresh();
      }
    });
  }

  return (
    <div className={styles.panelCard} style={{ marginTop: "var(--space-6)" }}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Cek & Reservasi Stok (PD-003)</h2>
          <p className={styles.panelSubtitle}>
            Alokasi mengurangi stok tersedia tanpa mengubah saldo fisik hingga
            pengiriman dikonfirmasi.
          </p>
        </div>
      </div>

      {errorMsg ? (
        <div className={`${styles.alertBox} ${styles.alertError}`} role="alert">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className={`${styles.alertBox} ${styles.alertSuccess}`} role="status">
          {successMsg}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produk</th>
                {!singleGudang && canEditAlokasi ? <th>Gudang</th> : null}
                <th className={styles.alignRight}>Diminta</th>
                <th className={styles.alignRight}>Tersedia</th>
                <th className={styles.alignRight}>Teralokasi</th>
                {canEditAlokasi ? (
                  <th className={styles.alignRight} style={{ width: "130px" }}>
                    Alokasi Baru
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {data.baris.map((b) => {
                const activeGudang =
                  selectedGudang[b.pesananItemId] ?? defaultGudangId;
                const tersedia = activeGudang
                  ? (b.tersediaPerGudang[activeGudang]?.tersediaQty ?? 0)
                  : Object.values(b.tersediaPerGudang).reduce(
                      (acc, v) => acc + v.tersediaQty,
                      0,
                    );

                return (
                  <tr key={b.pesananItemId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.produkNama}</div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "var(--font-size-caption)",
                        }}
                      >
                        {b.produkKode} · {b.satuanKode}
                      </div>
                    </td>

                    {!singleGudang && canEditAlokasi ? (
                      <td>
                        <select
                          aria-label={`Gudang untuk ${b.produkNama}`}
                          className={styles.selectControl}
                          disabled={b.qtySisaKebutuhan <= 0}
                          onChange={(e) =>
                            setSelectedGudang((prev) => ({
                              ...prev,
                              [b.pesananItemId]: e.target.value,
                            }))
                          }
                          value={activeGudang}
                        >
                          <option value="">-- Pilih Gudang --</option>
                          {data.gudangList.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.kode} — {g.nama} (Tersedia:{" "}
                              {formatAngka(
                                b.tersediaPerGudang[g.id]?.tersediaQty ?? 0,
                              )}
                              )
                            </option>
                          ))}
                        </select>
                      </td>
                    ) : null}

                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatAngka(b.qtyDiminta)}
                    </td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatAngka(tersedia)}
                    </td>
                    <td className={`${styles.alignRight} ${styles.numeric}`}>
                      {formatAngka(b.qtyTeralokasi)}
                    </td>

                    {canEditAlokasi ? (
                      <td className={styles.alignRight}>
                        {b.qtySisaKebutuhan > 0 ? (
                          <input
                            aria-label={`Qty alokasi ${b.produkNama}`}
                            className={styles.inputControl}
                            min="0"
                            onChange={(e) =>
                              setQtyInputs((prev) => ({
                                ...prev,
                                [b.pesananItemId]: e.target.value,
                              }))
                            }
                            step="any"
                            style={{ width: "110px", textAlign: "right" }}
                            type="number"
                            value={qtyInputs[b.pesananItemId] ?? "0"}
                          />
                        ) : (
                          <span
                            style={{
                              color: "var(--color-success-text)",
                              fontSize: "var(--font-size-caption)",
                              fontWeight: 600,
                            }}
                          >
                            Terpenuhi
                          </span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {canEditAlokasi ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "var(--space-4)",
            }}
          >
            <button
              className={styles.primaryButton}
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Menyimpan Alokasi..." : "Simpan Alokasi Stok"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
