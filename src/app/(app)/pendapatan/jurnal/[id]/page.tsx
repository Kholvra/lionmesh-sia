import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { JurnalDetailScreen } from "@/modules/pendapatan/jurnal/detail-screen";

export const metadata: Metadata = {
  title: "Detail Jurnal Penjualan — Lionmesh SIA",
};

type JurnalDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JurnalDetailPage({
  params,
}: JurnalDetailPageProps) {
  const { id } = await params;
  const { profile } = await requireSesi();

  return <JurnalDetailScreen id={id} profile={profile} />;
}
