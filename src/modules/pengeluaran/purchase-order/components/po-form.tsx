"use client";

import { useActionState, useState } from "react";

import { FormField, Input } from "@/components/ui";
import { formatRupiah } from "@/lib/format/money";
import { rupiahKeCents } from "@/modules/pengeluaran/pemasok/format";
import { terbitkanPoAction } from "../actions";
import { hitungTotalPo } from "../baris";
import { INITIAL_PO_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import styles from "../purchase-order.module.css";

export type BarisForm = {
  itemId: string;
  label: string;
  satuan: string;
  qty: string;
  harga: string;
};

type Props = {
  permintaanId: string;
  nomorPermintaan: string;
  pemasokNama: string;
  versi: number;
  tanggal: string;
  ppnPersen: string | null;
  baris: readonly BarisForm[];
};

export function PoForm({
  baris,
  nomorPermintaan,
  pemasokNama,
  permintaanId,
  ppnPersen,
  tanggal,
  versi,
}: Props) {
  const [state, action, pending] = useActionState(
    terbitkanPoAction,
    INITIAL_PO_ACTION_STATE,
  );
  const [qty, setQty] = useState<string[]>(() => baris.map((item) => item.qty));

  const total = hitungTotalPo(
    baris.map((item, index) => ({ qty: qty[index] ?? item.qty, harga: item.harga })),
    ppnPersen ?? "0",
  );

  const kosong = baris.length === 0;

  return (
    <form action={action} className={common.form} noValidate>
      <input name="permintaan_id" type="hidden" value={permintaanId} />
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

      {ppnPersen === null ? (
        <p className={common.messageError} role="alert">
          Tarif PPN untuk tanggal ini belum tersedia. Penerbitan PO ditolak sampai
          konfigurasi pajak diisi.
        </p>
      ) : null}

      <div className={common.formGrid}>
        <FormField id="po-tanggal" label="Tanggal PO" name="tanggal" required>
          <Input defaultValue={tanggal} id="po-tanggal" name="tanggal" type="date" />
        </FormField>
        <FormField id="po-pemasok" label="Pemasok" name="pemasok">
          <Input
            defaultValue={pemasokNama}
            id="po-pemasok"
            name="pemasok"
            readOnly
          />
        </FormField>
      </div>

      <p className={common.panelMeta}>
        Permintaan {nomorPermintaan} · harga net dari harga pembanding pemasok
        terpilih, PPN {ppnPersen ?? "—"}%.
      </p>

      {kosong ? (
        <p className={common.emptyState}>
          Tidak ada harga pembanding lengkap untuk pemasok ini. Lengkapi harga di
          pemilihan pemasok.
        </p>
      ) : (
        <div className={styles.lineTable}>
          <table className={styles.table}>
            <caption className={styles.caption}>
              Qty boleh disesuaikan; harga satuan mengikuti harga pembanding.
            </caption>
            <thead>
              <tr>
                <th scope="col">Barang</th>
                <th scope="col">Qty</th>
                <th scope="col">Harga net</th>
                <th scope="col">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((item, index) => (
                <tr key={item.itemId}>
                  <th scope="row">{item.label}</th>
                  <td>
                    <input name="item_id" type="hidden" value={item.itemId} />
                    <input
                      aria-label={`Qty ${item.label}`}
                      className={styles.qtyInput}
                      defaultValue={item.qty}
                      inputMode="decimal"
                      name="qty"
                      onChange={(event) => {
                        const next = [...qty];
                        next[index] = event.target.value;
                        setQty(next);
                      }}
                    />
                    <span className={styles.satuan}>{item.satuan}</span>
                  </td>
                  <td className={styles.nominal}>{formatRupiah(rupiahKeCents(item.harga))}</td>
                  <td className={styles.nominal}>
                    {formatRupiah(
                      rupiahKeCents(
                        hitungTotalPo(
                          [{ qty: qty[index] ?? item.qty, harga: item.harga }],
                          "0",
                        ).total,
                      ),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Net / PPN / Total
                </th>
                <td className={styles.nominal}>
                  {formatRupiah(rupiahKeCents(total.net))} / {formatRupiah(rupiahKeCents(total.ppn))} /{" "}
                  {formatRupiah(rupiahKeCents(total.total))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className={common.formActions}>
        <button
          className={common.primaryButton}
          disabled={pending || kosong || ppnPersen === null}
          type="submit"
        >
          {pending ? "Menerbitkan..." : "Terbitkan PO"}
        </button>
      </div>
    </form>
  );
}
