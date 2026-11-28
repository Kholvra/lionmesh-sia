import Link from "next/link";
import type { ReactNode } from "react";

export type StateVariant = "full" | "compact" | "inline";

type StateCopyProps = {
  /** `judul` keeps the prop name used by the original Master* states. */
  judul?: string;
  title?: string;
  /** `teks` keeps the prop name used by the original Master* states. */
  teks?: string;
  message?: string;
  variant?: StateVariant;
};

export type LoadingStateProps = StateCopyProps;

export type ErrorStateProps = StateCopyProps & {
  /** `reset` is accepted as the alias used by Next.js error boundaries. */
  onRetry?: () => void;
  reset?: () => void;
  retryLabel?: string;
};

export type EmptyStateProps = StateCopyProps & {
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

const bodySm =
  "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]";
const body =
  "text-[length:var(--font-size-body)]! leading-[var(--line-height-body)]!";
const focusRing =
  "focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-solid focus-visible:outline-offset-[var(--focus-ring-offset)]";

// The full-page rules below mirror master.module.css; the compact rules mirror
// the GJ card/empty classes. Keeping both avoids changing either rendered look.
const fullStyles = {
  page: "grid min-h-screen place-items-center p-[var(--space-8)]",
  card: "w-full max-w-[var(--dialog-form-width)] p-[var(--space-6)] border-[length:var(--border-width-default)] border-solid border-[var(--border-subtle)] rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]",
  title:
    "m-0 font-semibold text-[color:var(--text-primary)] text-[length:var(--font-size-section)] leading-[var(--line-height-section)]",
  text: `mt-[var(--space-2)] mr-0 mb-[var(--space-5)] ml-0 text-[color:var(--text-secondary)] ${bodySm}`,
  actions: "flex gap-[var(--space-3)]",
} as const;

const compactStyles = {
  card: "grid gap-[var(--space-4)] p-[var(--space-5)] border-[length:var(--border-width-default)] border-solid border-[var(--border-subtle)] rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]",
  body: "grid justify-items-start gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-12)] text-[color:var(--text-secondary)] [&_p]:m-0",
} as const;

const inlineStyles = {
  loading: `p-[var(--space-8)] text-[color:var(--text-secondary)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)]`,
  error: `m-0 mb-[var(--space-4)] py-[var(--space-3)] px-[var(--space-4)] border-[length:var(--border-width-default)] border-solid border-[var(--status-danger-bg)] rounded-[var(--radius-md)] bg-[var(--status-danger-bg)] text-[color:var(--status-danger-text)]`,
  empty: `m-0 mb-[var(--space-4)] py-[var(--space-3)] px-[var(--space-4)] border-[length:var(--border-width-default)] border-solid border-[var(--border-subtle)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]`,
} as const;

const buttonBase = [
  "inline-flex items-center justify-center whitespace-nowrap cursor-pointer no-underline font-semibold!",
  "rounded-[var(--radius-md)] border-solid",
  "transition-colors duration-[var(--motion-fast)] ease-out motion-reduce:duration-[var(--motion-none)]",
  focusRing,
].join(" ");

const fullRetryButton = [
  buttonBase,
  "min-h-[var(--button-lg-height)] gap-[var(--space-2)] px-[var(--space-4)] border-0",
  "bg-[var(--brand-500)] text-[color:var(--text-on-brand)]!",
  body,
  "hover:bg-[var(--brand-600)]",
].join(" ");

const compactSecondaryButton = [
  buttonBase,
  "h-[var(--control-height)] border-[length:var(--border-width-default)] px-[var(--space-4)]",
  "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[color:var(--text-primary)]!",
  body,
  "hover:border-[var(--ink-300)] hover:bg-[var(--bg-subtle)]",
].join(" ");

const compactPrimaryButton = [
  buttonBase,
  "h-[var(--control-height)] border-[length:var(--border-width-default)] px-[var(--space-4)]",
  "border-[var(--brand-500)] bg-[var(--brand-500)] text-[color:var(--text-on-brand)]!",
  body,
  "hover:border-[var(--brand-600)] hover:bg-[var(--brand-600)]",
].join(" ");

const DEFAULT_LOADING = {
  judul: "Memuat data master",
  teks: "Data master sedang disiapkan.",
};
const DEFAULT_ERROR = {
  judul: "Master gagal dimuat",
  teks: "Terjadi kesalahan saat memuat data master. Coba muat ulang halaman ini.",
};
const DEFAULT_EMPTY = { judul: "Belum ada data.", teks: "" };

function resolveCopy(
  props: StateCopyProps,
  fallback: { judul: string; teks: string },
) {
  return {
    judul: props.judul ?? props.title ?? fallback.judul,
    teks: props.teks ?? props.message ?? fallback.teks,
  };
}

function FullFrame({ children, role }: { children: ReactNode; role: "alert" | "status" }) {
  return (
    <main className={fullStyles.page}>
      <section className={fullStyles.card} role={role}>
        {children}
      </section>
    </main>
  );
}

function CompactFrame({
  children,
  role,
}: {
  children: ReactNode;
  role: "alert" | "status";
}) {
  return (
    <section
      className={`${compactStyles.card} ${compactStyles.body}`}
      role={role}
    >
      {children}
    </section>
  );
}

export function LoadingState({
  judul,
  title,
  teks,
  message,
  variant = "full",
}: LoadingStateProps) {
  const copy = resolveCopy({ judul, title, teks, message }, DEFAULT_LOADING);

  if (variant === "inline") {
    return (
      <div className={inlineStyles.loading} role="status" aria-busy="true">
        {copy.judul}
      </div>
    );
  }

  const Heading = variant === "full" ? "h1" : "h2";
  const content = (
    <>
      <Heading className={fullStyles.title}>{copy.judul}</Heading>
      <p className={fullStyles.text}>{copy.teks}</p>
    </>
  );

  return variant === "full" ? (
    <FullFrame role="status">{content}</FullFrame>
  ) : (
    <CompactFrame role="status">{content}</CompactFrame>
  );
}

export function ErrorState({
  judul,
  title,
  teks,
  message,
  onRetry,
  reset,
  retryLabel = "Coba lagi",
  variant = "full",
}: ErrorStateProps) {
  const copy = resolveCopy({ judul, title, teks, message }, DEFAULT_ERROR);
  const retry = onRetry ?? reset;

  if (variant === "inline") {
    return (
      <p className={inlineStyles.error} role="alert">
        {copy.judul}: {copy.teks}
      </p>
    );
  }

  const Heading = variant === "full" ? "h1" : "h2";
  const content = (
    <>
      <Heading className={fullStyles.title}>{copy.judul}</Heading>
      <p className={fullStyles.text}>{copy.teks}</p>
      {retry ? (
        variant === "full" ? (
          <div className={fullStyles.actions}>
            <button
              className={fullRetryButton}
              onClick={retry}
              type="button"
            >
              {retryLabel}
            </button>
          </div>
        ) : (
          <button
            className={compactSecondaryButton}
            onClick={retry}
            type="button"
          >
            {retryLabel}
          </button>
        )
      ) : null}
    </>
  );

  return variant === "full" ? (
    <FullFrame role="alert">{content}</FullFrame>
  ) : (
    <CompactFrame role="alert">{content}</CompactFrame>
  );
}

export function EmptyState({
  judul,
  title,
  teks,
  message,
  actionLabel,
  actionHref,
  onAction,
  variant = "full",
}: EmptyStateProps) {
  const copy = resolveCopy({ judul, title, teks, message }, DEFAULT_EMPTY);

  if (variant === "inline") {
    return (
      <p className={inlineStyles.empty} role="status">
        {copy.judul}
      </p>
    );
  }

  const Heading = variant === "full" ? "h1" : "h3";
  const action = actionLabel ? (
    actionHref ? (
      <Link className={compactPrimaryButton} href={actionHref}>
        {actionLabel}
      </Link>
    ) : onAction ? (
      <button
        className={compactPrimaryButton}
        onClick={onAction}
        type="button"
      >
        {actionLabel}
      </button>
    ) : null
  ) : null;
  const content = (
    <>
      <Heading className={fullStyles.title}>{copy.judul}</Heading>
      {copy.teks ? <p className={fullStyles.text}>{copy.teks}</p> : null}
      {action}
    </>
  );

  return variant === "full" ? (
    <FullFrame role="status">{content}</FullFrame>
  ) : (
    <CompactFrame role="status">{content}</CompactFrame>
  );
}
