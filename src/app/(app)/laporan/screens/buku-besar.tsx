import type { ReactNode } from "react";

import {
  hitungBukuBesar,
  listAkunAktif,
  listBarisJurnal,
  parsePeriode,
  saldoNetoCents,
} from "@/core/ledger";
import { formatTanggal } from "@/lib/format/date";
import { formatRupiah } from "@/lib/format/money";
import type { Profile } from "@/lib/auth/types";
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
  parameterTunggal,
  TEKS_PILIH_PERIODE,
  type LaporanParams,
} from "./shared";

interface Props {
  profil: Profile;
  params: LaporanParams;
}

export async function BukuBesarScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const [opsi, akun] = await Promise.all([
    muatOpsiPeriode(supabase),
    listAkunAktif(supabase),
  ]);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="buku-besar">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={opsi.message} variant="inline" />);
  if (!akun.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={akun.message} variant="inline" />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/buku-besar"
          periodeOptions={opsi.data}
        />
        <EmptyState judul="Pilih periode laporan" teks={periode.message ?? TEKS_PILIH_PERIODE} variant="compact" />
      </>,
    );
  }

  if (akun.data.length === 0) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/buku-besar"
          periodeOptions={opsi.data}
          periodeValue={periode.data.kunci}
        />
        <Notice variant="bordered">Belum ada akun aktif. Laporan tidak dapat disusun.</Notice>
      </>,
      periode.data.kunci,
    );
  }

  const akunDipilih =
    akun.data.find((item) => item.id === parameterTunggal(params.akun)) ??
    akun.data[0];

  const [barisPeriode, barisSebelum] = await Promise.all([
    listBarisJurnal(supabase, {
      mulai: periode.data.mulai,
      selesai: periode.data.selesai,
      akunId: akunDipilih.id,
    }),
    listBarisJurnal(supabase, {
      selesai: periode.data.mulai,
      akunId: akunDipilih.id,
    }),
  ]);

  if (!barisPeriode.ok) {
    return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={barisPeriode.message} variant="inline" />, periode.data.kunci);
  }
  if (!barisSebelum.ok) {
    return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={barisSebelum.message} variant="inline" />, periode.data.kunci);
  }

  const laporan = hitungBukuBesar(
    barisPeriode.data,
    akunDipilih,
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
        action="/laporan/buku-besar"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
        selects={[
          {
            name: "akun",
            label: "Akun",
            value: akunDipilih.id,
            options: akun.data.map((item) => ({
              value: item.id,
              label: `${item.nomor} · ${item.nama}`,
            })),
          },
        ]}
      />

      <Ringkasan
        items={[
          { label: "Saldo awal", nilai: formatRupiah(laporan.saldoAwalCents) },
          { label: "Total debit", nilai: formatRupiah(laporan.totalDebitCents) },
          { label: "Total kredit", nilai: formatRupiah(laporan.totalKreditCents) },
          { label: "Saldo akhir", nilai: formatRupiah(laporan.saldoAkhirCents) },
        ]}
      />

      <section>
        <PageHeader
          title={`Buku besar ${laporan.akun.nomor} · ${laporan.akun.nama}`}
          description={`${periode.data.label} · ${laporan.baris.length} baris`}
          variant="section"
        />
        <ReportTable
          caption={`Buku besar akun ${laporan.akun.nomor} ${laporan.akun.nama}`}
          columns={[
            { id: "tanggal", header: "Tanggal" },
            { id: "sumber", header: "Sumber" },
            { id: "pemicu", header: "Pemicu" },
            { id: "debit", header: "Debit", align: "right" },
            { id: "kredit", header: "Kredit", align: "right" },
            { id: "saldo", header: "Saldo", align: "right" },
          ]}
          emptyMessage="Belum ada jurnal untuk akun ini pada periode terpilih."
          rows={rows}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
