import type { ReactNode } from "react";

import { ui } from "@/modules/penggajian/ui/kelas";

/** Read-only value in the same grey box as a disabled field (Figma "Identitas otomatis"). */
export function BidangBaca({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ui.bidangBaca}>
      <span className={ui.bidangLabel}>{label}</span>
      <div className={ui.bidangNilai}>{children}</div>
    </div>
  );
}

export function KartuBaca({ judul, bidang }: { judul: string; bidang: readonly [string, ReactNode][] }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>{judul}</h2>
      <div className={ui.formGrid}>
        {bidang.map(([label, nilai]) => (
          <BidangBaca key={label} label={label}>{nilai}</BidangBaca>
        ))}
      </div>
    </section>
  );
}
