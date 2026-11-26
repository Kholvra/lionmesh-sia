import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPemeriksaanTutupPeriode, parsePeriode } from "@/core/ledger";
import { cekIzin } from "@/lib/auth/permissions";
import { requireSesi } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

import laporanStyles from "../../../laporan.module.css";
import { FormTutupPeriode } from "../../components/form-tutup-periode";
import { KartuPemeriksaanPeriode } from "../../components/kartu-pemeriksaan-periode";
import { AksesDitolak, PeriodeShell } from "../../components/periode-shell";
import styles from "../../periode.module.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Tutup periode — Lionmesh SIA",
};

interface PageProps {
  params: Promise<{ periode: string }>;
}

export default async function TutupPeriodePage({ params }: PageProps) {
  const { profile } = await requireSesi();
  if (!cekIzin(profile.peran, "tutup_periode")) {
    return <AksesDitolak />;
  }

  const { periode: kunci } = await params;
  const periode = parsePeriode(kunci);
  if (!periode.ok) notFound();

  const supabase = await createClient();
  const hasil = await getPemeriksaanTutupPeriode(supabase, periode.data);

  if (!hasil.ok) {
    return (
      <PeriodeShell
        deskripsi="Periksa prasyarat sebelum mengunci jurnal periode ini."
        judul={`Tutup periode ${periode.data.label}`}
        kembali={{ href: "/laporan/periode", label: "Periode akuntansi" }}
        profil={profile}
      >
        <p
          className={`${laporanStyles.alert} ${laporanStyles.alertDanger}`}
          role="alert"
        >
          {hasil.message}
        </p>
      </PeriodeShell>
    );
  }

  const data = hasil.data;

  return (
    <PeriodeShell
      breadcrumb="Umum / C-010 Menutup periode"
      deskripsi="Periksa prasyarat sebelum mengunci jurnal periode ini. Setelah ditutup, periode tidak bisa dibuka kembali."
      judul={`Tutup periode ${data.periode.label}`}
      kembali={{ href: "/laporan/periode", label: "Periode akuntansi" }}
      profil={profile}
    >
      <KartuPemeriksaanPeriode data={data} />

      <section className={styles.warning} aria-labelledby="peringatan-tutup">
        <h2 className={styles.warningTitle} id="peringatan-tutup">
          Tidak bisa dibuka kembali
        </h2>
        <p className={styles.warningText}>
          Koreksi setelah ditutup dibuat sebagai jurnal pembalik di periode
          berjalan. Jurnal penutup ke 302 Laba ditahan hanya dibuat saat tutup
          buku tahunan.
        </p>
      </section>

      {!data.bisaDitutup ? (
        <ul className={styles.reasonList}>
          {data.alasan.map((alasan) => (
            <li key={alasan}>{alasan}</li>
          ))}
        </ul>
      ) : null}

      <FormTutupPeriode
        bisaDitutup={data.bisaDitutup}
        periode={data.periode.kunci}
      />
    </PeriodeShell>
  );
}
