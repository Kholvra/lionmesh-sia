import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PembayaranListScreen } from "@/modules/pendapatan/pembayaran/list-screen";

export const metadata: Metadata = {
  title: "Penerimaan Pembayaran — Lionmesh SIA",
};

type PembayaranPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

export const instant = false;

export default async function PembayaranPage({
  searchParams,
}: PembayaranPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const cari = Array.isArray(params.q) ? params.q[0] : params.q;
  const status = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  return (
    <PembayaranListScreen cari={cari} profile={profile} status={status} />
  );
}
