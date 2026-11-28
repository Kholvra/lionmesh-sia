import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PesananBaruScreen } from "@/modules/pendapatan/pesanan/baru-screen";

export const metadata: Metadata = {
  title: "Buat Pesanan Penjualan — Lionmesh SIA",
};

export const instant = false;

export default async function PesananBaruPage() {
  const { profile } = await requireSesi();
  return <PesananBaruScreen profile={profile} />;
}
