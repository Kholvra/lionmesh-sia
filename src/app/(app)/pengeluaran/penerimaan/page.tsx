import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PenerimaanScreen } from "@/modules/pengeluaran/penerimaan/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Penerimaan Barang — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    penerimaan?: string | string[];
    po?: string | string[];
  }>;
};

function satu(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function PenerimaanBarangPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  return (
    <PenerimaanScreen
      penerimaanId={satu(params.penerimaan)}
      poId={satu(params.po)}
      profile={profile}
    />
  );
}
