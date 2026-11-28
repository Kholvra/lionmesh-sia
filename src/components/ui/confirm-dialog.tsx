"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import styles from "@/components/ui/confirm-dialog.module.css";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onOpenChange: (open: boolean) => void;
};

function useModalDialog(
  open: boolean,
  cancelRef: RefObject<HTMLButtonElement | null>,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [cancelRef, open]);

  return dialogRef;
}

function DialogHeader({
  onDismiss,
  pending,
  title,
  titleId,
}: {
  onDismiss: () => void;
  pending: boolean;
  title: string;
  titleId: string;
}) {
  return (
    <header className={styles.dialogHeader}>
      <h2 className={styles.dialogTitle} id={titleId}>
        {title}
      </h2>
      <button
        aria-label="Tutup dialog"
        className={styles.dialogClose}
        disabled={pending}
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>
    </header>
  );
}

function ConfirmButton({
  confirmLabel,
  destructive,
  onConfirm,
  onOpenChange,
  open,
  pending,
}: {
  confirmLabel: string;
  destructive: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
}) {
  function confirm() {
    if (!open || pending) return;
    onConfirm();
    onOpenChange(false);
  }

  return (
    <button
      className={`${styles.dialogButton} ${
        destructive ? styles.dangerButton : styles.primaryButton
      }`}
      disabled={pending}
      onClick={confirm}
      type="button"
    >
      {confirmLabel}
    </button>
  );
}

function DialogActions({
  cancelLabel,
  cancelRef,
  confirmLabel,
  destructive,
  onConfirm,
  onDismiss,
  onOpenChange,
  open,
  pending,
}: {
  cancelLabel: string;
  cancelRef: RefObject<HTMLButtonElement | null>;
  confirmLabel: string;
  destructive: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
}) {
  return (
    <footer className={styles.dialogFooter}>
      <button
        ref={cancelRef}
        className={`${styles.dialogButton} ${styles.secondaryButton}`}
        disabled={pending}
        onClick={onDismiss}
        type="button"
      >
        {cancelLabel}
      </button>
      <ConfirmButton
        confirmLabel={confirmLabel}
        destructive={destructive}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        open={open}
        pending={pending}
      />
    </footer>
  );
}

function DialogContent({
  cancelLabel,
  cancelRef,
  confirmLabel,
  description,
  descriptionId,
  destructive,
  dismiss,
  onConfirm,
  onOpenChange,
  open,
  pending,
  title,
  titleId,
}: {
  cancelLabel: string;
  cancelRef: RefObject<HTMLButtonElement | null>;
  confirmLabel: string;
  description: ReactNode;
  descriptionId: string;
  destructive: boolean;
  dismiss: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  title: string;
  titleId: string;
}) {
  return (
    <div className={styles.dialogContent}>
      <DialogHeader
        onDismiss={dismiss}
        pending={pending}
        title={title}
        titleId={titleId}
      />
      <div className={styles.dialogDescription} id={descriptionId}>
        {description}
      </div>
      <DialogActions
        cancelLabel={cancelLabel}
        cancelRef={cancelRef}
        confirmLabel={confirmLabel}
        destructive={destructive}
        onConfirm={onConfirm}
        onDismiss={dismiss}
        onOpenChange={onOpenChange}
        open={open}
        pending={pending}
      />
    </div>
  );
}

export function ConfirmDialog({
  cancelLabel = "Batal",
  confirmLabel = "Setuju",
  description,
  destructive = false,
  onCancel,
  onConfirm,
  onOpenChange,
  open,
  pending = false,
  title,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog(open, cancelRef);
  const titleId = useId();
  const descriptionId = useId();

  function dismiss() {
    if (pending) return;
    onCancel?.();
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={() => {
        if (open) dismiss();
      }}
    >
      <DialogContent
        cancelLabel={cancelLabel}
        cancelRef={cancelRef}
        confirmLabel={confirmLabel}
        description={description}
        descriptionId={descriptionId}
        destructive={destructive}
        dismiss={dismiss}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        open={open}
        pending={pending}
        title={title}
        titleId={titleId}
      />
    </dialog>
  );
}
