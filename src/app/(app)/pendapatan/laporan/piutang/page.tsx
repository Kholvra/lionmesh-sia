import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PiutangLaporanScreen } from "@/modules/pendapatan/laporan/piutang-screen";

export const metadata: Metadata = {
  title: "Laporan Piutang & Aging — Lionmesh SIA",
};

type PiutangPageProps = {
  searchParams: Promise<{ tanggal?: string | string[] }>;
};

export default async function LaporanPiutangPage({
  searchParams,
}: PiutangPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();
  const tanggal = Array.isArray(params.tanggal)
    ? params.tanggal[0]
    : params.tanggal;

  return <PiutangLaporanScreen profile={profile} tanggal={tanggal} />;
}
