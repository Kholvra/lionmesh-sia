import type { Metadata } from "next";

import { KaryawanListScreen } from "@/modules/penggajian/karyawan/list-screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Data karyawan — Lionmesh SIA",
};

export default function KaryawanPage() {
  return <KaryawanListScreen />;
}
