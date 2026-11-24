import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { isValidPelangganId } from "@/modules/pendapatan/pelanggan/schema";
import { PelangganScreen } from "@/modules/pendapatan/pelanggan/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Pelanggan — Lionmesh SIA",
};

type PelangganPageProps = {
  searchParams: Promise<{
    pelanggan?: string | string[];
    mode?: string | string[];
    q?: string | string[];
  }>;
};

export default async function PelangganPage({ searchParams }: PelangganPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const rawPelangganId = Array.isArray(params.pelanggan)
    ? params.pelanggan[0]
    : params.pelanggan;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const rawCari = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <PelangganScreen
      cari={rawCari}
      mode={rawMode}
      pelangganId={isValidPelangganId(rawPelangganId) ? rawPelangganId : undefined}
      profile={profile}
    />
  );
}
