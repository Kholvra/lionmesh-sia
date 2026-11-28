import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import type { StatusOption } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatTanggal, formatWaktu } from "@/modules/penggajian/karyawan/format";
import { rentangPeriode } from "@/modules/penggajian/periode/rules";
import { cancelLembur } from "@/modules/penggajian/presensi/actions";
import { aksesPresensi } from "@/modules/penggajian/presensi/akses";
import { PilihPeriode } from "@/modules/penggajian/presensi/components/pilih-periode";
import { getLembur, getPeriodeDipilih, listLembur, listPeriode } from "@/modules/penggajian/presensi/queries";
import type { LemburView } from "@/modules/penggajian/presensi/queries";
import { LABEL_SUMBER, STATUS_ENTRI } from "@/modules/penggajian/presensi/status";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { KartuBaca } from "@/modules/penggajian/shared/bidang-baca";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { RiwayatTabel } from "@/modules/penggajian/shared/riwayat-tabel";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { TabelData, TabelMemuat } from "@/modules/penggajian/shared/tabel-data";
import type { BarisTabel, KolomTabel } from "@/modules/penggajian/shared/tabel-data";
import { formatDurasi } from "@/modules/penggajian/shared/waktu";

const ITEM = "GJ-002 Mencatat presensi dan lembur";
const TOLAK_AKSES = "Lembur hanya bisa dibuka HR, Supervisor Lapangan untuk departemennya, dan pemohon sendiri.";
const BELUM: readonly StatusOption[] = [{ value: "BELUM", label: "Belum divalidasi", tone: "neutral" }];

const KOLOM: readonly KolomTabel[] = [
  { id: "spl", header: "Nomor SPL" },
  { id: "karyawan", header: "Karyawan", urut: true },
  { id: "durasi", header: "Jam lembur" },
  { id: "status", header: "Status" },
  { id: "tanggal", header: "Tanggal", urut: true },
  { id: "aksi", header: "Aksi", align: "right" },
];

function baris(rows: LemburView[]): BarisTabel[] {
  return rows.map((row) => ({
    key: row.id,
    nilaiUrut: { tanggal: row.tanggal, karyawan: row.orang.nama },
    cells: {
      spl: row.nomorSpl,
      karyawan: row.orang.nama,
      durasi: formatDurasi(row.menit),
      status: <StatusBadge status={row.status} statuses={STATUS_ENTRI} />,
      tanggal: formatTanggal(row.tanggal),
      aksi: <Link className={ui.buttonSmall} href={`/penggajian/lembur/${row.id}`}>Lihat detail</Link>,
    },
  }));
}

async function DaftarLembur({ periodeId }: { periodeId?: string }) {
  const sesi = await sesiPenggajian();
  const akses = aksesPresensi(sesi);
  if (!akses.bolehMembaca) return <TidakBerwenang pesan={TOLAK_AKSES} />;
  const periode = akses.mandiri ? undefined : await getPeriodeDipilih(periodeId);
  const rows = await listLembur(sesi, periode);
  const kolom = akses.mandiri ? KOLOM.filter((k) => k.id !== "karyawan") : KOLOM;
  const menunggu = rows.filter((r) => r.status === "MENUNGGU_VALIDASI_SUPERVISOR").length;
  return (
    <div className={ui.stack}>
      {periode ? <PilihPeriode action="/penggajian/lembur" dipilih={periode.id} periode={await listPeriode()} /> : null}
      {akses.mandiri && menunggu > 0 ? (
        <Notice title={`${menunggu} pengajuan masih menunggu validasi Supervisor dan masih bisa dibatalkan.`} tone="warning" />
      ) : null}
      {rows.length === 0 ? (
        <>
          <Notice title="Belum ada pengajuan lembur pada periode ini." tone="warning" />
          <Keadaan
            aksi={akses.bolehAjukanLembur ? { href: "/penggajian/lembur/ajukan", label: "Ajukan lembur", utama: true } : undefined}
            judul="Belum ada pengajuan lembur"
            pesan="Ajukan lembur dengan nomor SPL dari atasan. Pengajuan menunggu validasi Supervisor saat rekap."
          />
        </>
      ) : (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Riwayat lembur</h2>
          <TabelData baris={baris(rows)} caption="Riwayat lembur" kolom={kolom} pesanKosong="Tidak ada pengajuan." />
        </section>
      )}
      {rows.length > 0 ? (
        <div className={ui.formActions}>
          {akses.bolehAjukanLembur ? <Link className={ui.button} href="/penggajian/lembur/ajukan">Ajukan lembur baru</Link> : null}
          {akses.mandiri ? <Link className={ui.button} href="/penggajian/presensi">← Kembali ke presensi</Link> : null}
        </div>
      ) : null}
    </div>
  );
}

export function LemburListScreen({ periodeId }: { periodeId?: string }) {
  return (
    <>
      <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} description="Pengajuan yang sudah tervalidasi tidak bisa dibatalkan. Untuk koreksi, hubungi HR." title="Pengajuan saya" variant="page" />
      <Suspense fallback={<TabelMemuat caption="Memuat lembur" kolom={KOLOM} />}>
        <DaftarLembur periodeId={periodeId} />
      </Suspense>
    </>
  );
}

const PESAN: Record<string, string> = {
  diajukan: "Pengajuan lembur terkirim. Menunggu validasi Supervisor saat rekap periode.",
  dibatalkan: "Pengajuan lembur dibatalkan. Alasan tercatat di riwayat status.",
  diperbaiki: "Perbaikan lembur tersimpan. Simpan rekap ulang agar Supervisor memvalidasinya.",
};

