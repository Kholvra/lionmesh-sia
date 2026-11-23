import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PemasokScreen } from "@/modules/pengeluaran/pemasok/screen";
import { isValidPemasokId } from "@/modules/pengeluaran/pemasok/schema";

export const instant = false;

export const metadata: Metadata = {
  title: "Pemasok — Lionmesh SIA",
};

type PemasokPageProps = {
  searchParams: Promise<{
    pemasok?: string | string[];
    mode?: string | string[];
  }>;
};

export default async function PemasokPage({ searchParams }: PemasokPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const rawPemasokId = Array.isArray(params.pemasok)
    ? params.pemasok[0]
    : params.pemasok;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;

  return (
    <PemasokScreen
      mode={rawMode === "edit" ? "edit" : undefined}
      pemasokId={isValidPemasokId(rawPemasokId) ? rawPemasokId : undefined}
      profile={profile}
    />
  );
}
