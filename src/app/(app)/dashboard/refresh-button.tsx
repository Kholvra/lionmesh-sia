"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

import styles from "./dashboard.module.css";

export function RefreshButton({ label }: { label: string }) {
  const router = useRouter();
  const [memuat, startTransition] = useTransition();

  return (
    <SubmitButton
      className={styles.retryButton}
      disabled={memuat}
      onClick={() => startTransition(() => router.refresh())}
      size="md"
      type="button"
    >
      {memuat ? "Muat…" : label}
    </SubmitButton>
  );
}
