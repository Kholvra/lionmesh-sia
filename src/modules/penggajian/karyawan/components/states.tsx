import Link from "next/link";

import { ui } from "@/modules/penggajian/ui/kelas";

export function TidakBerwenang() {
  return (
    <section className={`${ui.card} ${ui.empty}`} role="alert">
      <h2 className={ui.cardTitle}>Anda tidak punya akses ke data karyawan</h2>
      <p>Data karyawan hanya bisa dibuka oleh HR, Accounting, dan Finance. Hubungi HR bila Anda membutuhkannya.</p>
    </section>
  );
}

export function KaryawanTidakDitemukan() {
  return (
    <section className={`${ui.card} ${ui.empty}`} role="status">
      <h2 className={ui.cardTitle}>Karyawan tidak ditemukan</h2>
      <p>Data mungkin sudah dipindahkan atau tautannya salah.</p>
      <Link className={ui.button} href="/penggajian/karyawan">
        Kembali ke data karyawan
      </Link>
    </section>
  );
}

export function BelumAdaKaryawan({ bolehTambah }: { bolehTambah: boolean }) {
  return (
    <div className={ui.empty} role="status">
      <h3 className={ui.cardTitle}>Belum ada data karyawan</h3>
      <p>Tambahkan karyawan pertama agar presensi dan penggajian bisa dicatat.</p>
      {bolehTambah ? (
        <Link className={ui.buttonPrimary} href="/penggajian/karyawan/tambah">
          Tambah karyawan
        </Link>
      ) : null}
    </div>
  );
}
