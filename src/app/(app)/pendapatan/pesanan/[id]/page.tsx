import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireSesi } from "@/lib/auth/server";
import { PesananDetailScreen } from "@/modules/pendapatan/pesanan/detail-screen";
import { isValidUuid } from "@/modules/pendapatan/pesanan/schema";

export const metadata: Metadata = {
  title: "Detail Pesanan Penjualan — Lionmesh SIA",
};

type PesananDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string | string[] }>;
};

export const instant = false;

export default async function PesananDetailPage({
  params,
  searchParams,
}: PesananDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const { profile } = await requireSesi();

  if (!isValidUuid(id)) {
    notFound();
  }

  const mode = Array.isArray(sp.mode) ? sp.mode[0] : sp.mode;

  return <PesananDetailScreen mode={mode} pesananId={id} profile={profile} />;
}
