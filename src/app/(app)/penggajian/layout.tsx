import type { ReactNode } from "react";

import { PenggajianShell } from "@/modules/penggajian/shell/penggajian-shell";

export default function PenggajianLayout({ children }: { children: ReactNode }) {
  return <PenggajianShell>{children}</PenggajianShell>;
}
