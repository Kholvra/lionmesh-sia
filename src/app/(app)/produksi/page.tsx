import type { Metadata } from "next";
import { ProduksiHubScreen } from "@/modules/produksi/hub/screen";

export const metadata: Metadata = {
  title: "Siklus Produksi — Lionmesh SIA",
};

export default function ProduksiPage() {
  return <ProduksiHubScreen />;
}
