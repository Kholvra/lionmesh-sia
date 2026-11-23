"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { NAV_BAWAH, type GrupNav, type ItemNav } from "@/modules/penggajian/shell/nav";
import styles from "@/modules/penggajian/shell/shell.module.css";

type SidebarProps = {
  peran: string;
  grup: readonly GrupNav[];
};

function ItemSidebar({ item, aktif }: { item: ItemNav; aktif: boolean }) {
  if (!item.href) {
    return (
      <span aria-disabled="true" className={styles.item} title="Layar ini belum tersedia">
        {item.label}
      </span>
    );
  }
  return (
    <Link
      aria-current={aktif ? "page" : undefined}
      className={styles.item}
      href={item.href}
    >
      {item.label}
    </Link>
  );
}

export function Sidebar({ grup, peran }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function keluar() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const aktif = (item: ItemNav) =>
    Boolean(item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`)));

  return (
    <nav aria-label="Navigasi utama" className={styles.sidebar}>
      <div className={styles.brand}>
        <p className={styles.wordmark}>Lionmesh</p>
        <p className={styles.caption}>Sistem Informasi Akuntansi</p>
      </div>
      <div className={styles.actor}>
        <span className={styles.caption}>Masuk sebagai</span>
        <strong>{peran}</strong>
      </div>
      <div className={styles.menu}>
        {grup.map((g) => (
          <div className={styles.group} key={g.label ?? "utama"}>
            {g.label ? <p className={styles.groupLabel}>{g.label}</p> : null}
            {g.items.map((item) => (
              <ItemSidebar aktif={aktif(item)} item={item} key={item.label} />
            ))}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        {NAV_BAWAH.map((item) => (
          <ItemSidebar aktif={false} item={item} key={item.label} />
        ))}
        <button className={styles.item} onClick={keluar} type="button">
          Keluar
        </button>
      </div>
    </nav>
  );
}
