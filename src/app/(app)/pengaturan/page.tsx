import Link from "next/link";

import { requireSesi } from "@/lib/auth/server";
import { cekIzin } from "@/lib/auth/permissions";
import {
  PATH_MASTER_GUDANG,
  PATH_MASTER_MATA_UANG,
  PATH_MASTER_PRODUK,
  PATH_MASTER_SATUAN,
} from "@/modules/core/master/constants";

import styles from "./page.module.css";

export const instant = false;

const MASTER = [
  {
    href: PATH_MASTER_PRODUK,
    judul: "Produk",
    meta: "Kode, nama, tipe, satuan dasar, dan kategori. Dikelola Produksi.",
    aksi: "kelola_data_produk",
  },
  {
    href: PATH_MASTER_SATUAN,
    judul: "Satuan dan konversi",
    meta: "Satuan dasar lintas siklus dan faktor konversinya. Dikelola Produksi.",
    aksi: "kelola_satuan",
  },
  {
    href: PATH_MASTER_GUDANG,
    judul: "Gudang",
    meta: "Gudang bahan dan barang jadi. Dikelola Gudang.",
    aksi: "kelola_gudang",
  },
  {
    href: PATH_MASTER_MATA_UANG,
    judul: "Mata uang dan kurs",
    meta: "Master mata uang dan kurs; transaksi tetap IDR. Dikelola Accounting.",
    aksi: "kelola_mata_uang",
  },
] as const;

export default async function PengaturanPage() {
  const { user, profile } = await requireSesi();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>Pengaturan</p>
          <h1 className={styles.title}>Akun saya</h1>
          <p className={styles.description}>
            Informasi akun dan peran yang digunakan untuk mengakses SIA.
          </p>
        </div>
      </header>

      <section className={styles.card} aria-labelledby="account-title">
        <h2 className={styles.sectionTitle} id="account-title">
          Informasi akun
        </h2>
        <dl className={styles.details}>
          <div className={styles.detail}>
            <dt>Email akun</dt>
            <dd>{user.email ?? "Email tidak tersedia"}</dd>
          </div>
          <div className={styles.detail}>
            <dt>Peran</dt>
            <dd>{profile.peran ?? "Belum memiliki peran"}</dd>
          </div>
          <div className={styles.detail}>
            <dt>Status akun</dt>
            <dd>Aktif</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card} aria-labelledby="master-title">
        <h2 className={styles.sectionTitle} id="master-title">
          Master data
        </h2>
        <ul className={styles.masterGrid}>
          {MASTER.map((item) => (
            <li key={item.href}>
              <Link className={styles.masterLink} href={item.href}>
                <span className={styles.masterLinkTitle}>{item.judul}</span>
                <span className={styles.masterLinkMeta}>{item.meta}</span>
                <span className={styles.masterLinkMeta}>
                  {cekIzin(profile.peran, item.aksi)
                    ? "Anda dapat mengubah master ini"
                    : "Hanya baca"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
