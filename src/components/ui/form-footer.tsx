"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  SubmitButton,
  submitButtonClassName,
} from "@/components/ui/submit-button";
import type {
  SubmitButtonProps,
  SubmitButtonSize,
  SubmitButtonVariant,
} from "@/components/ui/submit-button";

export type FormFooterProps = {
  busy?: boolean;
  busyLabel?: ReactNode;
  cancelClassName?: string;
  cancelDisabled?: boolean;
  /** Dialog-style footers put the cancel action first. */
  cancelFirst?: boolean;
  cancelHref?: string;
  cancelLabel?: ReactNode;
  children?: ReactNode;
  className?: string;
  loading?: boolean;
  onCancel?: () => void;
  pending?: boolean;
  size?: SubmitButtonSize;
  submitDisabled?: boolean;
  submitLabel?: ReactNode;
  submitProps?: Omit<SubmitButtonProps, "children" | "className" | "disabled">;
  variant?: SubmitButtonVariant;
};

/** Submit and cancel actions in the same row used by every form. */
export function FormFooter({
  busy,
  busyLabel,
  cancelClassName,
  cancelDisabled,
  cancelFirst = false,
  cancelHref,
  cancelLabel = "Batal",
  children,
  className,
  loading,
  onCancel,
  pending,
  size = "md",
  submitDisabled,
  submitLabel = "Simpan",
  submitProps,
  variant = "primary",
}: FormFooterProps) {
  let cancelNode: ReactNode = null;
  if (cancelHref) {
    cancelNode = (
      <Link
        className={submitButtonClassName({
          className: cancelClassName,
          size,
          variant: "secondary",
        })}
        href={cancelHref}
        onClick={onCancel}
      >
        {cancelLabel}
      </Link>
    );
  } else if (onCancel) {
    cancelNode = (
      <SubmitButton
        className={cancelClassName}
        disabled={cancelDisabled}
        onClick={onCancel}
        size={size}
        type="button"
        variant="secondary"
      >
        {cancelLabel}
      </SubmitButton>
    );
  }

  const submitNode = (
    <SubmitButton
      {...submitProps}
      busy={busy}
      busyLabel={busyLabel}
      disabled={submitDisabled}
      loading={loading}
      pending={pending}
      size={size}
      variant={variant}
    >
      {submitLabel}
    </SubmitButton>
  );

  return (
    <footer
      className={`flex flex-wrap items-center gap-[var(--space-3)] pt-[var(--space-2)]${className ? ` ${className}` : ""}`}
    >
      {cancelFirst ? cancelNode : null}
      {submitNode}
      {cancelFirst ? null : cancelNode}
      {children}
    </footer>
  );
}
