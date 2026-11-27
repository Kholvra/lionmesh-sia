import { formatRupiah } from "@/lib/format/number";
import common from "../../permintaan/permintaan.module.css";
import type { Perbandingan } from "../perbandingan";
import styles from "../pemilihan.module.css";

type PemasokKolom = { id: string; nama: string };

type Props = {
  perbandingan: Perbandingan;
  pemasok: readonly PemasokKolom[];
  namaBarang: (itemId: string) => string;
  namaSatuan: (satuanId: string) => string;
};

export function PerbandinganTable({
  namaBarang,
  namaSatuan,
  pemasok,
  perbandingan,
}: Props) {
  const kolom = pemasok.filter((item) =>
    perbandingan.pemasokIds.includes(item.id),
  );

  if (kolom.length === 0) {
    return (
      <p className={common.emptyState}>
        Belum ada harga pembanding. Isi harga per barang dan pemasok untuk mulai
        membandingkan.
      </p>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Harga net sebelum PPN per barang. Tanda “terendah” berarti harga terkecil
          untuk barang itu.
        </caption>
        <thead>
          <tr>
            <th scope="col">Barang</th>
            {kolom.map((item) => (
              <th key={item.id} scope="col">
                {item.nama}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perbandingan.baris.map((baris) => (
            <tr key={baris.itemId}>
              <th scope="row">
                {namaBarang(baris.itemId)}
                <span className={styles.qty}>
                  {baris.qty} {namaSatuan(baris.satuanId)}
                </span>
              </th>
              {kolom.map((item) => {
                const harga = baris.harga.get(item.id);
                const termurah = baris.termurah.has(item.id);
                return (
                  <td
                    className={termurah ? styles.termurahCell : undefined}
                    key={item.id}
                  >
                    {harga === undefined ? "—" : formatRupiah(harga)}
                    {termurah ? <span className={styles.mark}>terendah</span> : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total per pemasok</th>
            {kolom.map((item) => {
              const total = perbandingan.total.find(
                (baris) => baris.pemasokId === item.id,
              );
              return (
                <td
                  className={total?.termurah ? styles.termurahCell : undefined}
                  key={item.id}
                >
                  {total?.total ? formatRupiah(total.total) : "Belum lengkap"}
                  {total?.termurah ? (
                    <span className={styles.mark}>terendah</span>
                  ) : null}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
