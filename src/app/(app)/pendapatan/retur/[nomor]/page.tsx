import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { ReturDetailScreen } from "@/modules/pendapatan/retur/detail-screen";

export const metadata: Metadata = {
  title: "Detail Retur Penjualan — Lionmesh SIA",
};

type ReturDetailPageProps = {
  params: Promise<{ nomor: string }>;
};

export const instant = false;

export default async function ReturDetailPage({
  params,
}: ReturDetailPageProps) {
  const { nomor } = await params;
  const { profile } = await requireSesi();

  return (
    <ReturDetailScreen
      idOrNomor={decodeURIComponent(nomor)}
      profile={profile}
    />
  );
}
