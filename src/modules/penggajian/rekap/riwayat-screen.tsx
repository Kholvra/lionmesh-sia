import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import type { StatusOption } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { getPeriodeDipilih } from "@/modules/penggajian/presensi/queries";
import { aksesRekap } from "@/modules/penggajian/rekap/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { ALUR_REKAP, langkahRekap, Stepper } from "@/modules/penggajian/shared/stepper";

type Peristiwa = { label: string; tone: StatusOption["tone"] };

/** Names each period transition the way the prototype timeline does. */
function peristiwa(r: RiwayatStatus): Peristiwa {
  if (r.dari === null) return { label: "Dibuka", tone: "neutral" };
  if (r.dari === "TERBUKA" && r.ke === "REKAP") return { label: "Disimpan", tone: "info" };
  if (r.dari === "REKAP" && r.ke === "REKAP") return { label: "Divalidasi", tone: "success" };
  if (r.ke === "TERVALIDASI") return { label: "Tervalidasi", tone: "success" };
  if (r.dari === "REKAP" && r.ke === "TERBUKA") {
    return r.alasan?.startsWith("Dikembalikan") ? { label: "Dikembalikan", tone: "danger" } : { label: "Dibuka kembali", tone: "warning" };
  }
  return { label: "Dibuka ulang", tone: "warning" };
}

async function Konten({ periodeId }: { periodeId?: string }) {
  const sesi = await sesiPenggajian();
  const judul = <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, "GJ-003 Memvalidasi presensi dan lembur"]} title="Riwayat rekap" variant="page" />;
  if (!(await aksesRekap(sesi)).bolehMembaca) return <>{judul}<TidakBerwenang pesan="Riwayat rekap dibuka HR dan Supervisor Lapangan." /></>;
  const periode = await getPeriodeDipilih(periodeId);
  if (!periode) return <>{judul}<Keadaan judul="Belum ada riwayat rekap" pesan="Riwayat terisi setelah HR menyimpan rekap pertama periode ini." /></>;
  return (
    <>
      <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, "GJ-003 Memvalidasi presensi dan lembur"]} description={`Periode ${periode.nama}`} title="Riwayat rekap" variant="page" />
      <div className={ui.stack}>
        <Stepper aktif={langkahRekap(periode.status)} langkah={ALUR_REKAP} />
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Linimasa keputusan</h2>
          <ol className={ui.linimasa}>
            {periode.riwayat.map((r) => {
              const p = peristiwa(r);
              return (
                <li data-tone={p.tone} key={r.id}>
                  <span className={ui.linimasaKepala}>
                    <strong>{r.oleh}</strong>
                    <StatusBadge status="x" statuses={[{ value: "x", label: p.label, tone: p.tone }]} />
                    <span className={ui.timelineMeta}>{formatWaktu(r.pada)}</span>
                  </span>
                  {r.alasan ? <span>{r.alasan}</span> : null}
                </li>
              );
            })}
          </ol>
        </section>
        <div><Link className={ui.button} href={`/penggajian/rekap?periode=${periode.id}`}>← Kembali ke rekap</Link></div>
      </div>
    </>
  );
}

export function RiwayatRekapScreen({ periodeId }: { periodeId?: string }) {
  return (
    <Suspense fallback={<PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, "GJ-003 Memvalidasi presensi dan lembur"]} title="Riwayat rekap" variant="page" />}>
      <Konten periodeId={periodeId} />
    </Suspense>
  );
}
