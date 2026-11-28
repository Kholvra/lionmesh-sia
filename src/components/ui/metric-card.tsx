import type { ReactNode } from "react";

export type MetricTone = "default" | "success" | "warning" | "danger" | "info";
export type MetricCardVariant = "summary" | "stat" | "dashboard";
export type MetricCardStatus = "tersedia" | "gagal" | "belum-tersedia";
export type MetricCardHover = "none" | "lift" | "lift-eased";

export type MetricCardData = {
  label: string;
  value?: ReactNode;
  unit?: ReactNode;
  hint?: ReactNode;
  hintTone?: MetricTone;
  footnote?: ReactNode;
  tone?: MetricTone;
  status?: MetricCardStatus;
  stateLabel?: string;
  stateHint?: string;
  hover?: MetricCardHover;
  minHeight?: boolean;
  className?: string;
};

export type MetricCardProps = MetricCardData & {
  variant?: MetricCardVariant;
};

export type MetricCardGridProps = {
  items: readonly MetricCardData[];
  variant?: MetricCardVariant;
  columns?: 2 | 3 | 4;
  className?: string;
};

export type RingkasanItem = {
  label: string;
  nilai: ReactNode;
  bahaya?: boolean;
};

const TONE_CLASS: Record<MetricTone, string> = {
  default: "text-[color:var(--text-primary)]",
  success: "text-[color:var(--status-success-text)]",
  warning: "text-[color:var(--status-warning-text)]",
  danger: "text-[color:var(--status-danger-text)]",
  info: "text-[color:var(--status-info-text)]",
};

const HOVER_CLASS: Record<MetricCardHover, string> = {
  none: "",
  lift: "transition-all duration-[var(--motion-fast)] hover:-translate-y-0.5 hover:shadow-md",
  "lift-eased":
    "transition-all duration-[var(--motion-fast)] ease-out hover:-translate-y-0.5 hover:shadow-md",
};

const SUMMARY_CARD =
  "flex flex-col rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--space-4)] shadow-sm";
const SUMMARY_LABEL =
  "m-0 text-[length:var(--font-size-label)] leading-[var(--line-height-label)] text-[color:var(--text-muted)]";
const SUMMARY_VALUE =
  "mt-[var(--space-1)] text-[length:var(--font-size-section)] font-semibold leading-[var(--line-height-section)] tabular-nums";

const STAT_CARD =
  "flex flex-col justify-start gap-[var(--space-1)] rounded-[var(--radius-md)] border border-transparent bg-[var(--bg-surface)] px-[var(--space-5)] py-[var(--space-4)] shadow-card";
const STAT_LABEL =
  "m-0 text-[length:var(--font-size-body-sm)] text-[color:var(--text-secondary)]";
const STAT_VALUE =
  "m-0 text-[length:var(--font-size-display)] font-bold tabular-nums";
const STAT_UNIT =
  "text-[length:var(--font-size-body)] font-normal text-[color:var(--text-secondary)]";

const DASHBOARD_CARD =
  "flex min-h-[calc(var(--space-16)+var(--space-12))] flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--space-5)] shadow-sm transition-[border-color] duration-[var(--motion-fast)] ease-out hover:border-[color:var(--brand-500)]";
const DASHBOARD_LABEL =
  "m-0 text-[length:var(--font-size-caption)] font-semibold uppercase leading-[var(--line-height-caption)] tracking-[var(--letter-spacing-caption)] text-[color:var(--text-muted)]";
const DASHBOARD_VALUE =
  "m-0 text-[length:var(--font-size-display)] font-bold leading-[var(--line-height-display)] tabular-nums";
const DASHBOARD_STATE =
  "m-0 text-[length:var(--font-size-body)] font-semibold leading-[var(--line-height-body)] text-[color:var(--text-secondary)]";

const HINT_CLASS =
  "m-0 text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] text-[color:var(--text-secondary)]";
const FOOTNOTE_CLASS =
  "mt-auto border-t border-[color:var(--border-subtle)] pt-[var(--space-3)] text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)] text-[color:var(--text-muted)]";

