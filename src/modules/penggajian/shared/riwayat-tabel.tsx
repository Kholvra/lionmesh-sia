import { StatusBadge } from "@/components/ui";
import type { StatusOption } from "@/components/ui";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { ui } from "@/modules/penggajian/ui/kelas";
import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

type RiwayatTabelProps = {
  riwayat: readonly RiwayatStatus[];
  statuses: readonly StatusOption[];
  kejadian: (r: RiwayatStatus) => string;
  /** A row that has not happened yet, e.g. the coming validation (Figma "Belum divalidasi"). */
  berikutnya?: { kejadian: string; oleh: string; status: string; statuses: readonly StatusOption[] };
};

/** Figma "Riwayat status": event, actor, and resulting status per row, oldest first. */
export function RiwayatTabel({ berikutnya, kejadian, riwayat, statuses }: RiwayatTabelProps) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Riwayat status</h2>
      <table className={ui.table}>
        <caption className="sr-only">Riwayat status</caption>
        <thead>
          <tr><th scope="col">Kejadian</th><th scope="col">Oleh</th><th scope="col">Status</th></tr>
        </thead>
        <tbody>
          {riwayat.map((r) => (
            <tr key={r.id}>
              <td>
                {kejadian(r)} · {formatWaktu(r.pada)}
                {r.alasan ? <div className={ui.timelineMeta}>Alasan: {r.alasan}</div> : null}
              </td>
              <td>{r.oleh}</td>
              <td><StatusBadge status={r.ke} statuses={statuses} /></td>
            </tr>
          ))}
          {berikutnya ? (
            <tr>
              <td>{berikutnya.kejadian}</td>
              <td>{berikutnya.oleh}</td>
              <td><StatusBadge status={berikutnya.status} statuses={berikutnya.statuses} /></td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
