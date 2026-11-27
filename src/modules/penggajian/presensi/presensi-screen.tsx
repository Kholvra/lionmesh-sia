import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import { rentangPeriode } from "@/modules/penggajian/periode/rules";
import { STATUS_PERIODE } from "@/modules/penggajian/periode/status";
import { clockIn, clockOut } from "@/modules/penggajian/presensi/actions";
import { aksesPresensi } from "@/modules/penggajian/presensi/akses";
import { AbsenTombol } from "@/modules/penggajian/presensi/components/absen-tombol";
import { PilihPeriode } from "@/modules/penggajian/presensi/components/pilih-periode";
import { getPeriodeDipilih, getPresensiHariIni, listPeriode, listPresensi } from "@/modules/penggajian/presensi/queries";
import type { PresensiView } from "@/modules/penggajian/presensi/queries";
import { LABEL_KEHADIRAN, LABEL_SUMBER, STATUS_ENTRI } from "@/modules/penggajian/presensi/status";
import type { Presensi } from "@/modules/penggajian/presensi/types";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { TabelData, TabelMemuat } from "@/modules/penggajian/shared/tabel-data";
import { formatJam, jamSekarangJakarta } from "@/modules/penggajian/shared/waktu";
import type { BarisTabel, KolomTabel } from "@/modules/penggajian/shared/tabel-data";

const ITEM = "GJ-002 Mencatat presensi dan lembur";

const KOLOM: readonly KolomTabel[] = [
  { id: "tanggal", header: "Tanggal", urut: true },
  { id: "karyawan", header: "Karyawan", urut: true },
  { id: "kehadiran", header: "Kehadiran" },
  { id: "jam", header: "Masuk – pulang" },
  { id: "sumber", header: "Dicatat oleh" },
  { id: "status", header: "Status" },
];

function jam(row: Presensi) {
  if (row.kehadiran !== "HADIR") return "—";
  return `${row.jamMasuk ?? "—"} – ${row.jamPulang ?? "belum absen pulang"}`;
}

function baris(rows: PresensiView[]): BarisTabel[] {
  return rows.map((row) => ({
    key: row.id,
    nilaiUrut: { tanggal: row.tanggal, karyawan: row.orang.nama },
    cells: {
      tanggal: formatTanggal(row.tanggal),
      karyawan: `${row.orang.nama} · ${row.orang.departemen}`,
      kehadiran: LABEL_KEHADIRAN[row.kehadiran],
      jam: <span className={ui.numeric}>{jam(row)}</span>,
      sumber: `${LABEL_SUMBER[row.sumber]} · ${row.dicatatOleh}`,
      status: <StatusBadge status={row.status} statuses={STATUS_ENTRI} />,
    },
  }));
}

const LABEL_STATUS_SINGKAT: Record<string, string> = {
  MENUNGGU_VALIDASI_SUPERVISOR: "Menunggu validasi",
  TERVALIDASI: "Tervalidasi",
};

