import { ui } from "@/modules/penggajian/ui/kelas";

export type LangkahAlur = { label: string; peran: string };
export type StatusLangkah = "selesai" | "aktif" | "berikutnya";

/** Process stepper from the prototype: done steps show a check, the active one is filled. */
export function Stepper({ langkah, aktif }: { langkah: readonly LangkahAlur[]; aktif: number }) {
  const status = (i: number): StatusLangkah => (i < aktif ? "selesai" : i === aktif ? "aktif" : "berikutnya");
  return (
    <ol aria-label="Alur proses" className={ui.stepper}>
      {langkah.map((l, i) => (
        <li aria-current={status(i) === "aktif" ? "step" : undefined} className={ui.langkah} data-status={status(i)} key={l.label}>
          <span aria-hidden="true" className={ui.langkahNomor}>{status(i) === "selesai" ? "✓" : i + 1}</span>
          <span className={ui.langkahTeks}>
            <span className={ui.langkahLabel}>{l.label}</span>
            <span className={ui.langkahPeran}>{l.peran}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export const ALUR_REKAP: readonly LangkahAlur[] = [
  { label: "Rekap", peran: "HR" },
  { label: "Validasi Supervisor", peran: "Supervisor" },
  { label: "Tervalidasi", peran: "Supervisor" },
  { label: "Draft payroll", peran: "HR" },
];

/** Terbuka → step 1, Rekap → step 2, Tervalidasi → step 4 (payroll is next). */
export function langkahRekap(status: "TERBUKA" | "REKAP" | "TERVALIDASI"): number {
  return status === "TERBUKA" ? 0 : status === "REKAP" ? 1 : 3;
}
