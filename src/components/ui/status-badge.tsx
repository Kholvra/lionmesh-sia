import styles from "@/components/ui/status-badge.module.css";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type StatusOption = {
  value: string;
  label: string;
  tone: StatusTone;
};

export type StatusBadgeProps = {
  status: string;
  statuses: readonly StatusOption[];
  onInvalidStatus?: (status: string) => void;
};

export function StatusBadge({
  onInvalidStatus,
  status,
  statuses,
}: StatusBadgeProps) {
  const option = statuses.find((candidate) => candidate.value === status);

  if (!option) {
    if (onInvalidStatus) {
      onInvalidStatus(status);
    } else if (process.env.NODE_ENV !== "production") {
      console.error("StatusBadge received a status outside its provided list.", status);
    }

    return null;
  }

  return (
    <span className={styles.badge} data-variant={option.tone}>
      {option.label}
    </span>
  );
}
