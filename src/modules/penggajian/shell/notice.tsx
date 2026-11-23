import type { ReactNode } from "react";

import styles from "@/modules/penggajian/shell/ui.module.css";

type NoticeProps = {
  tone: "success" | "danger" | "warning" | "info";
  title: string;
  children?: ReactNode;
};

export function Notice({ children, title, tone }: NoticeProps) {
  return (
    <div className={styles.notice} data-tone={tone} role={tone === "danger" ? "alert" : "status"}>
      <p className={styles.noticeTitle}>{title}</p>
      {children ? <div className={styles.noticeBody}>{children}</div> : null}
    </div>
  );
}
