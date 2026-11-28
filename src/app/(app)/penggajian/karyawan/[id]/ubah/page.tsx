import type { Metadata } from "next";

import { KaryawanUbahScreen } from "@/modules/penggajian/karyawan/form-screens";

export const instant = false;

export const metadata: Metadata = {
  title: "Ubah data karyawan — Lionmesh SIA",
};

export default async function UbahKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KaryawanUbahScreen id={id} />;
}
