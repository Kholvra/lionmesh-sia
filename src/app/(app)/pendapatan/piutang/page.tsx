import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PiutangScreen } from "@/modules/pendapatan/faktur/piutang-screen";

export const metadata: Metadata = {
  title: "Daftar Piutang & Aging — Lionmesh SIA",
};

type PiutangPageProps = {
  searchParams: Promise<{
    tanggal?: string | string[];
    q?: string | string[];
  }>;
};

export const instant = false;

export default async function PiutangPage({ searchParams }: PiutangPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const today = new Date().toISOString().split("T")[0];
  const rawTanggal = Array.isArray(params.tanggal)
    ? params.tanggal[0]
    : params.tanggal;
  const rawCari = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <PiutangScreen
      cari={rawCari}
      profile={profile}
      tanggal={rawTanggal || today}
    />
  );
}
