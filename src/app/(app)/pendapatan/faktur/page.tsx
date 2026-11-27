import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { FakturListScreen } from "@/modules/pendapatan/faktur/list-screen";

export const metadata: Metadata = {
  title: "Faktur Penjualan — Lionmesh SIA",
};

type FakturPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

export default async function FakturPage({ searchParams }: FakturPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const cari = Array.isArray(params.q) ? params.q[0] : params.q;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  return <FakturListScreen cari={cari} profile={profile} status={status} />;
}
