import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PembayaranDetailScreen } from "@/modules/pendapatan/pembayaran/detail-screen";

export const metadata: Metadata = {
  title: "Detail Penerimaan Pembayaran — Lionmesh SIA",
};

type PembayaranDetailPageProps = {
  params: Promise<{ nomor: string }>;
};

export default async function PembayaranDetailPage({
  params,
}: PembayaranDetailPageProps) {
  const { nomor } = await params;
  const { profile } = await requireSesi();

  return (
    <PembayaranDetailScreen
      idOrNomor={decodeURIComponent(nomor)}
      profile={profile}
    />
  );
}