function join(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

function renderValue(value: ReactNode, unit: ReactNode): ReactNode {
  if (unit === undefined || unit === null) return value;
  return (
    <>
      {value} <span className={STAT_UNIT}>{unit}</span>
    </>
  );
}

/**
 * Presentational metric card. `summary` mirrors the report dl/dt/dd card,
 * `stat` mirrors the produksi prototype card, and `dashboard` mirrors the
 * card with an availability state and footnote.
 */
export function MetricCard({
  className,
  stateHint,
  footnote,
  hint,
  hintTone = "default",
  hover = "none",
  label,
  minHeight = false,
  stateLabel,
  status = "tersedia",
  tone = "default",
  unit,
  value,
  variant = "stat",
}: MetricCardProps) {
  if (variant === "summary") {
    return (
      <div className={join(SUMMARY_CARD, className)}>
        <dt className={SUMMARY_LABEL}>{label}</dt>
        <dd className={join(SUMMARY_VALUE, TONE_CLASS[tone])}>
          {renderValue(value, unit)}
          {hint ? <p className={join(HINT_CLASS, TONE_CLASS[hintTone])}>{hint}</p> : null}
        </dd>
      </div>
    );
  }

  if (variant === "dashboard") {
    const unavailable = status !== "tersedia";
    const failure = status === "gagal";
    return (
      <article className={join(DASHBOARD_CARD, className)} data-status={status}>
        <h3 className={DASHBOARD_LABEL}>{label}</h3>
        {unavailable ? (
          <p
            className={join(
              DASHBOARD_STATE,
              failure && "text-[color:var(--status-danger-text)]",
            )}
          >
            {stateLabel ?? (failure ? "Gagal dimuat" : "Belum tersedia")}
          </p>
        ) : (
          <p className={join(DASHBOARD_VALUE, TONE_CLASS[tone])}>
            {renderValue(value, unit)}
          </p>
        )}
        {hint || unavailable ? (
          <p className={join(HINT_CLASS, TONE_CLASS[hintTone])}>
            {hint ??
              stateHint ??
              (failure
                ? "Sumber siklus ini tidak dapat dibaca."
                : "Sumber siklus ini belum diimplementasikan.")}
          </p>
        ) : null}
        {footnote ? <p className={FOOTNOTE_CLASS}>{footnote}</p> : null}
      </article>
    );
  }

  return (
    <article
      className={join(
        STAT_CARD,
        HOVER_CLASS[hover],
        minHeight &&
          "min-h-[calc(var(--space-16)+var(--space-10)+var(--space-1))]",
        className,
      )}
    >
      <p className={STAT_LABEL}>{label}</p>
      <p className={join(STAT_VALUE, TONE_CLASS[tone])}>
        {renderValue(value, unit)}
      </p>
      {hint ? <p className={join(HINT_CLASS, TONE_CLASS[hintTone])}>{hint}</p> : null}
      {footnote ? <p className={FOOTNOTE_CLASS}>{footnote}</p> : null}
    </article>
  );
}

const GRID_COLUMNS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
};

const SUMMARY_GRID =
  "grid grid-cols-[repeat(auto-fit,minmax(calc(var(--space-16)*2+var(--space-10)+var(--space-3)),1fr))] gap-[var(--space-4)] m-0 mb-[var(--space-5)]";
const DASHBOARD_GRID = "grid grid-cols-2 gap-[var(--space-6)]";

/** Grid wrapper that supplies the correct container element per variant. */
export function MetricCardGrid({
  className,
  columns = 3,
  items,
  variant = "stat",
}: MetricCardGridProps) {
  const gridClass =
    variant === "summary"
      ? SUMMARY_GRID
      : variant === "dashboard"
        ? DASHBOARD_GRID
        : join("grid gap-[var(--space-4)]", GRID_COLUMNS[columns]);
  const children = items.map((item) => (
    <MetricCard {...item} key={item.label} variant={variant} />
  ));

  return variant === "summary" ? (
    <dl className={join(gridClass, className)}>{children}</dl>
  ) : (
    <div className={join(gridClass, className)}>{children}</div>
  );
}

/** Compatibility wrapper for the report summary item shape (`nilai`/`bahaya`). */
export function Ringkasan({ items }: { items: readonly RingkasanItem[] }) {
  return (
    <MetricCardGrid
      items={items.map((item) => ({
        label: item.label,
        value: item.nilai,
        tone: item.bahaya ? "danger" : "default",
      }))}
      variant="summary"
    />
  );
}
