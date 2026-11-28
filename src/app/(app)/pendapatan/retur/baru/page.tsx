import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { ReturBaruScreen } from "@/modules/pendapatan/retur/baru-screen";

export const metadata: Metadata = {
  title: "Ajukan Retur Penjualan — Lionmesh SIA",
};

export const instant = false;

export default async function ReturBaruPage() {
  const { profile } = await requireSesi();
  return <ReturBaruScreen profile={profile} />;
}
