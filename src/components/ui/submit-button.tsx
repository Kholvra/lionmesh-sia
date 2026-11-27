"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type SubmitButtonVariant = "primary" | "secondary" | "danger";
export type SubmitButtonSize = "sm" | "md" | "lg";

export type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ReactNode;
  /** Busy aliases cover `pending`, `loading`, and `busy` call sites. */
  busy?: boolean;
  pending?: boolean;
  loading?: boolean;
  busyLabel?: ReactNode;
  variant?: SubmitButtonVariant;
  size?: SubmitButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const baseClass = [
  "inline-flex min-h-[var(--button-lg-height)] cursor-pointer items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-4)] font-semibold",
  "transition-colors duration-[var(--motion-fast)] ease-out motion-reduce:duration-[var(--motion-none)]",
  "focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[var(--focus-ring-offset)]",
  "disabled:cursor-wait disabled:opacity-70",
].join(" ");

const variantClass: Record<SubmitButtonVariant, string> = {
  primary:
    "border-0 bg-[var(--brand-500)] text-[color:var(--text-on-brand)] hover:bg-[var(--brand-600)]",
  secondary:
    "border-[length:var(--border-width-default)] border-solid border-[var(--border-input)] bg-[var(--bg-surface)] text-[color:var(--text-primary)] hover:bg-[var(--bg-subtle)]",
  danger:
    "border-[length:var(--border-width-default)] border-solid border-[var(--status-danger-bg)] bg-[var(--bg-surface)] text-[color:var(--status-danger-text)] hover:bg-[var(--status-danger-bg)]",
};

const sizeClass: Record<SubmitButtonSize, string> = {
  sm: "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]",
  md: "text-[length:var(--font-size-body)] leading-[var(--line-height-body)]",
  lg: "min-h-[var(--button-lg-height)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)]",
};

/** Shared class builder so links and buttons in a footer stay identical. */
export function submitButtonClassName({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: SubmitButtonSize;
  variant?: SubmitButtonVariant;
} = {}): string {
  const classes = [baseClass, variantClass[variant], sizeClass[size]];
  if (className) classes.push(className);
  return classes.join(" ");
}

/** Action button: swaps its label for "Memproses..." while the action is busy. */
export function SubmitButton({
  busy,
  busyLabel = "Memproses...",
  children,
  className,
  disabled,
  fullWidth,
  leadingIcon,
  loading,
  pending,
  size = "md",
  trailingIcon,
  type = "submit",
  variant = "primary",
  ...props
}: SubmitButtonProps) {
  const isBusy = Boolean(busy || pending || loading);

  return (
    <button
      {...props}
      aria-busy={isBusy || undefined}
      className={`${submitButtonClassName({ className, size, variant })}${fullWidth ? " w-full" : ""}`}
      data-busy={isBusy ? "true" : undefined}
      disabled={disabled || isBusy}
      type={type}
    >
      {isBusy ? (
        busyLabel
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  );
}
