import type { Metadata } from "next";
import { PembelianBahanScreen } from "@/modules/produksi/pembelian-bahan/screen";

export const metadata: Metadata = {
  title: "Ajukan Pembelian Bahan — Lionmesh SIA",
};

export default function PembelianBahanPage() {
  return <PembelianBahanScreen />;
}
