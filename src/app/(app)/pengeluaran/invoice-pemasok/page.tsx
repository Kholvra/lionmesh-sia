import type { Metadata } from "next";

import { requireSesi } from "@/lib/auth/server";
import { InvoiceScreen } from "@/modules/pengeluaran/invoice/screen";

export const instant = false;

export const metadata: Metadata = {
  title: "Invoice Pemasok — Lionmesh SIA",
};

type Props = {
  searchParams: Promise<{
    invoice?: string | string[];
    penerimaan?: string | string[];
  }>;
};

function satu(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function InvoicePemasokPage({ searchParams }: Props) {
  const params = await searchParams;
  const { profile } = await requireSesi();

  return (
    <InvoiceScreen
      invoiceId={satu(params.invoice)}
      penerimaanId={satu(params.penerimaan)}
      profile={profile}
    />
  );
}
