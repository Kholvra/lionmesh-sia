import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PembayaranScreen } from "@/modules/pengeluaran/pembayaran/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Pembayaran Pemasok — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    bayar?: string | string[];
    pemasok?: string | string[];
  }>;
};

function satu(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function PembayaranPemasokPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  return (
    <PembayaranScreen
      bayarId={satu(params.bayar)}
      pemasokId={satu(params.pemasok)}
      profile={profile}
    />
  );
}
