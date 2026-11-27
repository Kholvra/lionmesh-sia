"use client";

import type { ReactNode } from "react";

export type SegmentedTab = {
  key: string;
  label: ReactNode;
  hidden?: boolean;
};

export type SegmentedTabsProps = {
  items: readonly SegmentedTab[];
  value: string;
  onValueChange: (key: string) => void;
  wrap?: boolean;
  spacing?: "default" | "wide";
  eased?: boolean;
  className?: string;
};

const WRAPPER =
  "inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-[var(--space-1)]";
const BUTTON_BASE =
  "rounded-[var(--radius-sm)] border py-[var(--space-1)] text-[length:var(--font-size-label)] transition-all duration-[var(--motion-fast)] active:scale-[0.98]";
const BUTTON_ACTIVE =
  "border-[color:var(--border-strong)] bg-[var(--bg-surface)] font-semibold text-[color:var(--text-primary)] shadow-sm";
const BUTTON_INACTIVE =
  "border-transparent font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]";

export function SegmentedTabs({
  className,
  eased = false,
  items,
  onValueChange,
  spacing = "default",
  value,
  wrap = true,
}: SegmentedTabsProps) {
  return (
    <div className={`${WRAPPER} ${wrap ? "flex-wrap" : ""} ${className ?? ""}`}>
      {items.map((tab) => {
        if (tab.hidden) return null;
        const isActive = value === tab.key;
        return (
          <button
            aria-pressed={isActive}
            className={`${BUTTON_BASE} ${
              spacing === "wide" ? "px-[var(--space-4)]" : "px-[var(--space-3)]"
            } ${eased ? "ease-out" : ""} ${
              isActive ? BUTTON_ACTIVE : BUTTON_INACTIVE
            }`}
            key={tab.key}
            onClick={() => onValueChange(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
