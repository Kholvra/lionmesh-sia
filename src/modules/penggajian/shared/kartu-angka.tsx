import { ui } from "@/modules/penggajian/ui/kelas";

/** Row of figure cards from the prototype (e.g. Bruto, Potongan, Neto dibayarkan). */
export function KartuAngka({ isi }: { isi: readonly [label: string, nilai: string][] }) {
  return (
    <div className={ui.kartuAngka}>
      {isi.map(([label, nilai]) => (
        <section className={ui.card} key={label}>
          <span className={ui.cardHint}>{label}</span>
          <p className={ui.angkaBesar}>{nilai}</p>
        </section>
      ))}
    </div>
  );
}
