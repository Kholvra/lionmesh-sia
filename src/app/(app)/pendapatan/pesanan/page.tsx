import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PesananListScreen } from "@/modules/pendapatan/pesanan/list-screen";

export const metadata: Metadata = {
  title: "Pesanan Penjualan — Lionmesh SIA",
};

type PesananListPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

export default async function PesananListPage({
  searchParams,
}: PesananListPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const cari = Array.isArray(params.q) ? params.q[0] : params.q;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;

  return <PesananListScreen cari={cari} profile={profile} status={status} />;
}
