import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatRupiah, formatWaktu } from "@/modules/penggajian/karyawan/format";
import { rentangPeriode } from "@/modules/penggajian/periode/rules";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { calculatePayroll } from "@/modules/penggajian/payroll/actions";
import { aksesPayroll } from "@/modules/penggajian/payroll/akses";
import { getDraft } from "@/modules/penggajian/payroll/queries";
import type { DraftView } from "@/modules/penggajian/payroll/queries";
import { labelDraft, STATUS_DRAFT } from "@/modules/penggajian/payroll/status";
import type { BarisGaji, KodeKomponen } from "@/modules/penggajian/payroll/types";
import { PilihPeriode } from "@/modules/penggajian/presensi/components/pilih-periode";
import { getPeriodeDipilih, listPeriode } from "@/modules/penggajian/presensi/queries";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { KartuAngka } from "@/modules/penggajian/shared/kartu-angka";
import { RiwayatStatusKartu } from "@/modules/penggajian/shared/riwayat-kartu";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { ALUR_REKAP, Stepper } from "@/modules/penggajian/shared/stepper";

const ITEM = "GJ-004 Menghitung draft payroll";

const PESAN: Record<string, string> = {
  dihitung: "Draft payroll terhitung. Setiap angka bisa ditelusuri ke versi tarifnya.",
  diperiksa: "Draft ditandai sudah diperiksa Accounting dan menunggu persetujuan Direksi.",
  disetujui: "Payroll disetujui dan dikunci.",
  dikembalikan: "Draft dikembalikan ke HR dengan alasan dan berstatus Revisi.",
};

const KOLOM: readonly [KodeKomponen, string][] = [
  ["GAJI_POKOK", "Pokok"],
  ["TUNJANGAN_TETAP", "Tunj. tetap"],
  ["TUNJANGAN_KEHADIRAN", "Tunj. hadir"],
  ["LEMBUR", "Lembur"],
  ["POTONGAN_KETIDAKHADIRAN", "Pot. absen"],
  ["BPJS_JHT", "JHT"],
  ["BPJS_JP", "JP"],
  ["BPJS_KESEHATAN", "BPJS Kes"],
  ["PPH21", "PPh 21"],
];

const angka = (n: number) => n.toLocaleString("id-ID");
const nilai = (b: BarisGaji, kode: KodeKomponen) => b.komponen.find((k) => k.kode === kode)?.nilai ?? 0;

