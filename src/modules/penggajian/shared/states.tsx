import Link from "next/link";

import { ui } from "@/modules/penggajian/ui/kelas";

type KeadaanProps = {
  judul: string;
  pesan: string;
  aksi?: { href: string; label: string; utama?: boolean };
};

/** Empty, unauthorized, and not-found states share one layout. */
export function Keadaan({ aksi, judul, pesan, peringatan }: KeadaanProps & { peringatan?: boolean }) {
  return (
    <section className={`${ui.card} ${ui.empty}`} role={peringatan ? "alert" : "status"}>
      <h2 className={ui.cardTitle}>{judul}</h2>
      <p>{pesan}</p>
      {aksi ? (
        <Link className={aksi.utama ? ui.buttonPrimary : ui.button} href={aksi.href}>
          {aksi.label}
        </Link>
      ) : null}
    </section>
  );
}

export function TidakBerwenang({ pesan }: { pesan: string }) {
  return <Keadaan judul="Anda tidak punya akses ke halaman ini" pesan={pesan} peringatan />;
}
