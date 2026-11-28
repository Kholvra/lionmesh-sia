import { Suspense, type ReactNode } from "react";

import { Sidebar } from "@/components/shell/sidebar";
import { requireSesi } from "@/lib/auth/server";

import styles from "./layout.module.css";

// The shell reads the session cookie, so it cannot be prerendered.
export const instant = false;

async function AppShell({ children }: { children: ReactNode }) {
  const { profile } = await requireSesi();

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#konten">
        Lewati ke konten
      </a>
      <Sidebar
        nama={profile.display_name ?? "Pengguna"}
        peran={profile.peran}
      />
      <main className={styles.main} id="konten">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className={styles.shell} />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
