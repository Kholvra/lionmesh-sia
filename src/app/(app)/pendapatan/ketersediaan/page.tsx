import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { KetersediaanScreen } from "@/modules/pendapatan/pesanan/ketersediaan-screen";

export const metadata: Metadata = {
  title: "Ketersediaan Barang — Lionmesh SIA",
};

export const instant = false;

export default async function KetersediaanPage() {
  const { profile } = await requireSesi();
  return <KetersediaanScreen profile={profile} />;
}
