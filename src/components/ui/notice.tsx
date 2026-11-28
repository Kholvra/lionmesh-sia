import type { ReactNode } from "react";

export type NoticeTone = "info" | "success" | "warning" | "error";

export type NoticeVariant = "plain" | "bordered" | "card";

export type NoticeProps = {
  children?: ReactNode;
  className?: string;
  /** Indonesian `nada` spelling used by the financial reports. */
  nada?: "info" | "bahaya";
  title?: ReactNode;
  tone?: NoticeTone | "danger";
  variant?: NoticeVariant;
};

const TONE_CLASS: Record<NoticeTone, string> = {
  info: "bg-[var(--status-info-bg)] text-[color:var(--status-info-text)]",
  success: "bg-[var(--status-success-bg)] text-[color:var(--status-success-text)]",
  warning: "bg-[var(--status-warning-bg)] text-[color:var(--status-warning-text)]",
  error: "bg-[var(--status-danger-bg)] text-[color:var(--status-danger-text)]",
};

const BORDER_TONE_CLASS: Record<NoticeTone, string> = {
  info: "border-[color:var(--status-info-bg)]",
  success: "border-[color:var(--status-success-bg)]",
  warning: "border-[color:var(--status-warning-bg)]",
  error: "border-[color:var(--status-danger-bg)]",
};

const TYPE_CLASS =
  "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]";

const VARIANT_CLASS: Record<NoticeVariant, string> = {
  plain: `grid gap-[var(--space-1)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] ${TYPE_CLASS}`,
  bordered: `m-0 mb-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)] border-[length:var(--border-width-default)] border-solid rounded-[var(--radius-md)] ${TYPE_CLASS}`,
  card: `shadow-card mt-[var(--space-4)] rounded-[var(--radius-lg)] border border-transparent px-[var(--space-5)] py-[var(--space-4)] animate-slide-down ${TYPE_CLASS}`,
};

function resolveTone(tone: NoticeProps["tone"], nada: NoticeProps["nada"]): NoticeTone {
  if (nada === "bahaya") return "error";
  if (tone === "danger") return "error";
  return tone ?? "info";
}

export function Notice({
  children,
  className,
  nada,
  title,
  tone,
  variant = "plain",
}: NoticeProps) {
  const severity = resolveTone(tone, nada);
  const classes = [
    VARIANT_CLASS[variant],
    TONE_CLASS[severity],
    variant === "bordered" ? BORDER_TONE_CLASS[severity] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const role = severity === "error" ? "alert" : "status";

  if (title === undefined && variant !== "card") {
    return (
      <p className={classes} data-tone={severity} role={role}>
        {children}
      </p>
    );
  }

  const bodyClass = [
    "[&_p]:m-0",
    variant === "plain" ? "text-[color:var(--text-primary)]" : "",
    variant === "plain" ? "" : "mt-[var(--space-1)]",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} data-tone={severity} role={role}>
      {title === undefined ? null : <p className="m-0 font-semibold">{title}</p>}
      {children === undefined || children === null ? null : (
        <div className={bodyClass}>{children}</div>
      )}
    </div>
  );
}

export { Notice as Callout, Notice as Pesan };
