import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { FakturDetailScreen } from "@/modules/pendapatan/faktur/detail-screen";

export const metadata: Metadata = {
  title: "Detail Faktur Penjualan — Lionmesh SIA",
};

type FakturDetailPageProps = {
  params: Promise<{ nomor: string }>;
};

export default async function FakturDetailPage({
  params,
}: FakturDetailPageProps) {
  const { nomor } = await params;
  const { profile } = await requireSesi();

  return (
    <FakturDetailScreen
      idOrNomor={decodeURIComponent(nomor)}
      profile={profile}
    />
  );
}
