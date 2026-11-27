import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { KasScreen } from "@/modules/pendapatan/laporan/kas-screen";

export const metadata: Metadata = {
  title: "Laporan Penerimaan Kas — Lionmesh SIA",
};

type KasPageProps = {
  searchParams: Promise<{ periode?: string | string[] }>;
};

export default async function LaporanKasPage({ searchParams }: KasPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();
  const periode = Array.isArray(params.periode)
    ? params.periode[0]
    : params.periode;

  return <KasScreen periode={periode} profile={profile} />;
}
