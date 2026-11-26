import { notFound } from "next/navigation";

import { cekIzin } from "@/lib/auth/permissions";
import { requireSesi } from "@/lib/auth/server";
import { AksesDitolak } from "../components/laporan-shell";
import { isLaporanSlug } from "../daftar-laporan";
import { LaporanScreen } from "../screen";
import type { LaporanParams } from "../screens/shared";

export const instant = false;

interface PageProps {
  params: Promise<{ laporan: string }>;
  searchParams: Promise<LaporanParams>;
}

export default async function LaporanPage({ params, searchParams }: PageProps) {
  const { laporan } = await params;
  if (!isLaporanSlug(laporan)) notFound();

  const { profile } = await requireSesi();
  if (!cekIzin(profile.peran, "lihat_laporan_keuangan")) {
    return <AksesDitolak />;
  }

  const query = await searchParams;
  return <LaporanScreen params={query} profil={profile} slug={laporan} />;
}
