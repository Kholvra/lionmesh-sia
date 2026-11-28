"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

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
  /** Accessible name of the tablist. */
  label?: string;
  /** Supply stable tab ids so a caller-owned panel can set aria-labelledby. */
  getTabId?: (key: string) => string;
  /** Id of the caller-owned panel controlled by a tab. */
  getPanelId?: (key: string) => string | undefined;
  /** Filter call sites may opt into toggle pills; tabs are the default. */
  semantics?: "tabs" | "filter";
};

const WRAPPER =
  "inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-[var(--space-1)]";
const BUTTON_BASE =
  "rounded-[var(--radius-sm)] border py-[var(--space-1)] text-[length:var(--font-size-label)] transition-all duration-[var(--motion-fast)] active:scale-[0.98]";
const BUTTON_ACTIVE =
  "border-[color:var(--border-strong)] bg-[var(--bg-surface)] font-semibold text-[color:var(--text-primary)] shadow-sm";
const BUTTON_INACTIVE =
  "border-transparent font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]";

/**
 * S2 decision: kartu-jam-kerja and laporan swap whole panels, while
 * pembelian-bahan and perintah-produksi filter a table. Both switch the
 * visible view, so the default is real tab semantics (tablist/tab,
 * aria-selected, roving tab stop, arrow/Home/End activation). A pure filter
 * that needs independent toggles can pass `semantics="filter"` to keep the
 * original aria-pressed pills; the prop is additive and no existing caller
 * changes. Callers own the panels: set their `id` from `getPanelId` and their
 * `aria-labelledby` from `getTabId` (or the generated tab id).
 */
export function SegmentedTabs({
  className,
  eased = false,
  getPanelId,
  getTabId,
  items,
  label = "Tampilan",
  onValueChange,
  semantics = "tabs",
  spacing = "default",
  value,
  wrap = true,
}: SegmentedTabsProps) {
  const generatedId = useId().replace(/:/g, "");
  const tabId = (key: string) => getTabId?.(key) ?? `${generatedId}-tab-${key}`;
  const visibleItems = items.filter((item) => !item.hidden);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const activePosition = visibleItems.findIndex((item) => item.key === value);
  const tabStop = activePosition >= 0 ? activePosition : 0;
  const isTabs = semantics === "tabs";

  function activate(index: number) {
    const item = visibleItems[index];
    if (!item) return;
    onValueChange(item.key);
    buttonsRef.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!isTabs || visibleItems.length < 2) return;
    const { key } = event;
    let target: number;
    if (key === "ArrowRight" || key === "ArrowDown")
      target = (index + 1) % visibleItems.length;
    else if (key === "ArrowLeft" || key === "ArrowUp")
      target = (index - 1 + visibleItems.length) % visibleItems.length;
    else if (key === "Home") target = 0;
    else if (key === "End") target = visibleItems.length - 1;
    else return;
    event.preventDefault();
    activate(target);
  }

  return (
    <div
      aria-label={isTabs ? label : undefined}
      className={`${WRAPPER} ${wrap ? "flex-wrap" : ""} ${className ?? ""}`}
      role={isTabs ? "tablist" : undefined}
    >
      {visibleItems.map((tab, index) => {
        const isActive = value === tab.key;
        return (
          <button
            aria-controls={isTabs ? getPanelId?.(tab.key) : undefined}
            aria-pressed={isTabs ? undefined : isActive}
            aria-selected={isTabs ? isActive : undefined}
            className={`${BUTTON_BASE} ${spacing === "wide" ? "px-[var(--space-4)]" : "px-[var(--space-3)]"} ${eased ? "ease-out" : ""} ${isActive ? BUTTON_ACTIVE : BUTTON_INACTIVE}`}
            id={isTabs ? tabId(tab.key) : undefined}
            key={tab.key}
            onClick={() => onValueChange(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            role={isTabs ? "tab" : undefined}
            tabIndex={isTabs && index !== tabStop ? -1 : undefined}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
