import type { ReactNode } from "react";

import { hitungNeracaSaldo, listBarisJurnal, parsePeriode } from "@/core/ledger";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/money";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Ringkasan } from "@/components/ui/metric-card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { LaporanFilter } from "../components/laporan-filter";
import { LaporanShell } from "../components/laporan-shell";
import { ReportTable, type ReportRow } from "../components/report-table";
import {
  muatOpsiPeriode,
  TEKS_PILIH_PERIODE,
  type LaporanParams,
} from "./shared";

interface Props {
  profil: Profile;
  params: LaporanParams;
}

export async function NeracaSaldoScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const opsi = await muatOpsiPeriode(supabase);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="neraca-saldo">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={opsi.message} variant="inline" />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/neraca-saldo"
          periodeOptions={opsi.data}
        />
        <EmptyState judul="Pilih periode laporan" teks={periode.message ?? TEKS_PILIH_PERIODE} variant="compact" />
      </>,
    );
  }

  const baris = await listBarisJurnal(supabase, {
    selesai: periode.data.selesai,
  });
  if (!baris.ok) {
    return bingkai(
      <ErrorState judul="Laporan gagal dimuat" teks={baris.message} variant="inline" />,
      periode.data.kunci,
    );
  }

  const laporan = hitungNeracaSaldo(baris.data);
  const rows: ReportRow[] = laporan.baris.map((item) => ({
    key: item.akunId,
    cells: [
      { text: `${item.nomor} · ${item.nama}` },
      { text: formatRupiah(item.debitCents) },
      { text: formatRupiah(item.kreditCents) },
    ],
  }));

  return bingkai(
    <>
      <LaporanFilter
        action="/laporan/neraca-saldo"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
      />

      <Ringkasan
        items={[
          { label: "Total debit", nilai: formatRupiah(laporan.totalDebitCents) },
          { label: "Total kredit", nilai: formatRupiah(laporan.totalKreditCents) },
          {
            label: laporan.seimbang ? "Status" : "Selisih",
            nilai: laporan.seimbang
              ? "Seimbang"
              : formatRupiah(laporan.selisihCents),
            bahaya: !laporan.seimbang,
          },
        ]}
      />

      {laporan.seimbang ? (
        <Notice variant="bordered">Total debit sama dengan total kredit.</Notice>
      ) : (
        <Notice nada="bahaya" variant="bordered">
          Neraca saldo tidak seimbang. Selisih {formatRupiah(laporan.selisihCents)}{" "}
          ditampilkan apa adanya; periksa jurnal sumber lewat jalur posting yang
          benar.
        </Notice>
      )}

      <section>
        <PageHeader
          title="Saldo per akun"
          description={`${periode.data.label} · kumulatif sampai akhir periode`}
          variant="section"
        />
        <ReportTable
          caption={`Neraca saldo ${periode.data.label}`}
          columns={[
            { id: "akun", header: "Akun" },
            { id: "debit", header: "Debit", align: "right" },
            { id: "kredit", header: "Kredit", align: "right" },
          ]}
          emptyMessage="Belum ada saldo akun pada periode ini."
          rows={rows}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
