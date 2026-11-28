"use client";

import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import { koreksiInvoiceAction, sahkanInvoiceAction, batalkanInvoiceAction } from "../actions";
import { INITIAL_INVOICE_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type Baris = {
  penerimaanItemId: string;
  label: string;
  qty: string;
  hargaSatuanDpp: string;
  qtyLulus: string;
};

type Props = {
  dokumenId: string;
  versi: number;
  status: string;
  ppnNilai: string;
  baris: readonly Baris[];
  bisaSahkan: boolean;
  bisaBatal: boolean;
  bisaKoreksi: boolean;
};

export function InvoiceActions({
  baris,
  bisaBatal,
  bisaKoreksi,
  bisaSahkan,
  dokumenId,
  ppnNilai,
  status,
  versi,
}: Props) {
  if (!bisaSahkan && !bisaBatal && !bisaKoreksi) return null;

  return (
    <div>
      {bisaSahkan && status === "COCOK" ? (
        <SahkanForm dokumenId={dokumenId} versi={versi} />
      ) : null}

      {bisaKoreksi && status === "SELISIH" ? (
        <KoreksiForm
          baris={baris}
          dokumenId={dokumenId}
          ppnNilai={ppnNilai}
          versi={versi}
        />
      ) : null}

      {bisaBatal && ["COCOK", "SELISIH", "TERCATAT"].includes(status) ? (
        <BatalForm dokumenId={dokumenId} versi={versi} />
      ) : null}
    </div>
  );
}

function SahkanForm({ dokumenId, versi }: { dokumenId: string; versi: number }) {
  const [state, action, pending] = useActionState(
    sahkanInvoiceAction,
    INITIAL_INVOICE_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
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
      <button className={common.primaryButton} disabled={pending} type="submit">
        {pending ? "Mengesahkan..." : "Sahkan dan akui utang"}
      </button>
    </form>
  );
}

function KoreksiForm({
  baris,
  dokumenId,
  ppnNilai,
  versi,
}: {
  baris: readonly Baris[];
  dokumenId: string;
  ppnNilai: string;
  versi: number;
}) {
  const [state, action, pending] = useActionState(
    koreksiInvoiceAction,
    INITIAL_INVOICE_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />

      <div className={table.tableWrap}>
        <table className={table.table}>
          <caption className={table.caption}>
            Koreksi qty atau harga DPP lalu cocokkan ulang.
          </caption>
          <thead>
            <tr>
              <th scope="col">Barang</th>
              <th scope="col">Qty lulus</th>
              <th scope="col">Qty tagih</th>
              <th scope="col">Harga DPP</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((item) => (
              <tr key={item.penerimaanItemId}>
                <th scope="row">
                  {item.label}
                  <input
                    name="penerimaan_item_id"
                    type="hidden"
                    value={item.penerimaanItemId}
                  />
                </th>
                <td className={table.nominal}>{item.qtyLulus}</td>
                <td>
                  <input
                    aria-label={`Qty tagih ${item.label}`}
                    className={table.qtyInput}
                    defaultValue={item.qty}
                    inputMode="decimal"
                    name="qty"
                  />
                </td>
                <td>
                  <input
                    aria-label={`Harga DPP ${item.label}`}
                    className={table.qtyInput}
                    defaultValue={item.hargaSatuanDpp}
                    inputMode="decimal"
                    name="harga_satuan_dpp"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormField id="koreksi-ppn" label="PPN invoice" name="ppn_nilai" required>
        <Input defaultValue={ppnNilai} id="koreksi-ppn" inputMode="decimal" name="ppn_nilai" />
      </FormField>

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
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "Mencocokkan..." : "Simpan koreksi dan cocokkan ulang"}
      </button>
    </form>
  );
}

function BatalForm({ dokumenId, versi }: { dokumenId: string; versi: number }) {
  const [state, action, pending] = useActionState(
    batalkanInvoiceAction,
    INITIAL_INVOICE_ACTION_STATE,
  );

  return (
    <form action={action} className={common.actionForm}>
      <input name="id" type="hidden" value={dokumenId} />
      <input name="versi" type="hidden" value={versi} />
      <FormField id="invoice-alasan-batal" label="Alasan pembatalan" name="alasan">
        <textarea
          className={common.textarea}
          id="invoice-alasan-batal"
          name="alasan"
          placeholder="Contoh: invoice ganda dari pemasok"
        />
      </FormField>
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
      <button className={common.dangerButton} disabled={pending} type="submit">
        {pending ? "Membatalkan..." : "Batalkan invoice"}
      </button>
    </form>
  );
}
