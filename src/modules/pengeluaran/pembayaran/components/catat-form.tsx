"use client";

import { useActionState, useMemo, useState } from "react";

import { FormField, Input } from "@/components/ui";
import { formatRupiah } from "@/lib/format/number";
import { catatPembayaranAction } from "../actions";
import { INITIAL_BAYAR_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type PemasokUtang = {
  id: string;
  nama: string;
  sisa: string;
  jumlahInvoice: number;
};

type Props = {
  pemasok: readonly PemasokUtang[];
  rekening: readonly { id: string; label: string }[];
  hariIni: string;
  pemasokTerpilih?: string;
};


export function CatatPembayaranForm({
  hariIni,
  pemasok,
  pemasokTerpilih,
  rekening,
}: Props) {
  const [state, action, pending] = useActionState(
    catatPembayaranAction,
    INITIAL_BAYAR_ACTION_STATE,
  );
  const awal = pemasokTerpilih ?? (pemasok.length === 1 ? pemasok[0]?.id : "");
  const [pemasokId, setPemasokId] = useState<string>(awal);

  const terpilih = useMemo(
    () => pemasok.find((item) => item.id === pemasokId),
    [pemasok, pemasokId],
  );

  return (
    <form action={action} className={common.form} noValidate>
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
        <div className={common.fieldFull}>
          <FormField id="bayar-pemasok" label="Pemasok" name="pemasok_id" required>
            <select
              className={table.select}
              defaultValue={awal}
              id="bayar-pemasok"
              name="pemasok_id"
              onChange={(event) => setPemasokId(event.target.value)}
            >
              <option value="">Pilih pemasok</option>
              {pemasok.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} · sisa {formatRupiah(item.sisa)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField id="bayar-rekening" label="Rekening bank" name="rekening_bank_id" required>
          <select className={table.select} id="bayar-rekening" name="rekening_bank_id">
            <option value="">Pilih rekening</option>
            {rekening.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          helpText="Bilangan bulat rupiah; alokasi otomatis ke invoice tertua."
          id="bayar-nominal"
          label="Nominal"
          name="nominal"
          required
        >
          <Input id="bayar-nominal" inputMode="numeric" name="nominal" placeholder="0" />
        </FormField>

        <FormField id="bayar-tanggal" label="Tanggal pembayaran" name="tanggal" required>
          <Input defaultValue={hariIni} id="bayar-tanggal" name="tanggal" type="date" />
        </FormField>
      </div>

      <p className={common.panelMeta}>
        {terpilih
          ? `Sisa utang ${terpilih.nama}: ${formatRupiah(terpilih.sisa)} dari ${terpilih.jumlahInvoice} invoice.`
          : "Pilih pemasok untuk melihat sisa utang."}
      </p>

      <div className={common.formActions}>
        <button
          className={common.primaryButton}
          disabled={pending || pemasok.length === 0 || rekening.length === 0}
          type="submit"
        >
          {pending ? "Menyimpan..." : "Catat pembayaran"}
        </button>
      </div>
    </form>
  );
}
