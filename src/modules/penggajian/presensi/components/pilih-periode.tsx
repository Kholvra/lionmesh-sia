import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { labelStatusPeriode } from "@/modules/penggajian/periode/rules";
import { ui } from "@/modules/penggajian/ui/kelas";

/** Plain GET form so the chosen period lives in the URL and survives reloads. */
export function PilihPeriode({ action, dipilih, periode }: { action: string; dipilih: string; periode: readonly PeriodeGaji[] }) {
  return (
    <form action={action} className={ui.toolbar} method="get">
      <label className={ui.toolbarField}>
        Periode penggajian
        <select className={ui.select} defaultValue={dipilih} name="periode">
          {periode.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} · {labelStatusPeriode(p.status)}
            </option>
          ))}
        </select>
      </label>
      <button className={ui.button} type="submit">
        Tampilkan
      </button>
    </form>
  );
}
