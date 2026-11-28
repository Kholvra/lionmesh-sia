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
import { firstParam } from "@/lib/first-param";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

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
        <Notice nada="bahaya" variant="bordered">{rows.message}</Notice>
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

  const tahunParam = firstParam(query.tahun);
  const tahunAngka = Number(tahunParam);
  const tahun =
    Number.isInteger(tahunAngka) &&
    tahunAngka >= 2000 &&
    tahunAngka <= 9999
      ? tahunAngka
      : sekarang.tahun;

  const pemeriksaan = await getPemeriksaanTutupTahun(supabase, tahun);

  const berhasil = firstParam(query.berhasil);
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
        <Notice tone="success" variant="bordered">{pesanSukses}</Notice>
      ) : null}

      <section
        aria-labelledby="daftar-periode-title"
        className={styles.section}
      >
        <div id="daftar-periode-title">
          <PageHeader
            title="Daftar periode"
            description="12 bulan terakhir dan periode yang sudah tersimpan"
            variant="section"
          />
        </div>
        <DaftarPeriode rows={baris} />
      </section>

      <section
        aria-labelledby="tutup-tahun-section"
        className={styles.section}
      >
        <div id="tutup-tahun-section">
          <PageHeader
            title="Tutup buku tahunan"
            description="Operasi tahunan; tidak perlu rute terpisah"
            variant="section"
          />
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
              <Select
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
              </Select>
            </div>
            <SubmitButton className={styles.primaryButton} type="submit">
              Tampilkan
            </SubmitButton>
          </form>
        </div>

        {pemeriksaan.ok ? (
          <TutupTahun pemeriksaan={pemeriksaan.data} />
        ) : (
          <Notice nada="bahaya" variant="bordered">{pemeriksaan.message}</Notice>
        )}
      </section>
    </PeriodeShell>
  );
}
