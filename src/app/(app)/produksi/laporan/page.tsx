import type { Metadata } from "next";
import { LaporanProduksiScreen } from "@/modules/produksi/laporan/screen";

export const metadata: Metadata = {
  title: "Laporan Produksi & Efisiensi · Produksi · Lionmesh SIA",
  description: "Laporan produksi, yield, efisiensi bahan, WIP, dan rekap persediaan",
};

export default function LaporanProduksiPage() {
  return <LaporanProduksiScreen />;
}
