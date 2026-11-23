import Link from "next/link";
import type { ReactNode } from "react";

import styles from "@/modules/penggajian/ui/ui.module.css";

type PageHeaderProps = {
  item: string;
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
};

export function PageHeader({ actions, back, description, item, title }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {back ? (
        <Link className={styles.backLink} href={back.href}>
          ← {back.label}
        </Link>
      ) : null}
      <p className={styles.breadcrumb}>
        <span className={styles.breadcrumbCycle}>Siklus Penggajian</span> / {item}
      </p>
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
