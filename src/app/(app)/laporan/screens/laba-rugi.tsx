import type { ReactNode } from "react";

import { hitungLabaRugi, listBarisJurnal, parsePeriode } from "@/core/ledger";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/money";
import { createClient } from "@/lib/supabase/server";
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

export async function LabaRugiScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const opsi = await muatOpsiPeriode(supabase);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="laba-rugi">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={opsi.message} variant="inline" />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/laba-rugi"
          periodeOptions={opsi.data}
        />
        <EmptyState judul="Pilih periode laporan" teks={periode.message ?? TEKS_PILIH_PERIODE} variant="compact" />
      </>,
    );
  }

  const baris = await listBarisJurnal(supabase, {
    mulai: periode.data.mulai,
    selesai: periode.data.selesai,
  });
  if (!baris.ok) {
    return bingkai(
      <ErrorState judul="Laporan gagal dimuat" teks={baris.message} variant="inline" />,
      periode.data.kunci,
    );
  }

  const laporan = hitungLabaRugi(baris.data);
  const rowsPendapatan: ReportRow[] = laporan.pendapatan.map((item) => ({
    key: item.akunId,
    cells: [
      { text: `${item.nomor} · ${item.nama}` },
      { text: formatRupiah(item.nilaiCents) },
    ],
  }));
  const rowsBeban: ReportRow[] = laporan.beban.map((item) => ({
    key: item.akunId,
    cells: [
      { text: `${item.nomor} · ${item.nama}` },
      { text: formatRupiah(item.nilaiCents) },
    ],
  }));

  return bingkai(
    <>
      <LaporanFilter
        action="/laporan/laba-rugi"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
      />

      <Ringkasan
        items={[
          {
            label: "Total pendapatan",
            nilai: formatRupiah(laporan.totalPendapatanCents),
          },
          { label: "Total beban", nilai: formatRupiah(laporan.totalBebanCents) },
          {
            label: "Laba bersih",
            nilai: formatRupiah(laporan.labaBersihCents),
            bahaya: BigInt(laporan.labaBersihCents) < BigInt(0),
          },
        ]}
      />

      <section>
        <PageHeader title="Pendapatan" description={`${periode.data.label} · akun peran penjualan`} variant="section" />
        <ReportTable
          caption={`Pendapatan ${periode.data.label}`}
          columns={[
            { id: "akun", header: "Akun" },
            { id: "nilai", header: "Nilai", align: "right" },
          ]}
          emptyMessage="Belum ada pendapatan pada periode ini."
          rows={rowsPendapatan}
        />
      </section>

      <section>
        <PageHeader
          title="Beban"
          description="HPP, tenaga kerja langsung, overhead pabrik, dan beban gaji administrasi"
          variant="section"
        />
        <ReportTable
          caption={`Beban ${periode.data.label}`}
          columns={[
            { id: "akun", header: "Akun" },
            { id: "nilai", header: "Nilai", align: "right" },
          ]}
          emptyMessage="Belum ada beban pada periode ini."
          rows={rowsBeban}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
