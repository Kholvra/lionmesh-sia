"use client";

import { useActionState, useState } from "react";

import { catatQcAction } from "../actions";
import { INITIAL_QC_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type Baris = {
  id: string;
  label: string;
  qtyDiterima: string;
};

type Props = {
  penerimaanId: string;
  versi: number;
  baris: readonly Baris[];
};

function keAngka(nilai: string): number {
  const angka = Number(nilai.trim().replace(",", "."));
  return Number.isFinite(angka) ? angka : 0;
}

export function QcForm({ baris, penerimaanId, versi }: Props) {
  const [state, action, pending] = useActionState(
    catatQcAction,
    INITIAL_QC_ACTION_STATE,
  );
  const [qty, setQty] = useState<string[]>(() => baris.map((item) => item.qtyDiterima));

  return (
    <form action={action} className={common.form} noValidate>
      <input name="penerimaan_id" type="hidden" value={penerimaanId} />
      <input name="versi" type="hidden" value={versi} />

      {state.status === "error" && state.message ? (
        <p className={common.messageError} role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className={common.messageSuccess} role="status">
          {state.message}
        </p>
      ) : null}

      <p className={common.panelMeta}>
        Qty lulus + qty gagal harus sama dengan qty diterima. Hasil QC bersifat final.
      </p>

      <div className={table.tableWrap}>
        <table className={table.table}>
          <caption className={table.caption}>
            Isi qty yang lulus QC per baris. Sisanya dihitung sebagai barang gagal.
          </caption>
          <thead>
            <tr>
              <th scope="col">Barang</th>
              <th scope="col">Qty diterima</th>
              <th scope="col">Qty lulus</th>
              <th scope="col">Qty gagal</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((item, index) => {
              const gagal = keAngka(item.qtyDiterima) - keAngka(qty[index] ?? "");
              return (
                <tr key={item.id}>
                  <th scope="row">{item.label}</th>
                  <td className={table.nominal}>{item.qtyDiterima}</td>
                  <td>
                    <input name="penerimaan_item_id" type="hidden" value={item.id} />
                    <input
                      aria-label={`Qty lulus ${item.label}`}
                      className={table.qtyInput}
                      defaultValue={item.qtyDiterima}
                      inputMode="decimal"
                      name="qty_lulus"
                      onChange={(event) => {
                        const next = [...qty];
                        next[index] = event.target.value;
                        setQty(next);
                      }}
                    />
                  </td>
                  <td className={table.nominal}>
                    {gagal > 0 ? gagal.toString() : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={common.formActions}>
        <button className={common.primaryButton} disabled={pending} type="submit">
          {pending ? "Menyimpan..." : "Catat hasil QC"}
        </button>
      </div>
    </form>
  );
}
