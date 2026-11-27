import type { Metadata } from "next";
import { VersiBomBaruScreen } from "@/modules/produksi/bom-produk/versi-baru-screen";

export const metadata: Metadata = {
  title: "Versi BOM Baru — Lionmesh SIA",
};

export default function VersiBomBaruPage() {
  return <VersiBomBaruScreen />;
}
