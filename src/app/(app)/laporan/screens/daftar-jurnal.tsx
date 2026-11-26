import type { ReactNode } from "react";

import { listBarisJurnal, parsePeriode, susunDaftarJurnal } from "@/core/ledger";
import type { Profile } from "@/lib/auth/types";
import { formatTanggal } from "@/lib/format/date";
import { formatRupiah } from "@/lib/format/money";
import { createClient } from "@/lib/supabase/server";
import { LaporanFilter } from "../components/laporan-filter";
import {
  LaporanShell,
  PilihPeriode,
  Ringkasan,
  SectionHeader,
} from "../components/laporan-shell";
import { ReportTable, type ReportRow } from "../components/report-table";
import {
  GagalMemuat,
  muatOpsiPeriode,
  type LaporanParams,
} from "./shared";

interface Props {
  profil: Profile;
  params: LaporanParams;
}

export async function DaftarJurnalScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const opsi = await muatOpsiPeriode(supabase);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="daftar-jurnal">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<GagalMemuat pesan={opsi.message} />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/daftar-jurnal"
          periodeOptions={opsi.data}
        />
        <PilihPeriode pesan={periode.message} />
      </>,
    );
  }

  const baris = await listBarisJurnal(supabase, {
    mulai: periode.data.mulai,
    selesai: periode.data.selesai,
  });
  if (!baris.ok) {
    return bingkai(
      <GagalMemuat pesan={baris.message} />,
      periode.data.kunci,
    );
  }

  const laporan = susunDaftarJurnal(baris.data);
  const rows: ReportRow[] = laporan.baris.map((item) => ({
    key: item.barisId,
    cells: [
      { text: formatTanggal(item.tanggal) },
      { text: `${item.sumberTipe} · ${item.sumberNomor}` },
      { text: item.sumberPemicu },
      { text: `${item.akunNomor} · ${item.akunNama}` },
      { text: formatRupiah(item.debitCents) },
      { text: formatRupiah(item.kreditCents) },
    ],
  }));

  return bingkai(
    <>
      <LaporanFilter
        action="/laporan/daftar-jurnal"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
      />

      <Ringkasan
        items={[
          { label: "Jumlah jurnal", nilai: String(laporan.jumlahJurnal) },
          { label: "Jumlah baris", nilai: String(laporan.baris.length) },
          { label: "Total debit", nilai: formatRupiah(laporan.totalDebitCents) },
          { label: "Total kredit", nilai: formatRupiah(laporan.totalKreditCents) },
        ]}
      />

      <section>
        <SectionHeader
          judul="Jurnal periode"
          meta={`${periode.data.label} · setiap baris menunjuk jurnal sumbernya`}
        />
        <ReportTable
          caption={`Daftar jurnal ${periode.data.label}`}
          columns={[
            { id: "tanggal", header: "Tanggal" },
            { id: "sumber", header: "Sumber" },
            { id: "pemicu", header: "Pemicu" },
            { id: "akun", header: "Akun" },
            { id: "debit", header: "Debit", align: "right" },
            { id: "kredit", header: "Kredit", align: "right" },
          ]}
          emptyMessage="Belum ada jurnal pada periode ini."
          rows={rows}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
