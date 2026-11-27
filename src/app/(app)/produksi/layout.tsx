import { connection } from "next/server";
import type { ReactNode } from "react";
import { requireSesi } from "@/lib/auth/server";
import { ProduksiActorProvider } from "@/modules/produksi/context/actor-context";

export default async function ProduksiLayout({ children }: { children: ReactNode }) {
  await connection();
  const { profile } = await requireSesi();

  return (
    <ProduksiActorProvider userRole={profile.peran}>
      {children}
    </ProduksiActorProvider>
  );
}
