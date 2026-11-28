import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui";
import type { StatusOption } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { labelStatusPeriode, rentangPeriode, sudahTervalidasi } from "@/modules/penggajian/periode/rules";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { PilihPeriode } from "@/modules/penggajian/presensi/components/pilih-periode";
import { getPeriodeDipilih, listPeriode } from "@/modules/penggajian/presensi/queries";
import { saveRekap, validateRekap } from "@/modules/penggajian/rekap/actions";
import { aksesRekap, getRekap } from "@/modules/penggajian/rekap/queries";
import type { RekapDepartemen, RekapKaryawan } from "@/modules/penggajian/rekap/queries";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { ALUR_REKAP, langkahRekap, Stepper } from "@/modules/penggajian/shared/stepper";
import { formatDurasi } from "@/modules/penggajian/shared/waktu";

const ITEM_HR = "GJ-003 Merekap presensi dan lembur";
const ITEM_SPV = "GJ-003 Memvalidasi presensi dan lembur";

const KELENGKAPAN: readonly StatusOption[] = [
  { value: "lengkap", label: "Lengkap", tone: "success" },
  { value: "belum", label: "Belum lengkap", tone: "danger" },
];

const VALIDASI: readonly StatusOption[] = [
  { value: "belum", label: "Belum direkap", tone: "neutral" },
  { value: "dikembalikan", label: "Dikembalikan", tone: "danger" },
  { value: "menunggu", label: "Menunggu validasi", tone: "warning" },
  { value: "tervalidasi", label: "Tervalidasi", tone: "success" },
];

const PESAN: Record<string, string> = {
  disimpan: "Rekap tersimpan. Periode berstatus Rekap dan menunggu validasi Supervisor tiap departemen.",
  divalidasi: "Rekap departemen tervalidasi.",
  dikembalikan: "Rekap dikembalikan ke HR. Periode kembali Terbuka dan validasi semua departemen dihapus.",
  dibuka: "Periode dibuka ulang ke Rekap. Setiap departemen memvalidasi ulang.",
};

function statusValidasi(periode: PeriodeGaji, dep: RekapDepartemen) {
  if (sudahTervalidasi(periode.status) || dep.validasi) return "tervalidasi";
  if (periode.status === "REKAP") return "menunggu";
  return periode.pengembalian ? "dikembalikan" : "belum";
}

const lembur = (k: RekapKaryawan) => (k.lemburMenit > 0 ? `${formatDurasi(k.lemburMenit)} · ${k.nomorSpl.join(", ")}` : "0 jam");
const lengkap = (k: RekapKaryawan) => (k.tanpaEntri || k.belumLengkap.length > 0 ? "belum" : "lengkap");

function Tabel({ kepala, baris, caption }: { kepala: readonly string[]; baris: readonly (readonly ReactNode[])[]; caption: string }) {
  return (
    <table className={ui.table}>
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{kepala.map((k) => <th key={k} scope="col">{k}</th>)}</tr></thead>
      <tbody>{baris.map((sel, i) => <tr key={i}>{sel.map((s, j) => <td key={j}>{s}</td>)}</tr>)}</tbody>
    </table>
  );
}

