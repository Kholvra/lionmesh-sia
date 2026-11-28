import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PemilihanScreen } from "@/modules/pengeluaran/pemilihan/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Pemilihan Pemasok — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{ permintaan?: string | string[] }>;
};

export default async function PemilihanPemasokPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();
  const rawId = Array.isArray(params.permintaan)
    ? params.permintaan[0]
    : params.permintaan;

  return (
    <PemilihanScreen
      permintaanId={rawId && rawId.length > 0 ? rawId : undefined}
      profile={profile}
    />
  );
}