const labelEntri = (status: string) => STATUS_ENTRI.find((s) => s.value === status)?.label ?? status;
const KEJADIAN: Record<string, string> = { MENUNGGU_VALIDASI_SUPERVISOR: "Diajukan", TERVALIDASI: "Divalidasi", DIBATALKAN: "Dibatalkan" };

function bidang(l: LemburView): [string, string][] {
  return [
    ["NIK / Nama", `${l.orang.nik} / ${l.orang.nama}`],
    ["Departemen / Jabatan", `${l.orang.departemen} / ${l.orang.jabatan}`],
    ["Periode kerja", l.periode ? rentangPeriode(l.periode) : "—"],
    ["Dicatat oleh", `${LABEL_SUMBER[l.sumber]} · ${l.dicatatOleh}`],
    ["Tanggal lembur", formatTanggal(l.tanggal)],
    ["Jumlah jam lembur", formatDurasi(l.menit)],
    ["Nomor SPL", l.nomorSpl],
    ["Status", labelEntri(l.status)],
    ["Keterangan", l.keterangan || "—"],
  ];
}

async function DetailLembur({ id, pesan }: { id: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  const akses = aksesPresensi(sesi);
  const judul = <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Detail lembur" variant="page" />;
  if (!akses.bolehMembaca) return <>{judul}<TidakBerwenang pesan={TOLAK_AKSES} /></>;
  const lembur = await getLembur(sesi, id);
  if (!lembur) {
    return <>{judul}<Keadaan aksi={{ href: "/penggajian/lembur", label: "Kembali ke pengajuan saya" }} judul="Pengajuan lembur tidak ditemukan" pesan="Data mungkin bukan milik Anda atau tautannya salah." /></>;
  }
  const menunggu = lembur.status === "MENUNGGU_VALIDASI_SUPERVISOR";
  const bolehBatal = lembur.pemohonProfileId === sesi.profileId && menunggu;
  const bolehPerbaiki = sesi.peran === "HR" && menunggu && lembur.periode?.status === "TERBUKA";
  const diajukan = lembur.riwayat[0];
  return (
    <>
      <PageHeader
        description={`Diajukan ${lembur.dicatatOleh} pada ${formatWaktu(diajukan?.pada ?? lembur.dicatatPada)}.${menunggu ? " Bisa dibatalkan selama belum divalidasi Supervisor." : ""}`}
        breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]}
        variant="page"
        title={`Detail lembur ${formatTanggal(lembur.tanggal)}`}
      />
      <div className={ui.stack}>
        {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
        <KartuBaca bidang={bidang(lembur)} judul="Identitas dan lembur" />
        <RiwayatTabel
          berikutnya={menunggu ? { kejadian: `Validasi rekap periode ${lembur.periode?.nama ?? ""}`, oleh: "Supervisor Lapangan", status: "BELUM", statuses: BELUM } : undefined}
          kejadian={(r) => KEJADIAN[r.ke] ?? labelEntri(r.ke)}
          riwayat={lembur.riwayat}
          statuses={STATUS_ENTRI}
        />
        <div className={ui.formActions}>
          {bolehPerbaiki ? <Link className={ui.button} href={`/penggajian/lembur/${id}/ubah`}>Perbaiki lembur</Link> : null}
          {bolehBatal ? <Link className={ui.button} href={`/penggajian/lembur/${id}/batal`}>Batalkan pengajuan</Link> : null}
          <Link className={ui.button} href="/penggajian/lembur">← Kembali ke pengajuan saya</Link>
        </div>
      </div>
    </>
  );
}

export function LemburDetailScreen({ id, pesan }: { id: string; pesan?: string }) {
  return (
    <Suspense fallback={<PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Detail lembur" variant="page" />}>
      <DetailLembur id={id} pesan={pesan} />
    </Suspense>
  );
}

async function FormBatal({ id }: { id: string }) {
  const sesi = await sesiPenggajian();
  const lembur = await getLembur(sesi, id);
  if (!lembur) {
    return <><PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Batalkan pengajuan lembur" variant="page" /><Keadaan aksi={{ href: "/penggajian/lembur", label: "Kembali ke pengajuan saya" }} judul="Pengajuan lembur tidak ditemukan" pesan="Data mungkin bukan milik Anda atau tautannya salah." /></>;
  }
  return (
    <>
      <PageHeader
        description="Pembatalan hanya bisa selama status Menunggu validasi Supervisor. Alasan wajib dan tercatat di riwayat status."
        breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]}
        variant="page"
        title={`Batalkan lembur ${formatTanggal(lembur.tanggal)}`}
      />
      <FormAksi
        aksi={cancelLembur.bind(null, id)}
        atas={
          <section className={ui.card}>
            <h2 className={ui.cardTitle}>Pengajuan yang dibatalkan</h2>
            <p>{lembur.nomorSpl} · {formatTanggal(lembur.tanggal)} · {formatDurasi(lembur.menit)}</p>
            <p>Status saat ini: {labelEntri(lembur.status)}.</p>
            <p className={ui.cardHint}>Setelah dibatalkan, pengajuan tidak masuk rekap dan tidak bisa diaktifkan lagi. Ajukan lembur baru bila perlu.</p>
          </section>
        }
        batalHref={`/penggajian/lembur/${id}`}
        batalLabel="Kembali"
        isian={[{ name: "alasan", label: "Alasan pembatalan", wajib: true, contoh: "SPL salah tanggal; lembur dilaksanakan 20 November." }]}
        judul="Alasan pembatalan"
        kirimLabel="Batalkan pengajuan"
      />
    </>
  );
}

export function BatalLemburScreen({ id }: { id: string }) {
  return (
    <Suspense fallback={<PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Batalkan pengajuan lembur" variant="page" />}>
      <FormBatal id={id} />
    </Suspense>
  );
}
