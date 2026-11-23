import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { MataUangScreen } from "@/modules/core/master/mata-uang/screen";
import { isValidMasterId } from "@/modules/core/master/schema";

export const instant = false;

export const metadata: Metadata = {
  title: "Mata uang dan kurs — Lionmesh SIA",
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

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;

  return (
    <MataUangScreen
      mataUangId={isValidMasterId(rawId) ? rawId : undefined}
      mode={rawMode === "edit" ? "edit" : undefined}
      profile={profile}
    />
  );
}
