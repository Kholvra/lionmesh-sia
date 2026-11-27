import type { ReactNode } from "react";

import {
  hitungKartuPersediaan,
  hitungSaldoKartu,
  hitungTotalNilaiMutasiCents,
  listGudangRingkas,
  listMutasiKartu,
  listMutasiPeriode,
  listProdukRingkas,
  rekonsiliasiPersediaan,
  uangMentahKeCents,
} from "@/core/inventory";
import { listBarisJurnal, parsePeriode, totalJurnalPersediaanCents } from "@/core/ledger";
import type { Profile } from "@/lib/auth/types";
import { formatTanggal } from "@/lib/format/date";
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
  parameterTunggal,
  TEKS_PILIH_PERIODE,
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

  if (!opsi.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={opsi.message} variant="inline" />);
  if (!produk.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={produk.message} variant="inline" />);
  if (!gudang.ok) return bingkai(<ErrorState judul="Laporan gagal dimuat" teks={gudang.message} variant="inline" />);

  const periode = parsePeriode(params.periode);
  if (!periode.ok) {
    return bingkai(
      <>
        <LaporanFilter
          action="/laporan/kartu-persediaan"
          periodeOptions={opsi.data}
        />
        <EmptyState judul="Pilih periode laporan" teks={periode.message ?? TEKS_PILIH_PERIODE} variant="compact" />
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
        <Notice variant="bordered">
          Master produk atau gudang belum tersedia. Kartu persediaan tidak dapat
          disusun.
        </Notice>
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
      <ErrorState judul="Laporan gagal dimuat" teks={mutasiPeriode.message} variant="inline" />,
      periode.data.kunci,
    );
  }
  if (!mutasiSebelum.ok) {
    return bingkai(
      <ErrorState judul="Laporan gagal dimuat" teks={mutasiSebelum.message} variant="inline" />,
      periode.data.kunci,
    );
  }
  const saldoAwal = hitungSaldoKartu(mutasiSebelum.data);
  const laporan = hitungKartuPersediaan(mutasiPeriode.data, saldoAwal);

  const [semuaMutasi, semuaBarisJurnal] = await Promise.all([
    listMutasiPeriode(supabase, {
      mulai: periode.data.mulai,
      selesai: periode.data.selesai,
    }),
    listBarisJurnal(supabase, {
      mulai: periode.data.mulai,
      selesai: periode.data.selesai,
    }),
  ]);

  if (!semuaMutasi.ok) {
    return bingkai(
      <ErrorState judul="Laporan gagal dimuat" teks={semuaMutasi.message} variant="inline" />,
      periode.data.kunci,
    );
  }
  if (!semuaBarisJurnal.ok) {
    return bingkai(
      <ErrorState judul="Laporan gagal dimuat" teks={semuaBarisJurnal.message} variant="inline" />,
      periode.data.kunci,
    );
  }

  const rekonsiliasi = rekonsiliasiPersediaan(
    hitungTotalNilaiMutasiCents(semuaMutasi.data),
    totalJurnalPersediaanCents(semuaBarisJurnal.data),
  );

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
        <PageHeader
          title={`Kartu ${produkDipilih.kode} · ${gudangDipilih.nama}`}
          description={`${periode.data.label} · ${laporan.baris.length} mutasi · dibaca dari buku stok core`}
          variant="section"
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
      <section>
        <PageHeader
          title="Rekonsiliasi dengan buku besar"
          description={`${periode.data.label} · agregat seluruh produk dan gudang`}
          variant="section"
        />
        <Ringkasan
          items={[
            {
              label: "Total nilai mutasi",
              nilai: formatRupiah(rekonsiliasi.nilaiMutasiCents),
            },
            {
              label: "Total jurnal persediaan",
              nilai: formatRupiah(rekonsiliasi.nilaiJurnalCents),
            },
            {
              label: "Selisih",
              nilai: formatRupiah(rekonsiliasi.selisihCents),
            },
            {
              label: "Status",
              nilai: rekonsiliasi.cocok ? "Cocok" : "Selisih",
            },
          ]}
        />
      </section>
    </>,
    periode.data.kunci,
  );
}
