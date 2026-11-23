import type { ReactNode } from "react";

import {
  hitungBukuBesar,
  listAkunAktif,
  listBarisJurnal,
  parsePeriode,
  saldoNetoCents,
} from "@/core/ledger";
import type { Profile } from "@/lib/auth/types";
import { formatTanggal } from "@/lib/format/date";
import { formatRupiah } from "@/lib/format/money";
import { createClient } from "@/lib/supabase/server";
import { LaporanFilter } from "../components/laporan-filter";
import {
  LaporanShell,
  Pesan,
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

export async function ArusKasScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const [opsi, akun] = await Promise.all([
    muatOpsiPeriode(supabase),
    listAkunAktif(supabase),
  ]);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="arus-kas">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<GagalMemuat pesan={opsi.message} />);
  if (!akun.ok) return bingkai(<GagalMemuat pesan={akun.message} />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter action="/laporan/arus-kas" periodeOptions={opsi.data} />
        <PilihPeriode pesan={periode.message} />
      </>,
    );
  }

  const akunKas = akun.data.find((item) => item.peran === "kas_bank");
  if (!akunKas) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/arus-kas"
          periodeOptions={opsi.data}
          periodeValue={periode.data.kunci}
        />
        <Pesan>
          Akun dengan peran kas dan bank belum tersedia di COA. Arus kas tidak
          dapat disusun.
        </Pesan>
      </>,
      periode.data.kunci,
    );
  }

  const [barisPeriode, barisSebelum] = await Promise.all([
    listBarisJurnal(supabase, {
      mulai: periode.data.mulai,
      selesai: periode.data.selesai,
      akunId: akunKas.id,
    }),
    listBarisJurnal(supabase, {
      selesai: periode.data.mulai,
      akunId: akunKas.id,
    }),
  ]);

  if (!barisPeriode.ok) {
    return bingkai(
      <GagalMemuat pesan={barisPeriode.message} />,
      periode.data.kunci,
    );
  }
  if (!barisSebelum.ok) {
    return bingkai(
      <GagalMemuat pesan={barisSebelum.message} />,
      periode.data.kunci,
    );
  }

  const laporan = hitungBukuBesar(
    barisPeriode.data,
    akunKas,
    saldoNetoCents(barisSebelum.data),
  );

  const rows: ReportRow[] = laporan.baris.map((item) => ({
    key: item.barisId,
    cells: [
      { text: formatTanggal(item.tanggal) },
      { text: `${item.sumberTipe} · ${item.sumberNomor}` },
      { text: item.sumberPemicu },
      { text: formatRupiah(item.debitCents) },
      { text: formatRupiah(item.kreditCents) },
      { text: formatRupiah(item.saldoCents) },
    ],
  }));

  return bingkai(
    <>
      <LaporanFilter
        action="/laporan/arus-kas"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
      />

      <Ringkasan
        items={[
          { label: "Saldo awal", nilai: formatRupiah(laporan.saldoAwalCents) },
          { label: "Kas masuk", nilai: formatRupiah(laporan.totalDebitCents) },
          { label: "Kas keluar", nilai: formatRupiah(laporan.totalKreditCents) },
          { label: "Saldo akhir", nilai: formatRupiah(laporan.saldoAkhirCents) },
        ]}
      />

      <section>
        <SectionHeader
          judul={`Arus kas ${laporan.akun.nomor} · ${laporan.akun.nama}`}
          meta={`${periode.data.label} · ${laporan.baris.length} baris jurnal`}
        />
        <ReportTable
          caption={`Arus kas ${periode.data.label}`}
          columns={[
            { id: "tanggal", header: "Tanggal" },
            { id: "sumber", header: "Sumber" },
            { id: "pemicu", header: "Pemicu" },
            { id: "masuk", header: "Kas masuk", align: "right" },
            { id: "keluar", header: "Kas keluar", align: "right" },
            { id: "saldo", header: "Saldo", align: "right" },
          ]}
          emptyMessage="Belum ada mutasi kas dan bank pada periode ini."
          rows={rows}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
