import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { QcScreen } from "@/modules/pengeluaran/qc/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "QC Bahan — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{ penerimaan?: string | string[] }>;
};

export default async function QcBahanPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();
  const raw = Array.isArray(params.penerimaan)
    ? params.penerimaan[0]
    : params.penerimaan;

  return (
    <QcScreen
      penerimaanId={raw && raw.length > 0 ? raw : undefined}
      profile={profile}
    />
  );
}