function RiwayatSaya({ rows }: { rows: Presensi[] }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Riwayat presensi</h2>
      {rows.length === 0 ? (
        <p className={ui.cardHint}>Belum ada presensi tercatat.</p>
      ) : (
        <table className={ui.table}>
          <caption className="sr-only">Riwayat presensi saya</caption>
          <thead>
            <tr><th scope="col">Tanggal</th><th scope="col">Masuk</th><th scope="col">Pulang</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatTanggal(row.tanggal)}</td>
                <td className={ui.numeric}>{row.kehadiran === "HADIR" ? formatJam(row.jamMasuk) : LABEL_KEHADIRAN[row.kehadiran]}</td>
                <td className={ui.numeric}>{row.kehadiran === "HADIR" ? formatJam(row.jamPulang) : "—"}</td>
                <td>
                  <StatusBadge
                    status={row.status}
                    statuses={STATUS_ENTRI.map((s) => ({ ...s, label: LABEL_STATUS_SINGKAT[s.value] ?? s.label }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function keadaanHariIni(presensi: Presensi | undefined, sekarang: string) {
  if (!presensi) return { angka: `${formatJam(sekarang)} WIB`, status: "Belum absen masuk" };
  if (!presensi.jamPulang) return { angka: `Masuk ${formatJam(presensi.jamMasuk)} WIB`, status: "Sudah absen masuk" };
  return { angka: `${formatJam(presensi.jamMasuk)} sampai ${formatJam(presensi.jamPulang)}`, status: "Presensi hari ini lengkap" };
}

async function PresensiMandiri({ pesan }: { pesan?: string }) {
  const sesi = await sesiPenggajian();
  const data = await getPresensiHariIni(sesi);
  if (!data) {
    return <Keadaan judul="Akun belum terhubung ke data karyawan" pesan="Hubungi HR agar akun Anda dihubungkan ke NIK Anda." peringatan />;
  }
  const { presensi, periode } = data;
  const terbuka = periode?.status === "TERBUKA";
  const keadaan = keadaanHariIni(presensi, jamSekarangJakarta());
  const lengkap = Boolean(presensi?.jamPulang);
  return (
    <div className={ui.stack}>
      {pesan === "dibatalkan" ? <Notice title="Pengajuan lembur dibatalkan." tone="success" /> : null}
      {presensi && !lengkap ? <Notice title={`Absen masuk tercatat untuk ${formatTanggal(data.tanggal)}.`} tone="success" /> : null}
      {lengkap ? (
        <Notice title={`Absen pulang tercatat ${formatJam(presensi?.jamPulang ?? null)}. Jika hari ini Anda lembur, ajukan lembur dengan nomor SPL dari atasan.`} tone="warning" />
      ) : null}
      {!terbuka ? <Notice title="Periode ini sudah ditutup. Presensi baru ditolak; untuk koreksi, hubungi HR." tone="warning" /> : null}
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Presensi hari ini</h2>
        <div className={ui.duaKolom}>
          <div className={ui.stack}>
            <span className={ui.cardHint}>{formatTanggal(data.tanggal)} · WIB</span>
            <p className={ui.angkaBesar}>{keadaan.angka}</p>
            <p className={ui.teksTebal}>{keadaan.status}</p>
            {terbuka && !presensi ? <div><AbsenTombol aksi={clockIn} label="Absen masuk" /></div> : null}
            {terbuka && presensi && !lengkap ? <div><AbsenTombol aksi={clockOut} label="Absen pulang" /></div> : null}
          </div>
          <div className={ui.stack}>
            <p className={ui.teksTebal}>{data.orang.nama} / {data.orang.nik}</p>
            <span>{data.orang.departemen} · {data.orang.jabatan}</span>
            <span className={ui.cardHint}>{periode ? `Periode ${periode.nama} · ${rentangPeriode(periode)}` : "Di luar periode penggajian"}</span>
          </div>
        </div>
      </section>
      <RiwayatSaya rows={data.riwayat} />
      <div className={ui.formActions}>
        <Link className={lengkap ? ui.buttonPrimary : ui.button} href="/penggajian/lembur/ajukan">Ajukan lembur</Link>
        <Link className={ui.button} href="/penggajian/lembur">Lihat pengajuan saya</Link>
      </div>
    </div>
  );
}

async function DaftarPresensi({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  const akses = aksesPresensi(sesi);
  if (!akses.bolehMembaca) {
    return <TidakBerwenang pesan="Presensi hanya bisa dibuka HR, Supervisor Lapangan untuk departemennya, dan karyawan untuk dirinya sendiri." />;
  }
  if (akses.mandiri) return <PresensiMandiri pesan={pesan} />;
  const periode = await getPeriodeDipilih(periodeId);
  if (!periode) return <Keadaan judul="Belum ada periode penggajian" pesan="Periode dibuat HR sebelum presensi bisa dicatat." />;
  const rows = await listPresensi(sesi, periode);
  return (
    <div className={ui.stack}>
      {pesan === "dicatat" ? <Notice title="Presensi tersimpan dan menunggu validasi Supervisor." tone="success" /> : null}
      {pesan === "dikoreksi" ? <Notice title="Koreksi tersimpan. Periode kembali Terbuka; simpan rekap ulang setelah semua perbaikan selesai." tone="success" /> : null}
      <div className={ui.cardHeader}>
        <PilihPeriode action="/penggajian/presensi" dipilih={periode.id} periode={await listPeriode()} />
        {akses.bolehCatatAtasNama ? (
          <Link className={ui.buttonPrimary} href="/penggajian/presensi/catat">Catat atas nama karyawan</Link>
        ) : null}
      </div>
      <section className={ui.card}>
        <div className={ui.cardHeader}>
          <h2 className={ui.cardTitle}>{periode.nama} · {rentangPeriode(periode)}</h2>
          <StatusBadge status={periode.status} statuses={STATUS_PERIODE} />
        </div>
        {rows.length === 0 ? (
          <Keadaan judul="Belum ada presensi pada periode ini" pesan="Presensi muncul setelah karyawan absen, HR mencatat atas nama karyawan, atau data mesin diimpor." />
        ) : (
          <TabelData baris={baris(rows)} caption={`Presensi ${periode.nama}`} kolom={KOLOM} pesanKosong="Tidak ada presensi." />
        )}
      </section>
    </div>
  );
}

export function PresensiScreen({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  return (
    <>
      <PageHeader
        description="Presensi harian terpisah dari pengajuan lembur. Identitas diambil dari akun."
        item={ITEM}
        title="Presensi & lembur"
      />
      <Suspense fallback={<TabelMemuat caption="Memuat presensi" kolom={KOLOM} />}>
        <DaftarPresensi periodeId={periodeId} pesan={pesan} />
      </Suspense>
    </>
  );
}
