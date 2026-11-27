import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { FakturBaruScreen } from "@/modules/pendapatan/faktur/baru-screen";

export const metadata: Metadata = {
  title: "Buat Faktur Penjualan — Lionmesh SIA",
};

export default async function FakturBaruPage() {
  const { profile } = await requireSesi();
  return <FakturBaruScreen profile={profile} />;
}
