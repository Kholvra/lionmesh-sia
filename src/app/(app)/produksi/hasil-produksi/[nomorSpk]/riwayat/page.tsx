import type { Metadata } from "next";
import { RiwayatHasilSpkScreen } from "@/modules/produksi/hasil-produksi/riwayat-screen";

export const metadata: Metadata = {
  title: "Riwayat Hasil SPK — Lionmesh SIA",
};

type PageProps = {
  params: Promise<{ nomorSpk: string }>;
};

export default async function RiwayatHasilSpkPage({ params }: PageProps) {
  const { nomorSpk } = await params;
  return <RiwayatHasilSpkScreen nomorSpk={nomorSpk} />;
}
