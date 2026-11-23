import { connection } from "next/server";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { requireSesi } from "@/lib/auth";
import { navUntuk } from "@/modules/penggajian/shell/nav";
import styles from "@/modules/penggajian/shell/shell.module.css";
import { Sidebar } from "@/modules/penggajian/shell/sidebar";

async function SidebarSesi() {
  // The session read uses the clock, so it must run at request time.
  await connection();
  const { profile } = await requireSesi();
  return <Sidebar grup={navUntuk(profile.peran)} peran={profile.peran ?? "Belum ada peran"} />;
}

export function PenggajianShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Suspense fallback={<div aria-hidden="true" className={styles.skeleton} />}>
        <SidebarSesi />
      </Suspense>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
