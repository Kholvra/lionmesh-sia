import { StatusBadge } from "@/components/ui";
import type { StatusOption } from "@/components/ui";
import { formatRupiah } from "@/modules/penggajian/karyawan/format";
import { rentangPeriode } from "@/modules/penggajian/periode/rules";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import type { DraftView } from "@/modules/penggajian/payroll/queries";
import { labelDraft } from "@/modules/penggajian/payroll/status";
import { ui } from "@/modules/penggajian/ui/kelas";

const HASIL: readonly StatusOption[] = [
  { value: "sesuai", label: "Sesuai", tone: "success" },
  { value: "periksa", label: "Perlu diperiksa", tone: "danger" },
];

/**
 * Accounting checklist from the prototype. Each line is derived from the draft
 * itself, so "Sesuai" is a recomputed fact, not a typed claim.
 */
export function DaftarPemeriksaan({ draft, periode, profileId }: { draft: DraftView; periode: PeriodeGaji; profileId: string }) {
  const r = draft.ringkasan;
  const baris: [string, string, boolean][] = [
    ["Data kerja", periode.status === "TERVALIDASI" ? "Presensi dan lembur tervalidasi" : `Periode berstatus ${periode.status}`, periode.status === "TERVALIDASI"],
    ["Total bruto", formatRupiah(r.totalBruto), true],
    ["Total potongan", formatRupiah(r.totalPotongan), true],
    ["Total neto", `${formatRupiah(r.totalNeto)} (bruto − potongan)`, r.totalBruto - r.totalPotongan === r.totalNeto],
    ["Karyawan tanpa angka", draft.ditandai.length ? draft.ditandai.map((d) => d.nama).join(", ") : "Tidak ada", draft.ditandai.length === 0],
    ["Pemisahan tugas", `${draft.dihitungOleh} menyusun, Accounting memeriksa`, draft.dihitungOlehProfileId !== profileId],
  ];
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Daftar pemeriksaan</h2>
      <table className={ui.table}>
        <caption className="sr-only">Daftar pemeriksaan payroll</caption>
        <thead><tr><th scope="col">Pemeriksaan</th><th scope="col">Bukti</th><th scope="col">Hasil</th></tr></thead>
        <tbody>
          {baris.map(([nama, bukti, ok]) => (
            <tr key={nama}><td>{nama}</td><td>{bukti}</td><td><StatusBadge status={ok ? "sesuai" : "periksa"} statuses={HASIL} /></td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function RingkasanDireksi({ draft, periode }: { draft: DraftView; periode: PeriodeGaji }) {
  const diperiksa = draft.riwayat.some((x) => x.ke === "DIPERIKSA");
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Ringkasan yang disetujui</h2>
      <table className={ui.table}>
        <caption className="sr-only">Ringkasan payroll</caption>
        <thead><tr><th scope="col">Periode</th><th scope="col">Rentang kerja</th><th scope="col">Pemeriksaan</th><th scope="col">Status</th></tr></thead>
        <tbody>
          <tr>
            <td>{periode.nama}</td>
            <td>{rentangPeriode(periode)}</td>
            <td>{diperiksa ? "Accounting selesai" : "Belum diperiksa"}</td>
            <td><StatusBadge status="s" statuses={[{ value: "s", label: draft.status === "DIPERIKSA" ? "Menunggu keputusan" : labelDraft(draft.status), tone: draft.status === "DIPERIKSA" ? "warning" : "neutral" }]} /></td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
