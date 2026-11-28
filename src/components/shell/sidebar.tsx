"use client";

import { useId, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Factory,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { cekIzin } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";
import {
  bobotCocokRute,
  cocokRute,
  NAV_CYCLES,
  NAV_LEAVES,
  NAV_UTILITY,
  type NavCycle,
  type NavIcon,
  type NavItem,
} from "./nav";

import styles from "./sidebar.module.css";

export type NavStatus = "ready" | "loading" | "error" | "empty";

type SidebarProps = {
  nama: string;
  peran: Peran | null;
  status?: NavStatus;
  onRetry?: () => void;
};

// Lucide sizes mirror spacing tokens: space-4 for children, space-5 for rows.
const ICON_SIZE_SMALL = 16;
const ICON_SIZE = 20;

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  notifikasi: Bell,
  pendapatan: TrendingUp,
  pengeluaran: TrendingDown,
  produksi: Factory,
  penggajian: Wallet,
  laporan: FileText,
  periode: CalendarClock,
  pengaturan: Settings,
};

const SKELETON_ROWS = 7;

function NavIconView({ name, small = false }: { name: NavIcon; small?: boolean }) {
  const IconComponent = ICONS[name];
  return (
    <IconComponent
      aria-hidden="true"
      className={styles.icon}
      size={small ? ICON_SIZE_SMALL : ICON_SIZE}
    />
  );
}

function Leaf({ item, aktif }: { item: NavItem; aktif: boolean }) {
  return (
    <li>
      <Link
        aria-current={aktif ? "page" : undefined}
        className={aktif ? `${styles.row} ${styles.rowActive}` : styles.row}
        href={item.href}
      >
        <NavIconView name={item.icon} />
        <span className={styles.label}>{item.label}</span>
      </Link>
    </li>
  );
}

