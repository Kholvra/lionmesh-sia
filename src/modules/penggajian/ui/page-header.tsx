import Link from "next/link";
import type { ReactNode } from "react";

import { ui } from "@/modules/penggajian/ui/kelas";

type PageHeaderProps = {
  item: string;
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
};

export function PageHeader({ actions, back, description, item, title }: PageHeaderProps) {
  return (
    <header className={ui.header}>
      {back ? (
        <Link className={ui.backLink} href={back.href}>
          ← {back.label}
        </Link>
      ) : null}
      <p className={ui.breadcrumb}>
        <span className={ui.breadcrumbCycle}>Siklus Penggajian</span> / {item}
      </p>
      <div className={ui.headerRow}>
        <div className={ui.headerText}>
          <h1 className={ui.title}>{title}</h1>
          {description ? <p className={ui.description}>{description}</p> : null}
        </div>
        {actions ? <div className={ui.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
