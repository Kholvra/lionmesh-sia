"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./dashboard.module.css";

export function RefreshButton({ label }: { label: string }) {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);

  return (
    <button
      className={styles.retryButton}
      disabled={memuat}
      onClick={() => {
        setMemuat(true);
        router.refresh();
      }}
      type="button"
    >
      {memuat ? "Memuat…" : label}
    </button>
  );
}
