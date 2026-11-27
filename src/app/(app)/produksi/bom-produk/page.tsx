import type { Metadata } from "next";
import { BomProdukScreen } from "@/modules/produksi/bom-produk/screen";

export const metadata: Metadata = {
  title: "BOM Produk — Lionmesh SIA",
};

export default function BomProdukPage() {
  return <BomProdukScreen />;
}
