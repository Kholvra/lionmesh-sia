import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { JurnalListScreen } from "@/modules/pendapatan/jurnal/screen";

export const metadata: Metadata = {
  title: "Jurnal Penjualan & HPP — Lionmesh SIA",
};

type JurnalPageProps = {
  searchParams: Promise<{
    sumber?: string | string[];
    q?: string | string[];
  }>;
};

export default async function JurnalPage({ searchParams }: JurnalPageProps) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  const sumberTipe = Array.isArray(params.sumber)
    ? params.sumber[0]
    : params.sumber;
  const cari = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <JurnalListScreen
      cari={cari}
      profile={profile}
      sumberTipe={sumberTipe}
    />
  );
}
