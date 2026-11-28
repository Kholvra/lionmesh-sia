import type { Metadata } from "next";
import { DaftarPembelianBahanScreen } from "@/modules/produksi/pembelian-bahan/daftar-screen";

export const metadata: Metadata = {
  title: "Daftar Pembelian Bahan — Lionmesh SIA",
};

export default function DaftarPembelianBahanPage() {
  return <DaftarPembelianBahanScreen />;
}
