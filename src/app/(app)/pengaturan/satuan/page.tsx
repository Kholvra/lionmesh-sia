import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { firstParam } from "@/lib/first-param";
import { SatuanScreen } from "@/modules/core/master/satuan/screen";
import { isValidMasterId } from "@/modules/core/master/schema";

export const instant = false;

export const metadata: Metadata = {
  title: "Master satuan — Lionmesh SIA",
};

type MasterPageProps = {
  searchParams: Promise<{
    id?: string | string[];
    mode?: string | string[];
  }>;
};

export default async function MasterPage({ searchParams }: MasterPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const rawId = firstParam(params.id);
  const rawMode = firstParam(params.mode);

  return (
    <SatuanScreen
      satuanId={isValidMasterId(rawId) ? rawId : undefined}
      mode={rawMode === "edit" ? "edit" : undefined}
      profile={profile}
    />
  );
}
