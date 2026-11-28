import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PoScreen } from "@/modules/pengeluaran/purchase-order/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Purchase Order — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    po?: string | string[];
    permintaan?: string | string[];
  }>;
};

function satu(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function PurchaseOrderPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  return (
    <PoScreen
      permintaanId={satu(params.permintaan)}
      poId={satu(params.po)}
      profile={profile}
    />
  );
}
