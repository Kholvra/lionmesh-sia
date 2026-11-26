import type { Metadata } from "next";

import {
  getPemeriksaanTutupTahun,
  listPeriodeAkuntansiStatus,
  parsePeriode,
  periodeSekarang,
  type PeriodeAkuntansiStatus,
} from "@/core/ledger";
import { cekIzin } from "@/lib/auth/permissions";
import { requireSesi } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

import { susunOpsiPeriode } from "../period-options";
import laporanStyles from "../laporan.module.css";
import { DaftarPeriode } from "./components/daftar-periode";
import { AksesDitolak, PeriodeShell } from "./components/periode-shell";
import { TutupTahun } from "./components/tutup-tahun";
import styles from "./periode.module.css";

export const instant = false;

export const metadata: Metadata = {
  title: "Periode akuntansi — Lionmesh SIA",
};

interface PageProps {
  searchParams: Promise<{
    tahun?: string | string[];
    berhasil?: string | string[];
  }>;
}

export default async function PeriodePage({ searchParams }: PageProps) {
  const { profile } = await requireSesi();
  if (!cekIzin(profile.peran, "tutup_periode")) {
    return <AksesDitolak />;
  }

  const supabase = await createClient();
  const query = await searchParams;
  const sekarang = periodeSekarang();

  const rows = await listPeriodeAkuntansiStatus(supabase);
  if (!rows.ok) {
    return (
      <PeriodeShell
        deskripsi="Daftar periode bulanan dan tutup buku tahunan."
        judul="Periode akuntansi"
        profil={profile}
      >
        <p
          className={`${laporanStyles.alert} ${laporanStyles.alertDanger}`}
          role="alert"
        >
          {rows.message}
        </p>
      </PeriodeShell>
    );
  }

  const opsi = susunOpsiPeriode(rows.data, sekarang);
  const statusMap = new Map(rows.data.map((row) => [row.kunci, row]));
  const baris: PeriodeAkuntansiStatus[] = opsi.map((periode) => {
    const ada = statusMap.get(periode.kunci);
    return (
      ada ?? {
        ...periode,
        status: "belum_ada",
        dikunciAt: null,
        dikunciOleh: null,
      }
    );
  });

  const tahunParam = Array.isArray(query.tahun) ? query.tahun[0] : query.tahun;
  const tahunAngka = Number(tahunParam);
  const tahun =
    Number.isInteger(tahunAngka) &&
    tahunAngka >= 2000 &&
    tahunAngka <= 9999
      ? tahunAngka
      : sekarang.tahun;

  const pemeriksaan = await getPemeriksaanTutupTahun(supabase, tahun);

  const berhasil = Array.isArray(query.berhasil)
    ? query.berhasil[0]
    : query.berhasil;
  let pesanSukses: string | null = null;
  if (berhasil?.startsWith("tahun-")) {
    pesanSukses = `Tahun buku ${berhasil.slice("tahun-".length)} berhasil ditutup.`;
  } else if (berhasil) {
    const periodeBerhasil = parsePeriode(berhasil);
    if (periodeBerhasil.ok) {
      pesanSukses = `Periode ${periodeBerhasil.data.label} berhasil ditutup.`;
    }
  }

  const tahunOpsi = [
    ...new Set([sekarang.tahun, tahun, ...rows.data.map((row) => row.tahun)]),
  ].sort((a, b) => b - a);

  return (
    <PeriodeShell
      deskripsi="Daftar periode bulanan dan tutup buku tahunan. Setelah periode dikunci, jurnal baru ke periode itu ditolak; koreksi lewat jurnal pembalik di periode berjalan."
      judul="Periode akuntansi"
      profil={profile}
    >
      {pesanSukses ? (
        <p className={styles.alertSuccess} role="status">
          {pesanSukses}
        </p>
      ) : null}

      <section
        aria-labelledby="daftar-periode-title"
        className={styles.section}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="daftar-periode-title">
            Daftar periode
          </h2>
          <p className={styles.sectionMeta}>
            12 bulan terakhir dan periode yang sudah tersimpan
          </p>
        </div>
        <DaftarPeriode rows={baris} />
      </section>

      <section
        aria-labelledby="tutup-tahun-section"
        className={styles.section}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="tutup-tahun-section">
            Tutup buku tahunan
          </h2>
          <p className={styles.sectionMeta}>
            Operasi tahunan; tidak perlu rute terpisah
          </p>
        </div>

        <div className={styles.yearFilter}>
          <form
            action="/laporan/periode"
            className={laporanStyles.filter}
            method="get"
          >
            <div className={laporanStyles.filterField}>
              <label className={laporanStyles.filterLabel} htmlFor="tahun">
                Tahun buku
              </label>
              <select
                className={laporanStyles.select}
                defaultValue={String(tahun)}
                id="tahun"
                name="tahun"
              >
                {tahunOpsi.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <button className={styles.primaryButton} type="submit">
              Tampilkan
            </button>
          </form>
        </div>

        {pemeriksaan.ok ? (
          <TutupTahun pemeriksaan={pemeriksaan.data} />
        ) : (
          <p
            className={`${laporanStyles.alert} ${laporanStyles.alertDanger}`}
            role="alert"
          >
            {pemeriksaan.message}
          </p>
        )}
      </section>
    </PeriodeShell>
  );
}
