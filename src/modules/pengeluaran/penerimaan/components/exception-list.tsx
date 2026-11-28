"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui";
import type { ExceptionPengadaanView } from "@/core/pengadaan";
import { tutupExceptionAction } from "../actions";
import { INITIAL_PENERIMAAN_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import styles from "../penerimaan.module.css";

type Props = {
  exception: readonly ExceptionPengadaanView[];
  produkNama: ReadonlyMap<string, string>;
  bisaTutup: boolean;
};

export function ExceptionList({ bisaTutup, exception, produkNama }: Props) {
  if (exception.length === 0) {
    return <p className={common.emptyState}>Tidak ada exception terbuka.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Selisih dan kelebihan qty yang menunggu keputusan Purchasing.
        </caption>
        <thead>
          <tr>
            <th scope="col">PO</th>
            <th scope="col">Barang</th>
            <th scope="col">Tipe</th>
            <th scope="col">Qty PO</th>
            <th scope="col">Qty diterima</th>
            <th scope="col">Selisih</th>
            {bisaTutup ? <th scope="col">Tutup</th> : null}
          </tr>
        </thead>
        <tbody>
          {exception.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.poNomor ?? row.poId}</th>
              <td>
                {row.produkId ? (produkNama.get(row.produkId) ?? row.produkId) : "—"}
              </td>
              <td>{row.tipe === "KELEBIHAN_QTY" ? "Kelebihan" : "Selisih"}</td>
              <td className={styles.nominal}>{row.qtyPo}</td>
              <td className={styles.nominal}>{row.qtyDiterima}</td>
              <td className={styles.nominal}>{row.selisih}</td>
              {bisaTutup ? (
                <td>
                  <TutupForm exceptionId={row.id} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TutupForm({ exceptionId }: { exceptionId: string }) {
  const [state, action, pending] = useActionState(
    tutupExceptionAction,
    INITIAL_PENERIMAAN_ACTION_STATE,
  );

  return (
    <form action={action} className={styles.inlineForm}>
      <input name="exception_id" type="hidden" value={exceptionId} />
      <Input
        aria-label="Alasan penutupan"
        name="alasan"
        placeholder="Alasan"
        required
      />
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "..." : "Tutup"}
      </button>
      {state.status === "error" && state.message ? (
        <span className={common.messageError} role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" && state.message ? (
        <span className={common.messageSuccess} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
