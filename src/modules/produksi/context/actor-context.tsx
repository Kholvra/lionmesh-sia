"use client";

import React, { createContext, useContext } from "react";
import type { Peran } from "@/lib/auth/types";
import {
  canActorPerform,
  PRODUKSI_ACTORS,
  type ProduksiAction,
} from "../auth/actor";

interface ProduksiActorContextType {
  activeRole: Peran | null;
  can: (action: ProduksiAction) => boolean;
  activeActorInfo: (typeof PRODUKSI_ACTORS)[number] | null;
}

const ProduksiActorContext = createContext<ProduksiActorContextType | null>(null);

const AKSES_DITOLAK: ProduksiActorContextType = {
  activeRole: null,
  can: () => false,
  activeActorInfo: null,
};

export function ProduksiActorProvider({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole?: Peran | null;
}) {
  const activeRole = userRole ?? null;
  const peranAksi = PRODUKSI_ACTORS.some((a) => a.role === activeRole)
    ? activeRole
    : null;

  const can = (action: ProduksiAction) => canActorPerform(peranAksi, action);
  const activeActorInfo =
    PRODUKSI_ACTORS.find((a) => a.role === peranAksi) ?? null;

  return (
    <ProduksiActorContext.Provider value={{ activeRole, can, activeActorInfo }}>
      {children}
    </ProduksiActorContext.Provider>
  );
}

export function useProduksiActor(): ProduksiActorContextType {
  return useContext(ProduksiActorContext) ?? AKSES_DITOLAK;
}
