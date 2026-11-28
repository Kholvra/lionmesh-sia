import type { Metadata } from "next";
import { DetailHppScreen } from "@/modules/produksi/kartu-jam-kerja/detail-hpp-screen";

export const metadata: Metadata = {
  title: "Rincian HPP Perintah Produksi · Lionmesh SIA",
  description: "Rincian kalkulasi HPP dan simulasi jurnal akuntansi biaya",
};

export default function DetailHppPage() {
  return <DetailHppScreen />;
}
