"use client";

import { useActionState } from "react";

import { FormField } from "@/components/ui";
import { ajukanReturAction } from "../actions";
import { INITIAL_QC_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type Baris = {
  penerimaanItemId: string;
  label: string;
  qtyGagalTersedia: string;
};

type Props = {
  penerimaanId: string;
  baris: readonly Baris[];
};

export function ReturForm({ baris, penerimaanId }: Props) {
  const [state, action, pending] = useActionState(
    ajukanReturAction,
    INITIAL_QC_ACTION_STATE,
  );

  const bisaRetur = baris.filter((item) => Number(item.qtyGagalTersedia) > 0);

  return (
    <form action={action} className={common.form} noValidate>
      <input name="penerimaan_id" type="hidden" value={penerimaanId} />

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

      {bisaRetur.length === 0 ? (
        <p className={common.emptyState}>
          Tidak ada qty gagal yang belum diretur pada penerimaan ini.
        </p>
      ) : (
        <>
          <div className={table.tableWrap}>
            <table className={table.table}>
              <caption className={table.caption}>
                Isi qty retur per baris. Kosongkan baris yang tidak diretur.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Barang</th>
                  <th scope="col">Qty gagal tersedia</th>
                  <th scope="col">Qty retur</th>
                </tr>
              </thead>
              <tbody>
                {bisaRetur.map((item) => (
                  <tr key={item.penerimaanItemId}>
                    <th scope="row">{item.label}</th>
                    <td className={table.nominal}>{item.qtyGagalTersedia}</td>
                    <td>
                      <input
                        name="penerimaan_item_id"
                        type="hidden"
                        value={item.penerimaanItemId}
                      />
                      <input
                        aria-label={`Qty retur ${item.label}`}
                        className={table.qtyInput}
                        inputMode="decimal"
                        name="qty"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <FormField
            helpText="Opsional untuk pengajuan, wajib saat Accounting menolak."
            id="retur-alasan"
            label="Alasan retur"
            name="alasan"
          >
            <textarea
              className={common.textarea}
              id="retur-alasan"
              name="alasan"
              placeholder="Contoh: bahan penyok saat pengiriman"
            />
          </FormField>

          <div className={common.formActions}>
            <button className={common.primaryButton} disabled={pending} type="submit">
              {pending ? "Mengajukan..." : "Ajukan retur"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
