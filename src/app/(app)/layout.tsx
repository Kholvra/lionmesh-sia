import type { ReactNode } from "react";

import { Sidebar } from "@/components/shell/sidebar";
import { requireSesi } from "@/lib/auth/server";

import styles from "./layout.module.css";

// The shell reads the session cookie, so it cannot be prerendered.
export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
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
