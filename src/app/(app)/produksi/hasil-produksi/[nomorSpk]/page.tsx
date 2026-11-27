import type { Metadata } from "next";
import { CatatHasilSpkScreen } from "@/modules/produksi/hasil-produksi/detail-screen";

export const metadata: Metadata = {
  title: "Catat Hasil SPK — Lionmesh SIA",
};

type PageProps = {
  params: Promise<{ nomorSpk: string }>;
};

export default async function CatatHasilSpkPage({ params }: PageProps) {
  const { nomorSpk } = await params;
  return <CatatHasilSpkScreen nomorSpk={nomorSpk} />;
}
