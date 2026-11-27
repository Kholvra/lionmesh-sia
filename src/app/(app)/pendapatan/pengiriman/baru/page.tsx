import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PengirimanBaruScreen } from "@/modules/pendapatan/pengiriman/baru-screen";

export const metadata: Metadata = {
  title: "Buat Pengiriman — Lionmesh SIA",
};

export default async function PengirimanBaruPage() {
  const { profile } = await requireSesi();
  return <PengirimanBaruScreen profile={profile} />;
}
