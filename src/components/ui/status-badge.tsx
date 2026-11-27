"use client";

import { useEffect } from "react";

import styles from "@/components/ui/status-badge.module.css";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type StatusOption = {
  value: string;
  label: string;
  tone: StatusTone;
};

export type StatusBadgeProps = {
  status: string;
  statuses: readonly StatusOption[];
  className?: string;
  onInvalidStatus?: (status: string) => void;
  variant?: "default" | "compact";
};

export const STATUS_PERINTAH_PRODUKSI: readonly StatusOption[] = [
  { value: "DIRENCANAKAN", label: "Direncanakan", tone: "neutral" },
  { value: "MENUNGGU_BAHAN", label: "Menunggu bahan", tone: "info" },
  { value: "DIPROSES", label: "Diproses", tone: "warning" },
  { value: "MENUNGGU_QC", label: "Menunggu QC", tone: "warning" },
  { value: "BARANG_JADI", label: "Barang jadi", tone: "success" },
];

export const STATUS_PERMINTAAN_BAHAN: readonly StatusOption[] = [
  { value: "DIPERIKSA_PURCHASING", label: "Diperiksa Purchasing", tone: "warning" },
  {
    value: "MENUNGGU_PEMBELIAN",
    label: "Menunggu pembelian · disetujui",
    tone: "warning",
  },
  { value: "DIKELUARKAN", label: "Dikeluarkan", tone: "success" },
];

export const STATUS_HASIL_PRODUKSI: readonly StatusOption[] = [
  { value: "DIPROSES", label: "Diproses", tone: "info" },
  { value: "REWORK", label: "Rework", tone: "warning" },
];

export const STATUS_KARTU_JAM_KERJA: readonly StatusOption[] = [
  { value: "TERCATAT", label: "Tercatat", tone: "warning" },
  { value: "DIBEBANKAN", label: "Dibebankan", tone: "success" },
];

export const STATUS_POSTING_HPP: readonly StatusOption[] = [
  { value: "BELUM_POSTING", label: "WIP Dibebankan", tone: "warning" },
  { value: "DIBEBANKAN_SEMENTARA", label: "WIP Dibebankan", tone: "warning" },
  { value: "FINAL_DIPOSTING", label: "Final Diposting", tone: "success" },
];

export const STATUS_TUGAS_PRODUKSI: readonly StatusOption[] = [
  { value: "Menunggu cek bahan Gudang", label: "Menunggu cek bahan Gudang", tone: "warning" },
  { value: "Diperiksa Purchasing", label: "Diperiksa Purchasing", tone: "warning" },
  { value: "Hasil belum dicatat", label: "Hasil belum dicatat", tone: "warning" },
];

export const STATUS_KATEGORI_PERSEDIAAAN: readonly StatusOption[] = [
  { value: "Bahan Baku", label: "Bahan Baku", tone: "info" },
  {
    value: "Barang Dalam Proses (WIP)",
    label: "Barang Dalam Proses (WIP)",
    tone: "warning",
  },
  { value: "Barang Jadi", label: "Barang Jadi", tone: "success" },
];

const COMPACT_BADGE = [
  "inline-flex items-center whitespace-nowrap",
  "rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1)]",
  "text-[length:var(--font-size-label)] leading-[var(--line-height-label)] font-semibold",
].join(" ");

const COMPACT_TONE: Record<StatusTone, string> = {
  success: "bg-[var(--status-success-bg)] text-[color:var(--status-success-text)]",
  warning: "bg-[var(--status-warning-bg)] text-[color:var(--status-warning-text)]",
  danger: "bg-[var(--status-danger-bg)] text-[color:var(--status-danger-text)]",
  info: "bg-[var(--status-info-bg)] text-[color:var(--status-info-text)]",
  neutral: "bg-[var(--status-neutral-bg)] text-[color:var(--status-neutral-text)]",
};

export function StatusBadge({
  className,
  onInvalidStatus,
  status,
  statuses,
  variant = "default",
}: StatusBadgeProps) {
  const option = statuses.find((candidate) => candidate.value === status);
  const isValid = option !== undefined;

  useEffect(() => {
    if (isValid) return;

    if (onInvalidStatus) {
      onInvalidStatus(status);
    } else if (process.env.NODE_ENV !== "production") {
      console.error("StatusBadge received a status outside its provided list.", status);
    }
  }, [isValid, onInvalidStatus, status]);

  if (!option) return null;

  if (variant === "compact") {
    const classes = [COMPACT_BADGE, COMPACT_TONE[option.tone], className]
      .filter(Boolean)
      .join(" ");

    return <span className={classes}>{option.label}</span>;
  }

  return (
    <span
      className={className ? `${styles.badge} ${className}` : styles.badge}
      data-variant={option.tone}
    >
      {option.label}
    </span>
  );
}
