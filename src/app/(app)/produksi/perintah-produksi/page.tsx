import type { Metadata } from "next";
import { PerintahProduksiScreen } from "@/modules/produksi/perintah-produksi/screen";

export const metadata: Metadata = {
  title: "Perintah Produksi — Lionmesh SIA",
};

export default function PerintahProduksiPage() {
  return <PerintahProduksiScreen />;
}