function KontenHr({ departemen, periode, pesan }: { departemen: RekapDepartemen[]; periode: PeriodeGaji; pesan?: string }) {
  const semua = departemen.flatMap((d) => d.karyawan.map((k) => ({ k, d })));
  const kosong = semua.filter(({ k }) => k.tanpaEntri || k.belumLengkap.length > 0);
  const kembali = periode.status === "TERBUKA" ? periode.pengembalian : null;
  const tervalidasi = departemen.filter((d) => statusValidasi(periode, d) === "tervalidasi");
  return (
    <div className={ui.stack}>
      <Stepper aktif={langkahRekap(periode.status)} langkah={ALUR_REKAP} />
      {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
      {kembali ? (
        <Notice title={`${kembali.oleh} mengembalikan rekap ${kembali.departemen}: ${kembali.alasan}`} tone="warning" />
      ) : null}
      {periode.status === "REKAP" ? (
        <Notice title={tervalidasi.length > 0 ? `${tervalidasi.map((d) => d.nama).join(" dan ")} tervalidasi. Departemen lain masih menunggu validasi Supervisor.` : "Rekap tersimpan. Menunggu validasi Supervisor setiap departemen."} tone="warning" />
      ) : null}
      {sudahTervalidasi(periode.status) ? (
        <Notice title="Semua departemen tervalidasi. Siap dihitung di draft payroll; perubahan berikutnya hanya lewat buka ulang periode dengan otorisasi Manajemen." tone="success" />
      ) : null}
      {periode.status === "TERBUKA" && kosong.length > 0 ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Karyawan tanpa entri</h2>
          <Tabel
            baris={kosong.map(({ k }) => [
              `${k.nama} · ${k.nik}`,
              k.tanpaEntri ? "Belum ada entri pada periode ini" : `Hadir tanpa jam pulang: ${k.belumLengkap.join(", ")}`,
              <Link href="/penggajian/presensi/catat" key="catat">Catat presensi →</Link>,
            ])}
            caption="Karyawan tanpa entri"
            kepala={["Karyawan", "Tanggal kosong", ""]}
          />
        </section>
      ) : null}
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Rekap presensi & lembur</h2>
        <Tabel
          baris={semua.map(({ k, d }) => [
            <Link href={`/penggajian/rekap/${k.id}?periode=${periode.id}`} key="n">{k.nama}</Link>,
            `${k.jumlah.HADIR} hari`,
            lembur(k),
            <StatusBadge key="l" status={lengkap(k)} statuses={KELENGKAPAN} />,
            <StatusBadge key="v" status={statusValidasi(periode, d)} statuses={VALIDASI} />,
          ])}
          caption="Rekap presensi dan lembur"
          kepala={["Karyawan", "Hadir", "Lembur", "Kelengkapan", "Validasi departemen"]}
        />
      </section>
      {kembali ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Alasan pengembalian</h2>
          <Tabel
            baris={[[
              kembali.departemen || "—",
              `${kembali.oleh}, ${formatWaktu(kembali.pada)}`,
              kembali.alasan,
              <Link href={`/penggajian/lembur?periode=${periode.id}`} key="t">Perbaiki data →</Link>,
            ]]}
            caption="Alasan pengembalian"
            kepala={["Departemen", "Dikembalikan oleh", "Alasan", "Tindak lanjut"]}
          />
        </section>
      ) : null}
      {periode.status !== "TERBUKA" ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Validasi per departemen</h2>
          <Tabel
            baris={departemen.map((d) => [
              d.nama,
              d.validasi?.oleh ?? "Supervisor Lapangan",
              d.karyawan.map((k) => k.nama).join(", "),
              <StatusBadge key="s" status={statusValidasi(periode, d)} statuses={VALIDASI} />,
            ])}
            caption="Validasi per departemen"
            kepala={["Departemen", "Supervisor", "Karyawan", "Status"]}
          />
        </section>
      ) : null}
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Periode {periode.nama} · status {labelStatusPeriode(periode.status)}</h2>
        <p>Rentang kerja {rentangPeriode(periode)}. Rekap ditolak bila ada karyawan aktif tanpa entri.</p>
        <p>Setelah rekap disimpan, periode berstatus Rekap dan entri baru ditolak.</p>
      </section>
      <div className={ui.formActions}>
        {periode.status === "TERBUKA" ? (
          <FormAksi aksi={saveRekap} isian={[]} kirimLabel={kembali ? "Simpan rekap ulang" : "Simpan rekap & tutup periode"} tersembunyi={{ periodeId: periode.id }} />
        ) : null}
        <Link className={ui.button} href={`/penggajian/rekap/riwayat?periode=${periode.id}`}>Lihat riwayat rekap</Link>
        {periode.status === "TERVALIDASI" ? <Link className={ui.button} href={`/penggajian/periode/buka-ulang?periode=${periode.id}`}>Buka ulang periode</Link> : null}
      </div>
    </div>
  );
}

