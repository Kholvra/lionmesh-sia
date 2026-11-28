import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { ReturScreen } from "@/modules/pengeluaran/qc/retur-screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Retur Pemasok — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    retur?: string | string[];
    penerimaan?: string | string[];
  }>;
};

function satu(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function ReturPemasokPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  return (
    <ReturScreen
      penerimaanId={satu(params.penerimaan)}
      profile={profile}
      returId={satu(params.retur)}
    />
  );
}
