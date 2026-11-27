import type { Metadata } from "next";

import { KaryawanStatusScreen } from "@/modules/penggajian/karyawan/form-screens";

export const instant = false;

export const metadata: Metadata = {
  title: "Nonaktifkan karyawan — Lionmesh SIA",
};

export default async function StatusKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KaryawanStatusScreen id={id} />;
}
