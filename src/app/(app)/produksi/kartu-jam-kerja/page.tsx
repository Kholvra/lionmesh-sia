import type { Metadata } from "next";
import { KartuJamKerjaScreen } from "@/modules/produksi/kartu-jam-kerja/screen";

export const metadata: Metadata = {
  title: "Kartu Jam Kerja & HPP · Produksi · Lionmesh SIA",
  description: "Pencatatan kartu jam kerja TKL dan kalkulasi HPP produk",
};

export default function KartuJamKerjaPage() {
  return <KartuJamKerjaScreen />;
}
