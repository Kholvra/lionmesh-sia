import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { ReturListScreen } from "@/modules/pendapatan/retur/list-screen";

export const metadata: Metadata = {
  title: "Retur Penjualan — Lionmesh SIA",
};

type ReturPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

export const instant = false;

export default async function ReturPage({ searchParams }: ReturPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const cari = Array.isArray(params.q) ? params.q[0] : params.q;
  const status = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  return <ReturListScreen cari={cari} profile={profile} status={status} />;
}
