import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PengirimanDetailScreen } from "@/modules/pendapatan/pengiriman/detail-screen";

export const metadata: Metadata = {
  title: "Detail Surat Jalan — Lionmesh SIA",
};

type PengirimanDetailPageProps = {
  params: Promise<{ nomor: string }>;
};

export default async function PengirimanDetailPage({
  params,
}: PengirimanDetailPageProps) {
  const { nomor } = await params;
  const { profile } = await requireSesi();

  return (
    <PengirimanDetailScreen
      idOrNomor={decodeURIComponent(nomor)}
      profile={profile}
    />
  );
}
