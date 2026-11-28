import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import type { StatusOption } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import { labelStatusPeriode, rentangPeriode, sudahTervalidasi } from "@/modules/penggajian/periode/rules";
import { getPeriodeDipilih } from "@/modules/penggajian/presensi/queries";
import { LABEL_KEHADIRAN, STATUS_ENTRI } from "@/modules/penggajian/presensi/status";
import { returnRekap } from "@/modules/penggajian/rekap/actions";
import { aksesRekap, getRekap, getRekapKaryawan } from "@/modules/penggajian/rekap/queries";
import type { RekapKaryawan } from "@/modules/penggajian/rekap/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { KartuBaca } from "@/modules/penggajian/shared/bidang-baca";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { ALUR_REKAP, langkahRekap, Stepper } from "@/modules/penggajian/shared/stepper";
import { formatDurasi, formatJam } from "@/modules/penggajian/shared/waktu";

const ITEM = "GJ-003 Memvalidasi presensi dan lembur";
const TOLAK = "Rekap dibuka HR untuk seluruh karyawan dan Supervisor Lapangan untuk departemennya.";
const chip = (label: string, tone: StatusOption["tone"]) => <StatusBadge status="x" statuses={[{ value: "x", label, tone }]} />;

function TabelPerTanggal({ k }: { k: RekapKaryawan }) {
  // As in the prototype: only dates worth a look, the rest summarised in one line.
  const penting = k.presensi.filter(
    (p) => p.kehadiran !== "HADIR" || !p.jamPulang || k.lembur.some((l) => l.tanggal === p.tanggal),
  );
  const lain = k.presensi.length - penting.length;
  return (
    <>
    <table className={ui.table}>
      <caption className="sr-only">Presensi dan lembur per tanggal {k.nama}</caption>
      <thead>
        <tr><th scope="col">Tanggal</th><th scope="col">Masuk</th><th scope="col">Pulang</th><th scope="col">Jam lembur</th><th scope="col">Nomor SPL</th><th scope="col">Kehadiran</th><th scope="col">Status</th></tr>
      </thead>
      <tbody>
        {penting.map((p) => {
          const l = k.lembur.filter((x) => x.tanggal === p.tanggal);
          return (
            <tr key={p.id}>
              <td>{formatTanggal(p.tanggal)}</td>
              <td className={ui.numeric}>{p.kehadiran === "HADIR" ? formatJam(p.jamMasuk) : "—"}</td>
              <td className={ui.numeric}>{p.kehadiran === "HADIR" ? formatJam(p.jamPulang) : "—"}</td>
              <td>{l.length ? formatDurasi(l.reduce((t, x) => t + x.menit, 0)) : "—"}</td>
              <td>{l.length ? l.map((x) => x.nomorSpl).join(", ") : "—"}</td>
              <td>{LABEL_KEHADIRAN[p.kehadiran]}</td>
              <td><StatusBadge status={p.status} statuses={STATUS_ENTRI} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
    {lain > 0 ? <p className={ui.cardHint}>{lain} tanggal lain hadir lengkap, tanpa lembur.</p> : null}
    </>
  );
}

async function DetailKonten({ karyawanId, periodeId }: { karyawanId: string; periodeId?: string }) {
  const sesi = await sesiPenggajian();
  const akses = await aksesRekap(sesi);
  const judul = <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Detail rekap" variant="page" />;
  if (!akses.bolehMembaca) return <>{judul}<TidakBerwenang pesan={TOLAK} /></>;
  const periode = await getPeriodeDipilih(periodeId);
  const data = periode ? await getRekapKaryawan(sesi, periode, karyawanId) : null;
  if (!periode || !data) return <>{judul}<Keadaan judul="Rekap karyawan tidak ditemukan" pesan="Karyawan mungkin di luar departemen Anda atau tidak aktif pada periode ini." /></>;
  const { karyawan: k, departemen } = data;
  const tervalidasi = sudahTervalidasi(periode.status) || Boolean(departemen.validasi);
  const statusPresensi = tervalidasi ? chip("Tervalidasi", "success") : periode.status === "REKAP" ? chip("Menunggu validasi", "warning") : chip("Belum direkap", "neutral");
  const kembali = `/penggajian/rekap?periode=${periode.id}`;
  return (
    <>
      <PageHeader
        back={{ href: kembali, label: akses.hr ? "Rekap presensi & lembur" : "Kembali ke validasi rekap" }}
        description={`${k.nik} · ${departemen.nama} · Periode ${rentangPeriode(periode)}`}
        breadcrumb={[{ label: "Siklus Penggajian", accent: true }, akses.hr ? "GJ-003 Merekap presensi dan lembur" : ITEM]}
        variant="page"
        title={`Detail rekap / ${k.nama}`}
      />
      <div className={ui.stack}>
        <Stepper aktif={langkahRekap(periode.status)} langkah={ALUR_REKAP} />
        {akses.hr ? (
          <>
            <KartuBaca bidang={[["Nama", k.nama], ["NIK", k.nik], ["Departemen", departemen.nama], ["Periode kerja", rentangPeriode(periode)]]} judul="Identitas karyawan" />
            <KartuBaca
              bidang={[
                ["Kehadiran tercatat", `${k.jumlah.HADIR} hari hadir · ${k.jumlah.IZIN} izin · ${k.jumlah.SAKIT} sakit · ${k.jumlah.ALPHA} alpha · ${k.jumlah.CUTI} cuti`],
                ["Status presensi", tervalidasi ? "Tervalidasi" : "Menunggu validasi Supervisor"],
                ["Lembur", k.lemburMenit ? `${formatDurasi(k.lemburMenit)} · ${k.nomorSpl.join(", ")}` : "Tidak ada lembur"],
                ["Status rekap", `Periode ${labelStatusPeriode(periode.status)}${departemen.validasi ? ` · divalidasi ${departemen.validasi.oleh}` : ""}`],
              ]}
              judul="Rincian presensi dan lembur"
            />
          </>
        ) : (
          <section className={ui.card}>
            <h2 className={ui.cardTitle}>Ringkasan pemeriksaan</h2>
            <dl className={ui.facts}>
              <div className={ui.fact}><dt>Presensi</dt><dd>{statusPresensi}</dd></div>
              <div className={ui.fact}><dt>Lembur</dt><dd>{chip(k.lembur.length ? `${k.lembur.length} pengajuan · ${formatDurasi(k.lemburMenit)}` : "Tidak ada lembur", "neutral")}</dd></div>
              <div className={ui.fact}><dt>Nomor SPL</dt><dd>{k.nomorSpl.length ? k.nomorSpl.map((s) => <span key={s}>{chip(s, "neutral")} </span>) : "—"}</dd></div>
            </dl>
            <p className={ui.cardHint}>Hanya baca. Validasi atau pengembalian berlaku untuk seluruh rekap departemen di halaman Validasi rekap.</p>
          </section>
        )}
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Presensi & lembur per tanggal</h2>
          <p className={ui.cardHint}>Periode {rentangPeriode(periode)} · {k.jumlah.HADIR} hari hadir · {k.lembur.length} pengajuan lembur</p>
          <TabelPerTanggal k={k} />
        </section>
        <div><Link className={ui.button} href={kembali}>← {akses.hr ? "Kembali ke rekap" : "Kembali ke validasi rekap"}</Link></div>
      </div>
    </>
  );
}

export function RekapKaryawanScreen({ karyawanId, periodeId }: { karyawanId: string; periodeId?: string }) {
  return (
    <Suspense fallback={<PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Detail rekap" variant="page" />}>
      <DetailKonten karyawanId={karyawanId} periodeId={periodeId} />
    </Suspense>
  );
}

async function KembalikanKonten({ departemenId, periodeId }: { departemenId?: string; periodeId?: string }) {
  const sesi = await sesiPenggajian();
  const akses = await aksesRekap(sesi);
  const periode = await getPeriodeDipilih(periodeId);
  const departemen = periode ? (await getRekap(sesi, periode)).find((dep) => dep.id === departemenId) : undefined;
  if (akses.hr || !departemen || !periode) return <TidakBerwenang pesan="Hanya Supervisor Lapangan yang mengembalikan rekap departemennya." />;
  return (
    <>
      <Stepper aktif={langkahRekap(periode.status)} langkah={ALUR_REKAP} />
      <FormAksi
        aksi={returnRekap}
        atas={<KartuBaca bidang={[["Rekap", `${periode.nama} · Departemen ${departemen.nama}`]]} judul="Pengembalian rekap" />}
        batalHref={`/penggajian/rekap?periode=${periode.id}`}
        isian={[{ name: "alasan", label: "Alasan pengembalian", wajib: true, lebar: true, contoh: "SPL/PRD/XI/019 milik Agus tertulis 1 jam, di rekap 2 jam." }]}
        judul="Alasan"
        kirimLabel="Kembalikan ke HR"
        petunjuk="Setelah dikembalikan, periode kembali Terbuka untuk semua departemen dan validasi departemen lain dihapus untuk diulang."
        tersembunyi={{ periodeId: periode.id, departemenId: departemen.id }}
      />
    </>
  );
}

export function KembalikanRekapScreen({ departemenId, periodeId }: { departemenId?: string; periodeId?: string }) {
  return (
    <>
      <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} description="Alasan wajib. HR memperbaiki data lalu menyimpan rekap ulang." title="Kembalikan rekap ke HR" variant="page" />
      <div className={ui.stack}>
        <Suspense fallback={null}>
          <KembalikanKonten departemenId={departemenId} periodeId={periodeId} />
        </Suspense>
      </div>
    </>
  );
}
