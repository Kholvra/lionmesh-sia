import type { Metadata } from "next";

import { KaryawanTambahScreen } from "@/modules/penggajian/karyawan/form-screens";

export const instant = false;

export const metadata: Metadata = {
  title: "Tambah karyawan — Lionmesh SIA",
};

export default function TambahKaryawanPage() {
  return <KaryawanTambahScreen />;
}
