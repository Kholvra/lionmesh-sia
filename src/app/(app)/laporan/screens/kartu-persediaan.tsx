import type { ReactNode } from "react";

import {
  hitungKartuPersediaan,
  hitungSaldoKartu,
  listGudangRingkas,
  listMutasiKartu,
  listProdukRingkas,
  uangMentahKeCents,
} from "@/core/inventory";
import { parsePeriode } from "@/core/ledger";
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
  parameterTunggal,
  type LaporanParams,
} from "./shared";

interface Props {
  profil: Profile;
  params: LaporanParams;
}

const LABEL_TIPE: Record<string, string> = {
  MASUK: "Masuk",
  KELUAR: "Keluar",
  TRANSFER_MASUK: "Transfer masuk",
  TRANSFER_KELUAR: "Transfer keluar",
  PENYESUAIAN: "Penyesuaian",
};

export async function KartuPersediaanScreen({ profil, params }: Props) {
  const supabase = await createClient();
  const [opsi, produk, gudang] = await Promise.all([
    muatOpsiPeriode(supabase),
    listProdukRingkas(supabase),
    listGudangRingkas(supabase),
  ]);

  const bingkai = (isi: ReactNode, periode?: string) => (
    <LaporanShell periode={periode} profil={profil} slug="kartu-persediaan">
      {isi}
    </LaporanShell>
  );

  if (!opsi.ok) return bingkai(<GagalMemuat pesan={opsi.message} />);
  if (!produk.ok) return bingkai(<GagalMemuat pesan={produk.message} />);
  if (!gudang.ok) return bingkai(<GagalMemuat pesan={gudang.message} />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/kartu-persediaan"
          periodeOptions={opsi.data}
        />
        <PilihPeriode pesan={periode.message} />
      </>,
    );
  }

  if (produk.data.length === 0 || gudang.data.length === 0) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/kartu-persediaan"
          periodeOptions={opsi.data}
          periodeValue={periode.data.kunci}
        />
        <Pesan>
          Master produk atau gudang belum tersedia. Kartu persediaan tidak dapat
          disusun.
        </Pesan>
      </>,
      periode.data.kunci,
    );
  }

  const produkDipilih =
    produk.data.find((item) => item.id === parameterTunggal(params.produk)) ??
    produk.data[0];
  const gudangDipilih =
    gudang.data.find((item) => item.id === parameterTunggal(params.gudang)) ??
    gudang.data[0];

  const [mutasiPeriode, mutasiSebelum] = await Promise.all([
    listMutasiKartu(supabase, {
      produkId: produkDipilih.id,
      gudangId: gudangDipilih.id,
      mulai: periode.data.mulai,
      selesai: periode.data.selesai,
    }),
    listMutasiKartu(supabase, {
      produkId: produkDipilih.id,
      gudangId: gudangDipilih.id,
      selesai: periode.data.mulai,
    }),
  ]);

  if (!mutasiPeriode.ok) {
    return bingkai(
      <GagalMemuat pesan={mutasiPeriode.message} />,
      periode.data.kunci,
    );
  }
  if (!mutasiSebelum.ok) {
    return bingkai(
      <GagalMemuat pesan={mutasiSebelum.message} />,
      periode.data.kunci,
    );
  }

  const saldoAwal = hitungSaldoKartu(mutasiSebelum.data);
  const laporan = hitungKartuPersediaan(mutasiPeriode.data, saldoAwal);

  const rows: ReportRow[] = laporan.baris.map((item) => ({
    key: item.id,
    cells: [
      { text: formatTanggal(item.tanggal) },
      { text: LABEL_TIPE[item.tipe] ?? item.tipe },
      { text: `${item.sumberTipe} · ${item.sumberId}` },
      { text: item.qtyMasuk },
      { text: item.qtyKeluar },
      { text: formatRupiah(item.nilaiMasukCents) },
      { text: formatRupiah(item.nilaiKeluarCents) },
      { text: item.saldoQty },
      { text: formatRupiah(item.saldoNilaiCents) },
    ],
  }));

  return bingkai(
    <>
      <LaporanFilter
        action="/laporan/kartu-persediaan"
        periodeOptions={opsi.data}
        periodeValue={periode.data.kunci}
        selects={[
          {
            name: "produk",
            label: "Produk",
            value: produkDipilih.id,
            options: produk.data.map((item) => ({
              value: item.id,
              label: `${item.kode} · ${item.nama}`,
            })),
          },
          {
            name: "gudang",
            label: "Gudang",
            value: gudangDipilih.id,
            options: gudang.data.map((item) => ({
              value: item.id,
              label: `${item.kode} · ${item.nama}`,
            })),
          },
        ]}
      />

      <Ringkasan
        items={[
          {
            label: "Saldo awal",
            nilai: `${saldoAwal.qty} unit · ${formatRupiah(
              uangMentahKeCents(saldoAwal.nilai),
            )}`,
          },
          { label: "Qty masuk", nilai: laporan.totalMasukQty },
          { label: "Qty keluar", nilai: laporan.totalKeluarQty },
          {
            label: "Saldo akhir",
            nilai: `${laporan.saldoAkhirQty} unit · ${formatRupiah(
              laporan.saldoAkhirNilaiCents,
            )}`,
          },
        ]}
      />

      <section>
        <SectionHeader
          judul={`Kartu ${produkDipilih.kode} · ${gudangDipilih.nama}`}
          meta={`${periode.data.label} · ${laporan.baris.length} mutasi · dibaca dari buku stok core`}
        />
        <ReportTable
          caption={`Kartu persediaan ${produkDipilih.kode} ${gudangDipilih.nama}`}
          columns={[
            { id: "tanggal", header: "Tanggal" },
            { id: "tipe", header: "Tipe" },
            { id: "sumber", header: "Sumber" },
            { id: "masuk", header: "Masuk", align: "right" },
            { id: "keluar", header: "Keluar", align: "right" },
            { id: "nilai-masuk", header: "Nilai masuk", align: "right" },
            { id: "nilai-keluar", header: "Nilai keluar", align: "right" },
            { id: "saldo-qty", header: "Saldo qty", align: "right" },
            { id: "saldo-nilai", header: "Saldo nilai", align: "right" },
          ]}
          emptyMessage="Belum ada mutasi stok pada periode ini."
          rows={rows}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
