"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { catatPenerimaanAction } from "../actions";
import { INITIAL_PENERIMAAN_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import styles from "../penerimaan.module.css";

type Baris = {
  poItemId: string;
  produkId: string;
  label: string;
  qtyPo: string;
  sisa: string;
};

type Props = {
  poId: string;
  poNomor: string;
  versiPo: number;
  tanggal: string;
  baris: readonly Baris[];
  gudang: readonly { id: string; nama: string }[];
};

export function TerimaForm({
  baris,
  gudang,
  poId,
  poNomor,
  tanggal,
  versiPo,
}: Props) {
  const [state, action, pending] = useActionState(
    catatPenerimaanAction,
    INITIAL_PENERIMAAN_ACTION_STATE,
  );
  const satuGudang = gudang.length === 1 ? gudang[0] : undefined;

  return (
    <form action={action} className={common.form} noValidate>
      <input name="po_id" type="hidden" value={poId} />
      <input name="versi_po" type="hidden" value={versiPo} />

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

      <div className={common.formGrid}>
        <FormField id="terima-tanggal" label="Tanggal penerimaan" name="tanggal" required>
          <Input defaultValue={tanggal} id="terima-tanggal" name="tanggal" type="date" />
        </FormField>

        <FormField id="terima-jenis" label="Jenis penerimaan" name="jenis" required>
          <select className={styles.select} defaultValue="PENUH" id="terima-jenis" name="jenis">
            <option value="PENUH">Penuh</option>
            <option value="SEBAGIAN">Sebagian</option>
          </select>
        </FormField>

        {satuGudang ? (
          <div className={styles.fieldFull}>
            <input name="gudang_id" type="hidden" value={satuGudang.id} />
            <p className={common.panelMeta}>Gudang tujuan: {satuGudang.nama}</p>
          </div>
        ) : (
          <FormField id="terima-gudang" label="Gudang tujuan" name="gudang_id" required>
            <select className={styles.select} id="terima-gudang" name="gudang_id">
              <option value="">Pilih gudang</option>
              {gudang.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama}
                </option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      <p className={common.panelMeta}>
        PO {poNomor} · qty awal mengikuti sisa PO. Penerimaan penuh dengan qty lebih
        kecil dicatat sebagai selisih.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Qty diterima per baris PO. Jumlah seluruh penerimaan tidak boleh melebihi
            qty PO.
          </caption>
          <thead>
            <tr>
              <th scope="col">Barang</th>
              <th scope="col">Qty PO</th>
              <th scope="col">Sisa</th>
              <th scope="col">Qty diterima</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((item) => (
              <tr key={item.poItemId}>
                <th scope="row">{item.label}</th>
                <td className={styles.nominal}>{item.qtyPo}</td>
                <td className={styles.nominal}>{item.sisa}</td>
                <td>
                  <input name="po_item_id" type="hidden" value={item.poItemId} />
                  <input
                    aria-label={`Qty diterima ${item.label}`}
                    className={styles.qtyInput}
                    defaultValue={item.sisa}
                    inputMode="decimal"
                    name="qty"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={common.formActions}>
        <button className={common.primaryButton} disabled={pending} type="submit">
          {pending ? "Menyimpan..." : "Catat penerimaan"}
        </button>
      </div>
    </form>
  );
}
