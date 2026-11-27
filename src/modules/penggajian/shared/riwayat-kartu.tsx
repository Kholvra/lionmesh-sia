import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { ui } from "@/modules/penggajian/ui/kelas";
import type { RiwayatStatus } from "@/modules/penggajian/shared/riwayat";

type RiwayatStatusKartuProps = {
  riwayat: readonly RiwayatStatus[];
  label: (status: string) => string;
  judul?: string;
};

/** Newest first: who moved the status, when, and why. */
export function RiwayatStatusKartu({ judul = "Riwayat status", label, riwayat }: RiwayatStatusKartuProps) {
  return (
    <aside className={ui.card}>
      <h2 className={ui.cardTitle}>{judul}</h2>
      <ol className={ui.timeline}>
        {[...riwayat].reverse().map((r) => (
          <li key={r.id}>
            <span>{r.dari ? `${label(r.dari)} → ${label(r.ke)}` : label(r.ke)}</span>
            {r.alasan ? <span>Alasan: {r.alasan}</span> : null}
            <span className={ui.timelineMeta}>{r.oleh} · {formatWaktu(r.pada)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
