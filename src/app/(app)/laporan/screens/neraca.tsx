import type { ReactNode } from "react";

import { hitungNeraca, listBarisJurnal, parsePeriode } from "@/core/ledger";
import type { Profile } from "@/lib/auth/types";
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

function rowsDari(
  items: readonly { akunId: string; nomor: string; nama: string; nilaiCents: string }[],
): ReportRow[] {
  return items.map((item) => ({
    key: item.akunId,
    cells: [
      { text: `${item.nomor} · ${item.nama}` },
      { text: formatRupiah(item.nilaiCents) },
    ],
  }));
}

export async function NeracaScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const opsi = await muatOpsiPeriode(supabase);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="neraca">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<GagalMemuat pesan={opsi.message} />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter action="/laporan/neraca" periodeOptions={opsi.data} />
        <PilihPeriode pesan={periode.message} />
      </>,
    );
  }

  const mulaiTahun = `${periode.data.tahun}-01-01T00:00:00+07:00`;
  const [kumulatif, tahunBerjalan] = await Promise.all([
    listBarisJurnal(supabase, { selesai: periode.data.selesai }),
    listBarisJurnal(supabase, {
      mulai: mulaiTahun,
      selesai: periode.data.selesai,
    }),
  ]);

  if (!kumulatif.ok) {
    return bingkai(
      <GagalMemuat pesan={kumulatif.message} />,
      periode.data.kunci,
    );
  }
  if (!tahunBerjalan.ok) {
    return bingkai(
      <GagalMemuat pesan={tahunBerjalan.message} />,
      periode.data.kunci,
    );
  }

  const laporan = hitungNeraca(kumulatif.data, tahunBerjalan.data);

  const rowsEkuitas = rowsDari(laporan.ekuitas);
  rowsEkuitas.push({
    key: "laba-tahun-berjalan",
    cells: [
      { text: "Laba tahun berjalan" },
      { text: formatRupiah(laporan.labaTahunBerjalanCents) },
    ],
  });

  return bingkai(
    <>
      <LaporanFilter
        action="/laporan/neraca"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
      />

      <Ringkasan
        items={[
          { label: "Total aktiva", nilai: formatRupiah(laporan.totalAsetCents) },
          {
            label: "Total kewajiban",
            nilai: formatRupiah(laporan.totalKewajibanCents),
          },
          {
            label: "Total ekuitas",
            nilai: formatRupiah(laporan.totalEkuitasCents),
          },
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
        <Pesan>Aktiva sama dengan kewajiban ditambah ekuitas.</Pesan>
      ) : (
        <Pesan nada="bahaya">
          Neraca tidak seimbang. Selisih {formatRupiah(laporan.selisihCents)}{" "}
          ditampilkan apa adanya; periksa jurnal sumber lewat jalur posting yang
          benar.
        </Pesan>
      )}

      {laporan.belumDiklasifikasi.length > 0 ? (
        <Pesan nada="bahaya">
          Ada akun dengan peran di luar COA laporan. Akun tersebut ditampilkan
          terpisah agar selisih tidak tersembunyi.
        </Pesan>
      ) : null}

      <section>
        <SectionHeader
          judul="Aktiva"
          meta={`${periode.data.label} · kumulatif sampai akhir periode`}
        />
        <ReportTable
          caption={`Aktiva ${periode.data.label}`}
          columns={[
            { id: "akun", header: "Akun" },
            { id: "nilai", header: "Nilai", align: "right" },
          ]}
          emptyMessage="Belum ada saldo aktiva."
          rows={rowsDari(laporan.aset)}
        />
      </section>

      <section>
        <SectionHeader judul="Kewajiban" meta={periode.data.label} />
        <ReportTable
          caption={`Kewajiban ${periode.data.label}`}
          columns={[
            { id: "akun", header: "Akun" },
            { id: "nilai", header: "Nilai", align: "right" },
          ]}
          emptyMessage="Belum ada saldo kewajiban."
          rows={rowsDari(laporan.kewajiban)}
        />
      </section>

      <section>
        <SectionHeader judul="Ekuitas" meta="Termasuk laba tahun berjalan" />
        <ReportTable
          caption={`Ekuitas ${periode.data.label}`}
          columns={[
            { id: "akun", header: "Akun" },
            { id: "nilai", header: "Nilai", align: "right" },
          ]}
          emptyMessage="Belum ada saldo ekuitas."
          rows={rowsEkuitas}
        />
      </section>

      {laporan.belumDiklasifikasi.length > 0 ? (
        <section>
          <SectionHeader judul="Akun belum diklasifikasi" />
          <ReportTable
            caption="Akun yang belum diklasifikasi"
            columns={[
              { id: "akun", header: "Akun" },
              { id: "nilai", header: "Nilai", align: "right" },
            ]}
            emptyMessage="Tidak ada akun di luar klasifikasi."
            rows={rowsDari(laporan.belumDiklasifikasi)}
          />
        </section>
      ) : null}
    </>,
    periode.data.kunci,
  );
}
