import type { ReactNode } from "react";

import { ui } from "@/modules/penggajian/ui/kelas";

type NoticeProps = {
  tone: "success" | "danger" | "warning" | "info";
  title: string;
  children?: ReactNode;
};

export function Notice({ children, title, tone }: NoticeProps) {
  return (
    <div className={ui.notice} data-tone={tone} role={tone === "danger" ? "alert" : "status"}>
      <p className={ui.noticeTitle}>{title}</p>
      {children ? <div className={ui.noticeBody}>{children}</div> : null}
    </div>
  );
}