function Child({ item, aktif }: { item: NavItem; aktif: boolean }) {
  if (!item.tersedia) {
    return (
      <li>
        <span
          aria-disabled="true"
          className={styles.childDisabled}
          title={`${item.label} — segera hadir`}
        >
          <NavIconView name={item.icon} small />
          <span className={styles.label}>{item.label}</span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        aria-current={aktif ? "page" : undefined}
        className={
          aktif ? `${styles.childRow} ${styles.childActive}` : styles.childRow
        }
        href={item.href}
      >
        <NavIconView name={item.icon} small />
        <span className={styles.label}>{item.label}</span>
      </Link>
    </li>
  );
}

type CycleProps = {
  cycle: NavCycle;
  dibuka: boolean;
  aktif: boolean;
  aktifHref: string | undefined;
  panelId: string;
  onToggle: () => void;
};

function Cycle({ cycle, dibuka, aktif, aktifHref, panelId, onToggle }: CycleProps) {
  const tampilBadge = !cycle.tersedia && !dibuka && !aktif;

  return (
    <li>
      <button
        aria-controls={panelId}
        aria-expanded={dibuka}
        className={aktif ? `${styles.row} ${styles.rowActive}` : styles.row}
        onClick={onToggle}
        type="button"
      >
        <NavIconView name={cycle.icon} />
        <span className={styles.label}>{cycle.label}</span>
        {tampilBadge ? <span className={styles.badge}>BELUM</span> : null}
      </button>
      <div
        className={dibuka ? `${styles.panel} ${styles.panelOpen}` : styles.panel}
        id={panelId}
        inert={!dibuka}
      >
        <div className={styles.panelInner}>
          <ul aria-label={`Halaman ${cycle.label}`} className={styles.children}>
            {cycle.children.map((child) => (
              <Child aktif={child.href === aktifHref} item={child} key={child.href} />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

function NavLoading() {
  return (
    <div aria-busy="true" className={styles.loading} role="status">
      <p className={styles.loadingText}>Memuat navigasi…</p>
      <ul aria-hidden="true" className={styles.skeletonList}>
        {Array.from({ length: SKELETON_ROWS }, (_, indeks) => (
          <li className={styles.skeletonItem} key={indeks}>
            <span
              className={styles.skeletonBar}
              style={{ "--skeleton-index": indeks } as CSSProperties}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavNotice({
  kind,
  onRetry,
}: {
  kind: "error" | "empty";
  onRetry: () => void;
}) {
  const gagal = kind === "error";

  return (
    <div className={styles.notice} role={gagal ? "alert" : "status"}>
      <p className={styles.noticeTitle}>
        {gagal ? "Navigasi gagal dimuat." : "Belum ada navigasi tersedia."}
      </p>
      <p className={styles.noticeText}>
        {gagal
          ? "Periksa koneksi, lalu coba muat ulang navigasi."
          : "Peran ini belum memiliki halaman yang dapat dibuka."}
      </p>
      <button className={styles.retry} onClick={onRetry} type="button">
        Coba lagi
      </button>
    </div>
  );
}

type NavTreeProps = {
  cycles: readonly NavCycle[];
  leaves: readonly NavItem[];
  utility: readonly NavItem[];
  aktifHref: string | undefined;
  siklusAktif: string | undefined;
  siklusAwal: string | undefined;
  panelPrefix: string;
};

function NavTree({
  cycles,
  leaves,
  utility,
  aktifHref,
  siklusAktif,
  siklusAwal,
  panelPrefix,
}: NavTreeProps) {
  const [dibuka, setDibuka] = useState<string | null>(siklusAwal ?? null);

  return (
    <>
      <ul aria-label="Navigasi siklus" className={styles.group}>
        {leaves.map((item) =>
          item.href === "/" ? (
            <Leaf aktif={item.href === aktifHref} item={item} key={item.href} />
          ) : null,
        )}
        {cycles.map((cycle) => (
          <Cycle
            aktif={cycle.id === siklusAktif}
            aktifHref={aktifHref}
            cycle={cycle}
            dibuka={cycle.id === dibuka}
            key={cycle.id}
            onToggle={() =>
              setDibuka((sekarang) => (sekarang === cycle.id ? null : cycle.id))
            }
            panelId={`${panelPrefix}-${cycle.id}`}
          />
        ))}
        {leaves.map((item) =>
          item.href !== "/" ? (
            <Leaf aktif={item.href === aktifHref} item={item} key={item.href} />
          ) : null,
        )}
      </ul>

      <ul aria-label="Navigasi pendukung" className={`${styles.group} ${styles.utility}`}>
        {utility.map((item) => (
          <Leaf aktif={item.href === aktifHref} item={item} key={item.href} />
        ))}
      </ul>
    </>
  );
}

export function Sidebar({
  nama,
  peran,
  status = "ready",
  onRetry,
}: SidebarProps) {
  const pathname = usePathname();
  const panelPrefix = useId();
  const cycles = NAV_CYCLES.filter(
    (cycle) => !cycle.aksi || cekIzin(peran, cycle.aksi),
  ).map((cycle) => ({
    ...cycle,
    children: cycle.children.filter(
      (child) => !child.aksi || cekIzin(peran, child.aksi),
    ),
  }));
  const leaves = NAV_LEAVES.filter(
    (item) => !item.aksi || cekIzin(peran, item.aksi),
  );
  const utility = NAV_UTILITY.filter(
    (item) => !item.aksi || cekIzin(peran, item.aksi),
  );

  const items = [
    ...cycles,
    ...cycles.flatMap((cycle) => cycle.children),
    ...leaves,
    ...utility,
  ];
  const aktifHref = items
    .map((item) => ({
      href: item.href,
      bobot: item.tersedia ? bobotCocokRute(pathname, item.href) : 0,
    }))
    .filter((kandidat) => kandidat.bobot > 0)
    .sort((a, b) => b.bobot - a.bobot)[0]?.href;
  const siklusAktif = cycles.find(
    (cycle) =>
      cycle.href === aktifHref ||
      cycle.children.some((child) => child.href === aktifHref),
  )?.id;
  const siklusAwal = cycles.find((cycle) => cocokRute(pathname, cycle.href))?.id;

  const kosong =
    cycles.length === 0 && leaves.length === 0 && utility.length === 0;
  const tampilan = status === "ready" && kosong ? "empty" : status;
  const cobaLagi = onRetry ?? (() => window.location.reload());

  return (
    <nav aria-label="Navigasi utama" className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.wordmark}>Lionmesh</span>
        <span className={styles.caption}>Sistem Informasi Akuntansi</span>
      </div>

      {tampilan === "ready" ? (
        <NavTree
          aktifHref={aktifHref}
          cycles={cycles}
          key={siklusAwal ?? "tanpa-siklus"}
          leaves={leaves}
          panelPrefix={panelPrefix}
          siklusAktif={siklusAktif}
          siklusAwal={siklusAwal}
          utility={utility}
        />
      ) : tampilan === "loading" ? (
        <NavLoading />
      ) : (
        <NavNotice kind={tampilan === "error" ? "error" : "empty"} onRetry={cobaLagi} />
      )}

      <div className={styles.footer}>
        <p className={styles.userName}>{nama}</p>
        <p className={styles.userRole}>{peran ?? "Belum memiliki peran"}</p>
        <p className={styles.company}>PT Lionmesh Prima Tbk</p>
        <SignOutButton />
      </div>
    </nav>
  );
}
