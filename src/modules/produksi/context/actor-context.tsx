"use client";

import React, { createContext, useContext } from "react";
import type { Peran } from "@/lib/auth/types";
import {
  canActorPerform,
  PRODUKSI_ACTORS,
  type ProduksiAction,
  type ProduksiActorRole,
} from "../auth/actor";

interface ProduksiActorContextType {
  activeRole: ProduksiActorRole;
  can: (action: ProduksiAction) => boolean;
  activeActorInfo: (typeof PRODUKSI_ACTORS)[number];
}

const ProduksiActorContext = createContext<ProduksiActorContextType | null>(null);

export function ProduksiActorProvider({
  children,
  userRole,
}: {
  children: React.ReactNode;
  userRole?: Peran | null;
}) {
  const activeRole: ProduksiActorRole =
    userRole && PRODUKSI_ACTORS.some((a) => a.role === userRole)
      ? (userRole as ProduksiActorRole)
      : "Produksi";

  const can = (action: ProduksiAction) => canActorPerform(activeRole, action);

  const activeActorInfo =
    PRODUKSI_ACTORS.find((a) => a.role === activeRole) ?? PRODUKSI_ACTORS[0];

  return (
    <ProduksiActorContext.Provider
      value={{
        activeRole,
        can,
        activeActorInfo,
      }}
    >
      {children}
    </ProduksiActorContext.Provider>
  );
}

export function useProduksiActor() {
  const context = useContext(ProduksiActorContext);
  if (!context) {
    return {
      activeRole: "Produksi" as ProduksiActorRole,
      can: (action: ProduksiAction) => canActorPerform("Produksi", action),
      activeActorInfo: PRODUKSI_ACTORS[0],
    };
  }
  return context;
}
