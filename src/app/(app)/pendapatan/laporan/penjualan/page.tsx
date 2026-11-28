import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PenjualanScreen } from "@/modules/pendapatan/laporan/penjualan-screen";

export const metadata: Metadata = {
  title: "Laporan Penjualan — Lionmesh SIA",
};

type PenjualanPageProps = {
  searchParams: Promise<{ periode?: string | string[] }>;
};

export const instant = false;

export default async function LaporanPenjualanPage({
  searchParams,
}: PenjualanPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();
  const periode = Array.isArray(params.periode)
    ? params.periode[0]
    : params.periode;

  return <PenjualanScreen periode={periode} profile={profile} />;
}
