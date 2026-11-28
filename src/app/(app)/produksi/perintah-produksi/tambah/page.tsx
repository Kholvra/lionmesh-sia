import type { Metadata } from "next";
import { TambahPerintahProduksiScreen } from "@/modules/produksi/perintah-produksi/tambah-screen";

export const metadata: Metadata = {
  title: "Tambah Perintah Produksi — Lionmesh SIA",
};

export default function TambahPerintahProduksiPage() {
  return <TambahPerintahProduksiScreen />;
}
