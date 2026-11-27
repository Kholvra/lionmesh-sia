"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { cekIzin } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";
import {
  cocokRute,
  NAV_PRIMARY,
  NAV_UTILITY,
  type NavIcon,
  type NavItem,
} from "./nav";

import styles from "./sidebar.module.css";

const ICON_PATHS: Record<NavIcon, string> = {
  dashboard:
    "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z",
  notifikasi:
    "M12 4a5 5 0 0 0-5 5v3.5L5 17h14l-2-4.5V9a5 5 0 0 0-5-5Zm0 17a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z",
  pendapatan: "M12 3v18M8 7h6a3 3 0 0 1 0 6H8m0 0h7",
  pengeluaran:
    "M3 7h18v10H3V7Zm14 5h2M3 10h18",
  produksi:
    "M4 20V9l5 3V9l5 3V4h6v16H4Z",
  penggajian:
    "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-7a4 4 0 0 1 0 7.7",
  laporan:
    "M4 20V6m0 14h16M8 16V9m4 7v-4m4 4V7",
  periode:
    "M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  pengaturan:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.4 7.4 0 0 0-2-1.2L14.6 3h-4l-.4 2.5a7.4 7.4 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.4 7.4 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
};

function Icon({ name }: { name: NavIcon }) {
  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export function Sidebar({
  nama,
  peran,
}: {
  nama: string;
  peran: Peran | null;
}) {
  const pathname = usePathname();
  const primary = NAV_PRIMARY.filter((item) => !item.aksi || cekIzin(peran, item.aksi));
  const utility = NAV_UTILITY.filter((item) => !item.aksi || cekIzin(peran, item.aksi));
  // Keep the parent section active on child screens, matching the shell
  // pattern: Laporan stays orange while /laporan/periode is open.
  const activeHref = [...primary, ...utility].find(
    (item) => item.tersedia && cocokRute(pathname, item.href),
  )?.href;

  function renderItem(item: NavItem) {
    const aktif = item.href === activeHref;

    if (!item.tersedia) {
      return (
        <li key={item.href}>
          <span className={styles.itemDisabled} title="Belum tersedia">
            <Icon name={item.icon} />
            <span className={styles.label}>{item.label}</span>
            <span className={styles.soon}>belum</span>
          </span>
        </li>
      );
    }

    return (
      <li key={item.href}>
        <Link
          aria-current={aktif ? "page" : undefined}
          className={aktif ? `${styles.item} ${styles.itemActive}` : styles.item}
          href={item.href}
        >
          <Icon name={item.icon} />
          <span className={styles.label}>{item.label}</span>
        </Link>
      </li>
    );
  }

  return (
    <nav aria-label="Navigasi utama" className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.wordmark}>Lionmesh</span>
        <span className={styles.caption}>Sistem Informasi Akuntansi</span>
      </div>

      <ul className={styles.group}>{primary.map(renderItem)}</ul>

      <ul className={`${styles.group} ${styles.utility}`}>
        {utility.map(renderItem)}
      </ul>

      <div className={styles.footer}>
        <p className={styles.userName}>{nama}</p>
        <p className={styles.userRole}>{peran ?? "Belum memiliki peran"}</p>
        <p className={styles.company}>PT Lionmesh Prima Tbk</p>
        <SignOutButton />
      </div>
    </nav>
  );
}
