"use client";

import { useActionState, useMemo, useState } from "react";

import { FormField, Input } from "@/components/ui";
import { formatRupiah } from "@/lib/format/number";
import { catatInvoiceAction } from "../actions";
import { INITIAL_INVOICE_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type Baris = {
  penerimaanItemId: string;
  label: string;
  qtyLulus: string;
  hargaPo: string;
};

type Props = {
  penerimaanId: string;
  penerimaanNomor: string;
  baris: readonly Baris[];
  tarifPpn: string | null;
  hariIni: string;
};

function keAngka(nilai: string): number {
  const angka = Number(nilai.trim().replace(",", "."));
  return Number.isFinite(angka) ? angka : 0;
}

export function InvoiceForm({
  baris,
  hariIni,
  penerimaanId,
  penerimaanNomor,
  tarifPpn,
}: Props) {
  const [state, action, pending] = useActionState(
    catatInvoiceAction,
    INITIAL_INVOICE_ACTION_STATE,
  );
  const [qty, setQty] = useState<string[]>(() => baris.map((item) => item.qtyLulus));
  const [harga, setHarga] = useState<string[]>(() => baris.map((item) => item.hargaPo));

  const dpp = useMemo(
    () =>
      baris.reduce(
        (total, item, index) =>
          total + keAngka(qty[index] ?? "") * keAngka(harga[index] ?? ""),
        0,
      ),
    [baris, harga, qty],
  );
  const ppnHitung =
    tarifPpn === null ? 0 : Math.round((dpp * keAngka(tarifPpn)) / 100);

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

      {tarifPpn === null ? (
        <p className={common.messageError} role="alert">
          Tarif PPN untuk tanggal ini belum tersedia. Invoice tidak bisa dicatat.
        </p>
      ) : null}

      <div className={common.formGrid}>
        <FormField id="invoice-nomor" label="Nomor invoice" name="nomor_invoice" required>
          <Input id="invoice-nomor" name="nomor_invoice" placeholder="INV/2026/001" />
        </FormField>
        <FormField id="invoice-tanggal" label="Tanggal invoice" name="tanggal" required>
          <Input defaultValue={hariIni} id="invoice-tanggal" name="tanggal" type="date" />
        </FormField>
        <FormField
          helpText="Wajib; jatuh tempo = tanggal invoice + termin."
          id="invoice-termin"
          label="Termin (hari)"
          name="termin_hari"
          required
        >
          <Input id="invoice-termin" inputMode="numeric" name="termin_hari" placeholder="30" />
        </FormField>
        <FormField id="invoice-faktur-pajak" label="Nomor faktur pajak" name="nomor_faktur_pajak">
          <Input id="invoice-faktur-pajak" name="nomor_faktur_pajak" placeholder="Opsional" />
        </FormField>
      </div>

      <p className={common.panelMeta}>
        Penerimaan {penerimaanNomor} · tarif PPN {tarifPpn ?? "—"}% · qty awal mengikuti qty
        lulus QC.
      </p>

      <div className={table.tableWrap}>
        <table className={table.table}>
          <caption className={table.caption}>
            Qty tagih tidak boleh melebihi qty lulus. Harga DPP dibandingkan dengan harga PO.
          </caption>
          <thead>
            <tr>
              <th scope="col">Barang</th>
              <th scope="col">Qty lulus</th>
              <th scope="col">Harga PO</th>
              <th scope="col">Qty tagih</th>
              <th scope="col">Harga DPP</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((item, index) => (
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
                <td className={table.nominal}>{formatRupiah(item.hargaPo)}</td>
                <td>
                  <input
                    aria-label={`Qty tagih ${item.label}`}
                    className={table.qtyInput}
                    defaultValue={item.qtyLulus}
                    inputMode="decimal"
                    name="qty"
                    onChange={(event) => {
                      const next = [...qty];
                      next[index] = event.target.value;
                      setQty(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    aria-label={`Harga DPP ${item.label}`}
                    className={table.qtyInput}
                    defaultValue={item.hargaPo}
                    inputMode="decimal"
                    name="harga_satuan_dpp"
                    onChange={(event) => {
                      const next = [...harga];
                      next[index] = event.target.value;
                      setHarga(next);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={common.formGrid}>
        <FormField
          helpText={`PPN hitung dari tarif: ${formatRupiah(String(ppnHitung))}`}
          id="invoice-ppn"
          label="PPN invoice"
          name="ppn_nilai"
          required
        >
          <Input
            defaultValue={String(ppnHitung)}
            id="invoice-ppn"
            inputMode="decimal"
            name="ppn_nilai"
          />
        </FormField>
        <div className={common.detailItem}>
          <p className={common.detailLabel}>Total DPP + PPN</p>
          <p className={common.detailValue}>{formatRupiah(String(dpp))}</p>
        </div>
      </div>

      <div className={common.formActions}>
        <button
          className={common.primaryButton}
          disabled={pending || tarifPpn === null}
          type="submit"
        >
          {pending ? "Menyimpan..." : "Catat invoice"}
        </button>
      </div>
    </form>
  );
}
