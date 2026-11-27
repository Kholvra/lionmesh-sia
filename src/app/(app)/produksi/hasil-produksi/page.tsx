import type { Metadata } from "next";
import { HasilProduksiScreen } from "@/modules/produksi/hasil-produksi/screen";

export const metadata: Metadata = {
  title: "Hasil Produksi — Lionmesh SIA",
};

export default function HasilProduksiPage() {
  return <HasilProduksiScreen />;
}
