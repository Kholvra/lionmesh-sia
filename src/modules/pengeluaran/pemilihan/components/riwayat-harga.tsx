import type { RiwayatHarga } from "@/core/pengadaan";
import { formatRupiah } from "@/lib/format/number";
import { formatTanggalSingkat } from "../../permintaan/format";
import common from "../../permintaan/permintaan.module.css";
import styles from "../pemilihan.module.css";

type Props = {
  riwayat: readonly RiwayatHarga[];
  namaBarang: (produkId: string) => string;
};

export function RiwayatHargaTable({ namaBarang, riwayat }: Props) {
  if (riwayat.length === 0) {
    return (
      <p className={common.emptyState}>
        Belum ada riwayat harga untuk barang di permintaan ini.
      </p>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Riwayat harga semua permintaan untuk barang yang sama.
        </caption>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Barang</th>
            <th scope="col">Pemasok</th>
            <th scope="col">Harga net</th>
          </tr>
        </thead>
        <tbody>
          {riwayat.map((baris) => (
            <tr key={baris.id}>
              <td>{formatTanggalSingkat(baris.tanggal)}</td>
              <td>{namaBarang(baris.produkId)}</td>
              <td>{baris.pemasokNama}</td>
              <td className={styles.nominal}>{formatRupiah(baris.harga)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
