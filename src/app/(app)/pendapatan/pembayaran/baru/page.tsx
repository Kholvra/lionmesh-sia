import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { PembayaranBaruScreen } from "@/modules/pendapatan/pembayaran/baru-screen";

export const metadata: Metadata = {
  title: "Catat Pembayaran Pelanggan — Lionmesh SIA",
};

export const instant = false;

export default async function PembayaranBaruPage() {
  const { profile } = await requireSesi();
  return <PembayaranBaruScreen profile={profile} />;
}