function BagianSupervisor({ dep, periode }: { dep: RekapDepartemen; periode: PeriodeGaji }) {
  const status = statusValidasi(periode, dep);
  const bisa = periode.status === "REKAP" && !dep.validasi;
  return (
    <div className={ui.stack}>
      <section className={ui.card}>
        <div className={ui.cardHeader}>
          <div>
            <h2 className={ui.cardTitle}>Rekap {periode.nama} · Departemen {dep.nama}</h2>
            <p className={ui.cardHint}>
              {dep.validasi ? `Divalidasi ${dep.validasi.oleh}, ${formatWaktu(dep.validasi.pada)}` : `Periode berstatus ${labelStatusPeriode(periode.status)}`}
            </p>
          </div>
          <div className={ui.actions}>
            <StatusBadge status={status} statuses={VALIDASI} />
            <Link className={ui.button} href={`/penggajian/rekap/riwayat?periode=${periode.id}`}>Lihat riwayat</Link>
          </div>
        </div>
      </section>
      {bisa ? (
        <Notice title="Periksa presensi dan nomor SPL setiap lembur" tone="warning">
          <p>Validasi berlaku untuk seluruh karyawan Departemen {dep.nama} sekaligus. Bila ada yang tidak sesuai, kembalikan rekap ke HR dengan alasan; periode kembali Terbuka.</p>
        </Notice>
      ) : null}
      {periode.status === "TERBUKA" ? (
        <Notice title="Tidak ada yang perlu Anda validasi sekarang" tone="info">
          <p>{periode.pengembalian ? `Rekap dikembalikan: ${periode.pengembalian.alasan}. ` : ""}Rekap muncul di sini setelah HR menyimpan rekap periode.</p>
        </Notice>
      ) : null}
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Rekap Departemen {dep.nama}</h2>
        <Tabel
          baris={dep.karyawan.map((k) => [
            <span className={ui.selTumpuk} key="k"><strong>{k.nama}</strong><span className={ui.cardHint}>{k.nik}</span></span>,
            <span className={ui.selTumpuk} key="p"><StatusBadge status={status} statuses={VALIDASI} /><span>{k.jumlah.HADIR} hari hadir</span></span>,
            k.lembur.length ? (
              <span className={ui.selTumpuk} key="l"><StatusBadge status="ada" statuses={[{ value: "ada", label: `${k.lembur.length} pengajuan`, tone: "neutral" }]} /><span>{k.lembur.map((l) => `${l.tanggal.slice(8)}/${l.tanggal.slice(5, 7)} · ${formatDurasi(l.menit)} · ${l.nomorSpl}`).join("; ")}</span></span>
            ) : <StatusBadge key="l" status="tidak" statuses={[{ value: "tidak", label: "Tidak ada lembur", tone: "neutral" }]} />,
            <Link className={ui.buttonSmall} href={`/penggajian/rekap/${k.id}?periode=${periode.id}`} key="d">Lihat detail →</Link>,
          ])}
          caption={`Rekap ${dep.nama}`}
          kepala={["Karyawan", "Presensi", "Lembur (nomor SPL)", "Detail"]}
        />
      </section>
      {bisa ? (
        <div className={ui.formActions}>
          <FormAksi aksi={validateRekap} isian={[]} kirimLabel={`Validasi rekap ${dep.nama}`} tersembunyi={{ periodeId: periode.id, departemenId: dep.id }} />
          <Link className={ui.button} href={`/penggajian/rekap/kembalikan?periode=${periode.id}&departemen=${dep.id}`}>Kembalikan ke HR</Link>
        </div>
      ) : null}
    </div>
  );
}

async function KontenRekap({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  const akses = await aksesRekap(sesi);
  if (!akses.bolehMembaca) {
    return <><PageHeader item={ITEM_HR} title="Rekap presensi & lembur" /><TidakBerwenang pesan="Rekap dibuka HR untuk seluruh karyawan dan Supervisor Lapangan untuk departemennya." /></>;
  }
  const periode = await getPeriodeDipilih(periodeId);
  const header = akses.hr ? (
    <PageHeader description="HR memeriksa kelengkapan lalu menyimpan rekap. Periode ditutup (Rekap) dan menunggu validasi Supervisor tiap departemen." item={ITEM_HR} title="Rekap presensi & lembur" />
  ) : (
    <PageHeader description={periode ? `Periode ${rentangPeriode(periode)}` : undefined} item={ITEM_SPV} title="Validasi rekap presensi & lembur" />
  );
  if (!periode) return <>{header}<Keadaan judul="Belum ada periode penggajian" pesan="Periode dibuat HR sebelum rekap bisa disusun." /></>;
  const departemen = await getRekap(sesi, periode);
  return (
    <>
      {header}
      <div className={ui.stack}>
        <PilihPeriode action="/penggajian/rekap" dipilih={periode.id} periode={await listPeriode()} />
        {akses.hr ? (
          <KontenHr departemen={departemen} pesan={pesan} periode={periode} />
        ) : (
          <>
            <Stepper aktif={langkahRekap(periode.status)} langkah={ALUR_REKAP} />
            {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
            {departemen.length === 0 ? <Keadaan judul="Belum ada rekap yang perlu diperiksa" pesan="Rekap muncul setelah HR menyimpan rekap periode untuk departemen Anda." /> : null}
            {departemen.map((dep) => <BagianSupervisor dep={dep} key={dep.id} periode={periode} />)}
          </>
        )}
      </div>
    </>
  );
}

export function RekapScreen({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  return (
    <Suspense fallback={<PageHeader item={ITEM_HR} title="Rekap presensi & lembur" />}>
      <KontenRekap periodeId={periodeId} pesan={pesan} />
    </Suspense>
  );
}
