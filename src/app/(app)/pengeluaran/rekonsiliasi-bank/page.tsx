import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { RekonsiliasiScreen } from "@/modules/pengeluaran/rekonsiliasi/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Rekonsiliasi Bank — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    periode?: string | string[];
    rekening?: string | string[];
  }>;
};

function satu(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function RekonsiliasiBankPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  return (
    <RekonsiliasiScreen
      periode={satu(params.periode)}
      profile={profile}
      rekeningId={satu(params.rekening)}
    />
  );
}