function TabelKomponen({ draft, periodeId }: { draft: DraftView; periodeId: string }) {
  const baris = draft.baris ?? [];
  const total = (f: (b: BarisGaji) => number) => baris.reduce((t, b) => t + f(b), 0);
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Komponen per karyawan (rupiah)</h2>
      <p className={ui.cardHint}>Dasar lembur dan BPJS = gaji pokok + tunjangan tetap. PPh 21 dari tabel TER bulanan. Semua nilai dari tabel tarif berversi.</p>
      <div className={ui.tabelLebar}>
        <table className={ui.table}>
          <caption className="sr-only">Komponen gaji per karyawan</caption>
          <thead>
            <tr>
              <th scope="col">Karyawan</th>
              {KOLOM.map(([, label]) => <th className={ui.right} key={label} scope="col">{label}</th>)}
              <th className={ui.right} scope="col">Neto</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.karyawanId}>
                <td><Link href={`/penggajian/payroll/${periodeId}/${b.karyawanId}`}>{b.nama}</Link></td>
                {KOLOM.map(([kode]) => <td className={`${ui.right} ${ui.numeric}`} key={kode}>{angka(nilai(b, kode))}</td>)}
                <td className={`${ui.right} ${ui.numeric}`}>{angka(b.neto)}</td>
              </tr>
            ))}
            <tr className={ui.barisTotal}>
              <td>Total</td>
              {KOLOM.map(([kode]) => <td className={`${ui.right} ${ui.numeric}`} key={kode}>{angka(total((b) => nilai(b, kode)))}</td>)}
              <td className={`${ui.right} ${ui.numeric}`}>{angka(total((b) => b.neto))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TabelNeto({ draft }: { draft: DraftView }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Gaji bersih per karyawan</h2>
      <table className={ui.table}>
        <caption className="sr-only">Gaji bersih per karyawan</caption>
        <thead><tr><th scope="col">Karyawan</th><th scope="col">NIK</th><th className={ui.right} scope="col">Neto</th></tr></thead>
        <tbody>
          {(draft.neto ?? []).map((n) => (
            <tr key={n.karyawanId}><td>{n.nama}</td><td className={ui.numeric}>{n.nik}</td><td className={`${ui.right} ${ui.numeric}`}>{formatRupiah(n.neto)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DasarPerhitungan({ draft }: { draft: DraftView }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Dasar dan batas perhitungan</h2>
      <p>Penambah mencakup gaji pokok, tunjangan, dan lembur tervalidasi; karyawan yang masuk atau keluar di tengah periode diprorata hari kerja.</p>
      <p>Versi tarif yang dipakai: {Object.entries(draft.versiTarif).map(([t, v]) => `${t} ${v}`).join(" · ")}. <Link href="/penggajian/payroll/tarif">Lihat tabel tarif dan sumbernya</Link>.</p>
      <p className={ui.cardHint}>Dihitung {draft.dihitungOleh} · {formatWaktu(draft.dihitungPada)} · selisih pembulatan periode {draft.ringkasan.totalSelisih.toLocaleString("id-ID")} rupiah.</p>
    </section>
  );
}

function TombolHitung({ periode, draft }: { periode: PeriodeGaji; draft: DraftView | null }) {
  const terbuka = !draft || draft.status === "DRAFT_TERHITUNG" || draft.status === "REVISI";
  if (periode.status === "TERVALIDASI" && !terbuka) return null;
  return (
    <FormAksi
      aksi={calculatePayroll}
      isian={[]}
      kirimLabel={draft ? "Hitung ulang draft" : "Hitung draft payroll"}
      tersembunyi={{ periodeId: periode.id }}
    />
  );
}

function judulPeran(sesi: SesiPenggajian): { judul: string; deskripsi: string; item?: string } {
  if (sesi.peran === "Finance") return { judul: "Draft payroll", deskripsi: "Gaji bersih per karyawan untuk transfer." };
  return { judul: "Draf perhitungan gaji", deskripsi: "Dihitung dari gaji pokok, presensi dan lembur tervalidasi, serta tabel tarif berversi." };
}

async function Konten({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  const akses = aksesPayroll(sesi);
  const { judul, deskripsi, item = ITEM } = judulPeran(sesi);
  const header = <PageHeader actions={akses.rincian ? <Link className={ui.button} href="/penggajian/payroll/tarif">Tabel tarif</Link> : undefined} description={deskripsi} item={item} title={judul} />;
  if (!akses.ringkasan) return <>{header}<TidakBerwenang pesan="Draft payroll dibuka HR, Accounting, Finance (gaji bersih), dan Direksi (ringkasan)." /></>;
  const periode = await getPeriodeDipilih(periodeId);
  if (!periode) return <>{header}<Keadaan judul="Belum ada periode penggajian" pesan="Periode dibuat HR lebih dulu." /></>;
  const draft = await getDraft(sesi, periode.id);
  const r = draft?.ringkasan;
  return (
    <>
      {header}
      <div className={ui.stack}>
        <div className={ui.cardHeader}>
          <PilihPeriode action="/penggajian/payroll" dipilih={periode.id} periode={await listPeriode()} />
          <StatusBadge status={draft?.status ?? "BELUM"} statuses={STATUS_DRAFT} />
        </div>
        {akses.hitung ? <Stepper aktif={periode.status === "TERVALIDASI" ? 3 : periode.status === "REKAP" ? 1 : 0} langkah={ALUR_REKAP} /> : null}
        {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
        {periode.status !== "TERVALIDASI" ? <Notice title={`Periode ${periode.nama} belum Tervalidasi. Payroll hanya dihitung setelah validasi Supervisor.`} tone="warning" /> : null}
        {draft?.pengembalian ? (
          <Notice title={`Draft dikembalikan ${draft.pengembalian.oleh} · ${formatWaktu(draft.pengembalian.pada)}`} tone="danger"><p>Alasan: {draft.pengembalian.alasan}</p></Notice>
        ) : null}
        {r ? (
          sesi.peran === "Direksi"
            ? <KartuAngka isi={[["Karyawan", String(r.jumlahKaryawan)], ["Neto payroll", formatRupiah(r.totalNeto)], ["Periode", rentangPeriode(periode)]]} />
            : <KartuAngka isi={[["Bruto", formatRupiah(r.totalBruto)], ["Potongan", formatRupiah(r.totalPotongan)], ["Neto dibayarkan", formatRupiah(r.totalNeto)]]} />
        ) : (
          <Keadaan judul="Belum ada draft payroll" pesan={periode.status === "TERVALIDASI" ? "HR menghitung draft dari presensi tervalidasi dan tabel tarif berversi." : "Draft dihitung setelah periode Tervalidasi."} />
        )}
        {draft && draft.ditandai.length > 0 && akses.rincian ? (
          <Notice title="Karyawan berikut tidak diberi angka" tone="warning">
            {draft.ditandai.map((d) => <p key={d.karyawanId}>{d.nama} (NIK {d.nik}): {d.alasan}</p>)}
          </Notice>
        ) : null}
        {draft && akses.rincian ? <TabelKomponen draft={draft} periodeId={periode.id} /> : null}
        {draft && !akses.rincian && draft.neto ? <TabelNeto draft={draft} /> : null}
        {draft && akses.rincian ? <DasarPerhitungan draft={draft} /> : null}
        {akses.hitung ? (
          <div className={ui.cardHeader}>
            <Notice title="Prorata dan koreksi manual" tone="info">
              <p>Koreksi komponen hanya dengan alasan, lewat rincian per karyawan. Hitung ulang menimpa draft dan menghasilkan angka yang sama untuk data yang sama.</p>
            </Notice>
            <TombolHitung draft={draft} periode={periode} />
          </div>
        ) : null}
        {draft ? (
          <RiwayatStatusKartu
            label={labelDraft}
            // Correction notes name an employee, so readers without the detail view do not see them.
            riwayat={akses.rincian ? draft.riwayat : draft.riwayat.filter((x) => !x.alasan?.startsWith("Koreksi"))}
          />
        ) : null}
      </div>
    </>
  );
}

export function PayrollScreen({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  return (
    <Suspense fallback={<PageHeader item={ITEM} title="Draft payroll" />}>
      <Konten periodeId={periodeId} pesan={pesan} />
    </Suspense>
  );
}
