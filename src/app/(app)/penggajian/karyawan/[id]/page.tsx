import type { Metadata } from "next";

import { firstParam } from "@/lib/first-param";
import { KaryawanDetailScreen } from "@/modules/penggajian/karyawan/detail-screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Detail karyawan — Lionmesh SIA",
};

export default async function DetailKaryawanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pesan?: string | string[] }>;
}) {
  const [{ id }, { pesan }] = await Promise.all([params, searchParams]);
  return <KaryawanDetailScreen id={id} pesan={firstParam(pesan, { takeFirst: false })} />;
}
