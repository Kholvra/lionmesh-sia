import Link from "next/link";

import { StatusBadge } from "@/components/ui";
import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/money";
import { rupiahKeCents } from "@/modules/pengeluaran/pemasok/format";
import {
  formatQty,
  formatTanggal,
  formatTanggalSingkat,
  labelAksi,
  STATUS_PERMINTAAN,
} from "../permintaan/format";
import common from "../permintaan/permintaan.module.css";
import { PenetapanForm } from "./components/penetapan-form";
import { PenawaranForm } from "./components/penawaran-form";
import { PerbandinganTable } from "./components/perbandingan-table";
import { PemilihanTable } from "./components/pemilihan-table";
import { RiwayatHargaTable } from "./components/riwayat-harga";
import { PATH_PEMILIHAN } from "./constants";
import { hitungPerbandingan } from "./perbandingan";
import { getPemilihanPageData } from "./queries";

type Props = {
  profile: Profile;
  permintaanId?: string;
};

function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

export async function PemilihanScreen({ permintaanId, profile }: Props) {
  const canPilih = cekIzin(profile.peran, "pilih_pemasok_po");
  const data = await getPemilihanPageData(profile.peran, permintaanId);
  const terpilih = data.terpilih;

  const produkById = new Map(data.produk.map((item) => [item.id, item]));
  const satuanById = new Map(data.satuan.map((item) => [item.id, item]));
  const pemasokById = new Map(data.pemasok.map((item) => [item.id, item]));
  // Inactive suppliers stay visible for price history but cannot be chosen.
  const pemasokAktif = data.pemasok.filter((item) => item.aktif);

  const perbandingan = terpilih
    ? hitungPerbandingan(terpilih.items, terpilih.penawaran)
    : null;

  const namaBarang = (itemId: string): string => {
    const item = terpilih?.items.find((row) => row.id === itemId);
    if (!item) return itemId;
    return produkById.get(item.produk_id)?.nama ?? item.produk_id;
  };

  const namaSatuan = (satuanId: string): string =>
    satuanById.get(satuanId)?.kode ?? "";

  const namaProduk = (produkId: string): string =>
    produkById.get(produkId)?.nama ?? produkId;

  const bolehPilih = canPilih && terpilih?.header.status === "DISETUJUI";

  return (
    <section aria-label="Pemilihan pemasok" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>
            Siklus Pengeluaran / Pemilihan Pemasok
          </p>
          <h1 className={common.title}>Pemilihan pemasok</h1>
          <p className={common.description}>
            Bandingkan harga net antar pemasok untuk permintaan yang sudah
            disetujui, lalu tetapkan satu pemasok sebagai dasar purchase order.
          </p>
        </div>
      </header>

      <div className={common.layout}>
        <section className={common.listPanel} aria-labelledby="daftar-pemilihan">
          <div className={common.panelCard}>
            <div className={common.panelHeader}>
              <div>
                <h2 className={common.panelTitle} id="daftar-pemilihan">
                  Permintaan siap dipilih
                </h2>
                <p className={common.panelMeta}>
                  {data.daftar.length} permintaan · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
            </div>

            <PemilihanTable
              errorMessage={data.error ?? undefined}
              rows={data.daftar}
              selectedId={permintaanId}
            />
          </div>
        </section>

        <section className={common.panel} aria-label="Detail pemilihan pemasok">
          <div className={common.panelCard}>
            {terpilih && perbandingan ? (
              <>
                <header className={common.detailHeader}>
                  <div>
                    <h2 className={common.detailNumber}>{terpilih.header.nomor}</h2>
                    <p className={common.detailSubtitle}>
                      Diajukan oleh {terpilih.header.pemohonNama} ·{" "}
                      {formatTanggal(terpilih.header.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={terpilih.header.status}
                    statuses={STATUS_PERMINTAAN}
                  />
                </header>

                <dl className={common.details}>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Tanggal butuh</dt>
                    <dd className={common.detailValue}>
                      {formatTanggalSingkat(terpilih.header.tanggalButuh)}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Estimasi nilai</dt>
                    <dd className={common.detailValue}>
                      {terpilih.header.nominal === null
                        ? "Belum diisi"
                        : formatRupiah(rupiahKeCents(terpilih.header.nominal))}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Pemasok terpilih</dt>
                    <dd className={common.detailValue}>
                      {terpilih.pemasokTerpilihId === null
                        ? "Belum ditetapkan"
                        : (pemasokById.get(terpilih.pemasokTerpilihId)?.nama ??
                          terpilih.pemasokTerpilihId)}
                    </dd>
                  </div>
                  <div className={common.detailItem}>
                    <dt className={common.detailLabel}>Alasan pemilihan</dt>
                    <dd className={common.detailValue}>
                      {terpilih.alasanPemilihan ?? "—"}
                    </dd>
                  </div>
                </dl>

                <ul className={common.itemList} aria-label="Barang yang diminta">
                  {terpilih.items.map((item) => (
                    <li className={common.itemRow} key={item.id}>
                      <span className={common.itemName}>
                        {namaProduk(item.produk_id)}
                      </span>
                      <span className={common.itemQty}>
                        {formatQty(item.qty)} {namaSatuan(item.satuan_id)}
                      </span>
                    </li>
                  ))}
                </ul>

                <hr className={common.sectionDivider} />

                <section aria-labelledby="perbandingan-harga">
                  <h3 className={common.panelTitle} id="perbandingan-harga">
                    Perbandingan harga
                  </h3>
                  <PerbandinganTable
                    namaBarang={namaBarang}
                    namaSatuan={namaSatuan}
                    pemasok={data.pemasok}
                    perbandingan={perbandingan}
                  />
                </section>

                {bolehPilih && pemasokAktif.length > 0 ? (
                  <section aria-labelledby="input-harga">
                    <hr className={common.sectionDivider} />
                    <h3 className={common.panelTitle} id="input-harga">
                      Tambah harga pembanding
                    </h3>
                    <PenawaranForm
                      hariIni={hariIniJakarta()}
                      items={terpilih.items.map((item) => ({
                        id: item.id,
                        label: `${namaProduk(item.produk_id)} · ${formatQty(item.qty)} ${namaSatuan(item.satuan_id)}`,
                      }))}
                      pemasok={pemasokAktif.map((item) => ({
                        id: item.id,
                        nama: item.nama,
                      }))}
                      permintaanId={terpilih.header.dokumenId}
                    />
                  </section>
                ) : null}

                {bolehPilih ? (
                  <section aria-labelledby="tetapkan-pemasok">
                    <hr className={common.sectionDivider} />
                    <h3 className={common.panelTitle} id="tetapkan-pemasok">
                      Tetapkan pemasok
                    </h3>
                    <PenetapanForm
                      pemasok={perbandingan.total
                        .filter((total) =>
                          pemasokAktif.some((item) => item.id === total.pemasokId),
                        )
                        .map((total) => ({
                          id: total.pemasokId,
                          nama: pemasokById.get(total.pemasokId)?.nama ?? total.pemasokId,
                          lengkap: total.lengkap,
                          total: total.total,
                          termurah: total.termurah,
                        }))}
                      permintaanId={terpilih.header.dokumenId}
                      versi={terpilih.header.versi}
                    />
                  </section>
                ) : null}

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-harga">
                  <h3 className={common.panelTitle} id="riwayat-harga">
                    Riwayat harga barang
                  </h3>
                  <RiwayatHargaTable
                    namaBarang={namaProduk}
                    riwayat={data.riwayatHarga}
                  />
                </section>

                <hr className={common.sectionDivider} />

                <section aria-labelledby="riwayat-pemilihan">
                  <h3 className={common.panelTitle} id="riwayat-pemilihan">
                    Riwayat status
                  </h3>
                  {terpilih.riwayat.length === 0 ? (
                    <p className={common.emptyState}>Belum ada riwayat.</p>
                  ) : (
                    <ol className={common.historyList}>
                      {terpilih.riwayat.map((item) => (
                        <li className={common.historyItem} key={item.id}>
                          <span className={common.historyAction}>
                            {labelAksi(item.aksi)} · {item.status_asal ?? "—"} →{" "}
                            {item.status_tujuan}
                          </span>
                          <span className={common.historyMeta}>
                            {formatTanggal(item.created_at)}
                            {item.alasan ? ` · ${item.alasan}` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            ) : permintaanId ? (
              <div>
                <h2 className={common.panelTitle}>Permintaan tidak ditemukan</h2>
                <p className={common.emptyState}>
                  Permintaan tidak tersedia atau belum disetujui.
                </p>
                <Link className={common.secondaryButton} href={PATH_PEMILIHAN}>
                  Kembali ke daftar
                </Link>
              </div>
            ) : (
              <p className={common.emptyState}>
                Pilih permintaan yang sudah disetujui untuk membandingkan harga dan
                menetapkan pemasok.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
