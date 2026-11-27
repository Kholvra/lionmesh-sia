import type { Metadata } from "next";
import { DetailSpkScreen } from "@/modules/produksi/perintah-produksi/detail-screen";

export const metadata: Metadata = {
  title: "Detail SPK — Lionmesh SIA",
};

type PageProps = {
  params: Promise<{ nomorSpk: string }>;
};

export default async function DetailSpkPage({ params }: PageProps) {
  const { nomorSpk } = await params;
  return <DetailSpkScreen nomorSpk={nomorSpk} />;
}
