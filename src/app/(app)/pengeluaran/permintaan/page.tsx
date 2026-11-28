import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { firstParam } from "@/lib/first-param";
import { PermintaanScreen } from "@/modules/pengeluaran/permintaan/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Permintaan Pembelian — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    permintaan?: string | string[];
    mode?: string | string[];
  }>;
};

export default async function PermintaanPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();
  const rawId = firstParam(params.permintaan);
  const rawMode = firstParam(params.mode);

  return (
    <PermintaanScreen
      mode={rawMode === "baru" ? "baru" : undefined}
      permintaanId={rawId && rawId.length > 0 ? rawId : undefined}
      profile={profile}
    />
  );
}
