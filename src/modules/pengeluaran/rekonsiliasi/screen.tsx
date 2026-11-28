import { cekIzin } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/auth/types";
import { formatRupiah } from "@/lib/format/money";
import { rupiahKeCents } from "@/modules/pengeluaran/pemasok/format";
import common from "../permintaan/permintaan.module.css";
import table from "../penerimaan/penerimaan.module.css";
import { ImporForm } from "./components/impor-form";
import { MutasiRowActions } from "./components/mutasi-row-actions";
import { PATH_REKONSILIASI } from "./constants";
import { getRekonPageData } from "./queries";
import styles from "./rekonsiliasi.module.css";

type Props = {
  profile: Profile;
  periode?: string;
  rekeningId?: string;
};

const LABEL_STATUS: Record<string, string> = {
  BELUM_COCOK: "Belum cocok",
  COCOK: "Cocok",
  SELISIH: "Selisih",
};

export async function RekonsiliasiScreen({ periode, profile, rekeningId }: Props) {
  const canRekon = cekIzin(profile.peran, "rekonsiliasi_bank");
  const data = await getRekonPageData(profile.peran, { periode, rekeningId });

  const labelRekening = new Map(
    data.rekening.map((item) => [item.id, `${item.namaBank} · ${item.nomor}`]),
  );

  const belum = data.daftar.filter((row) => row.status !== "COCOK").length;
  const cocok = data.daftar.filter((row) => row.status === "COCOK").length;

  return (
    <section aria-label="Rekonsiliasi bank" className={common.page}>
      <header className={common.header}>
        <div>
          <p className={common.breadcrumb}>Siklus Pengeluaran / Rekonsiliasi Bank</p>
          <h1 className={common.title}>Rekonsiliasi bank</h1>
          <p className={common.description}>
            Impor mutasi bank dari CSV, cocokkan dengan baris jurnal kas, dan tandai
            selisih. Rekonsiliasi tidak membuat jurnal dan tidak mengubah saldo.
          </p>
        </div>
      </header>

      <form className={styles.filter} method="get">
        <label className={styles.filterField}>
          <span className={common.detailLabel}>Periode</span>
          <input
            className={common.reasonInput}
            defaultValue={data.periode}
            name="periode"
            type="month"
          />
        </label>
        <label className={styles.filterField}>
          <span className={common.detailLabel}>Rekening</span>
          <select className={table.select} defaultValue={data.rekeningId} name="rekening">
            <option value="">Semua rekening</option>
            {data.rekening.map((item) => (
              <option key={item.id} value={item.id}>
                {item.namaBank} · {item.nomor}
              </option>
            ))}
          </select>
        </label>
        <button className={common.secondaryButton} type="submit">
          Tampilkan
        </button>
      </form>

      {data.error ? (
        <p className={common.messageError} role="alert">
          {data.error}
        </p>
      ) : null}

      <div className={common.layout}>
        <section className={common.listPanel} aria-labelledby="impor-mutasi">
          <div className={common.panelCard}>
            <div className={common.panelHeader}>
              <div>
                <h2 className={common.panelTitle} id="impor-mutasi">
                  Impor mutasi
                </h2>
                <p className={common.panelMeta}>
                  {data.impor.length} berkas pernah diimpor · Aktor: {profile.peran ?? "—"}
                </p>
              </div>
            </div>

            {canRekon ? (
              <ImporForm
                periode={data.periode}
                profil={data.profil.map((item) => ({
                  id: item.id,
                  nama: item.nama,
                  pemetaan: item.pemetaan,
                }))}
                rekening={data.rekening.map((item) => ({
                  id: item.id,
                  label: `${item.namaBank} · ${item.nomor}`,
                }))}
              />
            ) : (
              <p className={common.emptyState}>
                Hanya Accounting yang dapat mengimpor mutasi bank.
              </p>
            )}

            {data.impor.length > 0 ? (
              <div className={table.tableWrap}>
                <table className={table.table}>
                  <caption className={table.caption}>Riwayat impor terakhir.</caption>
                  <thead>
                    <tr>
                      <th scope="col">Berkas</th>
                      <th scope="col">Periode</th>
                      <th scope="col">Baris</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.impor.slice(0, 5).map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.namaBerkas}</th>
                        <td>{row.periode.slice(0, 7)}</td>
                        <td className={table.nominal}>{row.jumlahBaris}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>

        <section className={common.panel} aria-label="Hasil rekonsiliasi">
          <div className={common.panelCard}>
            <div className={common.panelHeader}>
              <div>
                <h2 className={common.panelTitle}>Mutasi {data.periode}</h2>
                <p className={common.panelMeta}>
                  {data.daftar.length} mutasi · {cocok} cocok · {belum} belum cocok ·
                  {" "}jendela {data.jendelaHari} hari
                </p>
              </div>
            </div>

            {data.daftar.length === 0 ? (
              <p className={common.emptyState}>
                Belum ada mutasi untuk periode ini.
              </p>
            ) : (
              <div className={table.tableWrap}>
                <table className={table.table}>
                  <caption className={table.caption}>
                    Mutasi bank, status pencocokan, dan aksi.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Tanggal</th>
                      <th scope="col">Arah</th>
                      <th scope="col">Nominal</th>
                      <th scope="col">Referensi</th>
                      <th scope="col">Status</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daftar.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.tanggal}</th>
                        <td>{row.arah === "MASUK" ? "Masuk" : "Keluar"}</td>
                        <td className={table.nominal}>
                          {formatRupiah(rupiahKeCents(row.nominal))}
                        </td>
                        <td>{row.referensi ?? "—"}</td>
                        <td>
                          {LABEL_STATUS[row.status] ?? row.status}
                          {row.alasanSelisih ? (
                            <span className={styles.reason}> · {row.alasanSelisih}</span>
                          ) : null}
                        </td>
                        <td>
                          {canRekon ? (
                            <MutasiRowActions
                              mutasiId={row.id}
                              opsi={data.jurnalKas.map((item) => ({
                                id: item.detailId,
                                label: `${item.tanggal.slice(0, 10)} · ${item.nomor} · ${
                                  Number(item.debit) > 0
                                    ? formatRupiah(rupiahKeCents(item.debit))
                                    : formatRupiah(rupiahKeCents(item.kredit))
                                }`,
                              }))}
                              status={row.status}
                            />
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <hr className={common.sectionDivider} />

            <h3 className={common.panelTitle}>Sisi buku: jurnal kas belum cocok</h3>
            <p className={common.panelMeta}>
              {data.jurnalKas.length} baris jurnal akun kas tanpa mutasi pasangan.
              {data.rekeningId
                ? ` Rekening: ${labelRekening.get(data.rekeningId) ?? "—"}.`
                : ""}
            </p>

            {data.jurnalKas.length === 0 ? (
              <p className={common.emptyState}>
                Semua baris jurnal kas periode ini sudah berpasangan.
              </p>
            ) : (
              <div className={table.tableWrap}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th scope="col">Tanggal</th>
                      <th scope="col">Sumber</th>
                      <th scope="col">Debit</th>
                      <th scope="col">Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.jurnalKas.map((row) => (
                      <tr key={row.detailId}>
                        <th scope="row">{row.tanggal.slice(0, 10)}</th>
                        <td>{row.nomor}</td>
                        <td className={table.nominal}>
                          {Number(row.debit) > 0
                            ? formatRupiah(rupiahKeCents(row.debit))
                            : "—"}
                        </td>
                        <td className={table.nominal}>
                          {Number(row.kredit) > 0
                            ? formatRupiah(rupiahKeCents(row.kredit))
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
