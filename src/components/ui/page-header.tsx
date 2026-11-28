import Link from "next/link";
import { Fragment } from "react";
import type { ReactNode } from "react";

import { ArrowIcon } from "@/components/ui/arrow-icon";

export type PageHeaderVariant = "page" | "section" | "cycle";

export type PageHeaderBreadcrumbItem = {
  label: string;
  href?: string;
  /** Renders as a link-coloured label without an underline. */
  accent?: boolean;
};

export type PageHeaderBackLink = {
  href: string;
  label: string;
};

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  breadcrumb?: readonly (string | PageHeaderBreadcrumbItem)[];
  back?: PageHeaderBackLink;
  actions?: ReactNode;
  /** `page` matches the token-driven page header, `section` a report section heading, `cycle` a cycle screen header. */
  variant?: PageHeaderVariant;
  separator?: ReactNode;
  actionsPlacement?: "inline" | "below";
};

const caption =
  "text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)]";
const label =
  "text-[length:var(--font-size-label)] leading-[var(--line-height-label)]";
const bodySm =
  "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]";
const pageStyles = {
  header: "grid gap-[var(--space-2)] mb-[var(--space-8)]",
  backLink: `justify-self-start font-semibold no-underline hover:underline text-[color:var(--text-link)] ${caption}`,
  breadcrumb: `m-0 text-[color:var(--text-secondary)] ${caption}`,
  breadcrumbLink: "text-[color:var(--text-link)] no-underline hover:underline",
  breadcrumbAccent: "text-[color:var(--text-link)]",
  headerRow: "flex items-end justify-between gap-[var(--space-6)]",
  headerText: "grid gap-[var(--space-2)]",
  title:
    "m-0 font-bold tracking-[-0.01em] text-[color:var(--text-primary)] text-[length:var(--font-size-title)] leading-[var(--line-height-title)]",
  description: `m-0 text-[color:var(--text-secondary)] ${bodySm}`,
  actions: "flex flex-wrap gap-[var(--space-3)]",
} as const;

const sectionStyles = {
  header:
    "flex items-baseline justify-between gap-[var(--space-4)] mb-[var(--space-2)]",
  breadcrumb: `m-0 text-[color:var(--text-muted)] ${caption}`,
  breadcrumbLink: "text-[color:var(--text-link)] no-underline hover:underline",
  breadcrumbAccent: "text-[color:var(--text-link)]",
  title: `m-0 font-semibold text-[color:var(--text-primary)] text-[length:var(--font-size-section)] leading-[var(--line-height-section)]`,
  meta: `m-0 text-[color:var(--text-muted)] ${label}`,
} as const;

const cycleStyles = {
  backLink: `group inline-flex items-center gap-[var(--space-2)] font-semibold text-[color:var(--text-link)] no-underline hover:text-[color:var(--brand-600)] ${caption}`,
  backIcon:
    "transition-transform duration-[var(--motion-fast)] group-hover:-translate-x-[var(--space-1)]",
  breadcrumb: `m-0 font-medium text-[color:var(--text-secondary)] ${caption}`,
  breadcrumbWithBack: "mt-[var(--space-2)]",
  breadcrumbLink:
    "text-[color:var(--text-link)] underline decoration-[var(--text-link)]/60 underline-offset-2 hover:text-[color:var(--brand-600)]",
  breadcrumbAccent: "text-[color:var(--text-link)]",
  separator: "mx-[var(--space-2)]",
  headerRow:
    "mt-[var(--space-2)] flex flex-wrap items-center justify-between gap-[var(--space-3)]",
  headerText: "grid gap-[var(--space-2)]",
  title: `m-0 font-bold tracking-[-0.01em] text-[color:var(--text-primary)] text-[length:var(--font-size-display)] leading-[var(--line-height-display)]`,
  titleSpaced: "mt-[var(--space-2)]",
  description: `mt-[var(--space-2)] text-[color:var(--text-secondary)] ${bodySm}`,
  actionsInline: "flex items-center gap-[var(--space-2)]",
  actionsBelow: "mt-[var(--space-5)] flex flex-wrap items-center gap-[var(--space-3)]",
} as const;

function toBreadcrumbItem(
  entry: string | PageHeaderBreadcrumbItem,
): PageHeaderBreadcrumbItem {
  return typeof entry === "string" ? { label: entry } : entry;
}

type TrailProps = {
  items: readonly (string | PageHeaderBreadcrumbItem)[];
  variant: PageHeaderVariant;
  separator: ReactNode;
};

function BreadcrumbTrail({ items, separator, variant }: TrailProps) {
  const style =
    variant === "cycle"
      ? cycleStyles
      : variant === "section"
        ? sectionStyles
        : pageStyles;
  const isCycle = variant === "cycle";

  const content = items.map((entry, index) => {
    const item = toBreadcrumbItem(entry);
    return (
      <Fragment key={`${item.label}-${index}`}>
        {index > 0 ? (
          <span aria-hidden="true" className={isCycle ? cycleStyles.separator : undefined}>
            {isCycle ? separator : <> {separator} </>}
          </span>
        ) : null}
        {item.href ? (
          <Link className={style.breadcrumbLink} href={item.href}>
            {item.label}
          </Link>
        ) : (
          <span className={item.accent ? style.breadcrumbAccent : undefined}>
            {item.label}
          </span>
        )}
      </Fragment>
    );
  });

  return isCycle ? (
    <nav className={cycleStyles.breadcrumb}>{content}</nav>
  ) : (
    <p className={style.breadcrumb}>{content}</p>
  );
}

function PageBackLink({
  back,
  variant,
}: {
  back: PageHeaderBackLink;
  variant: PageHeaderVariant;
}) {
  if (variant === "cycle") {
    return (
      <Link className={cycleStyles.backLink} href={back.href}>
        <ArrowIcon className={cycleStyles.backIcon} direction="left" />
        <span>{back.label}</span>
      </Link>
    );
  }

  return (
    <Link className={pageStyles.backLink} href={back.href}>
      ← {back.label}
    </Link>
  );
}

export function PageHeader({
  actions,
  back,
  breadcrumb,
  actionsPlacement = "inline",
  description,
  separator = "/",
  title,
  variant = "page",
}: PageHeaderProps) {
  const trail = breadcrumb?.length ? (
    <BreadcrumbTrail items={breadcrumb} separator={separator} variant={variant} />
  ) : null;

  if (variant === "section") {
    return (
      <div className={sectionStyles.header}>
        {trail ? <div className="w-full">{trail}</div> : null}
        <h2 className={sectionStyles.title}>{title}</h2>
        {description ? <p className={sectionStyles.meta}>{description}</p> : null}
        {actions ? <div className={pageStyles.actions}>{actions}</div> : null}
      </div>
    );
  }

  if (variant === "cycle") {
    return (
      <>
        {back ? <PageBackLink back={back} variant={variant} /> : null}
        {trail ? (
          <div className={back ? cycleStyles.breadcrumbWithBack : undefined}>
            {trail}
          </div>
        ) : null}
        {actions && actionsPlacement === "inline" ? (
          <div className={cycleStyles.headerRow}>
            <div className={cycleStyles.headerText}>
              <h1 className={cycleStyles.title}>{title}</h1>
              {description ? (
                <p className={cycleStyles.description}>{description}</p>
              ) : null}
            </div>
            <div className={cycleStyles.actionsInline}>{actions}</div>
          </div>
        ) : (
          <>
            <h1 className={`${cycleStyles.title} ${cycleStyles.titleSpaced}`}>
              {title}
            </h1>
            {description ? (
              <p className={cycleStyles.description}>{description}</p>
            ) : null}
            {actions ? (
              <div className={cycleStyles.actionsBelow}>{actions}</div>
            ) : null}
          </>
        )}
      </>
    );
  }

  return (
    <header className={pageStyles.header}>
      {back ? <PageBackLink back={back} variant={variant} /> : null}
      {trail}
      <div className={pageStyles.headerRow}>
        <div className={pageStyles.headerText}>
          <h1 className={pageStyles.title}>{title}</h1>
          {description ? <p className={pageStyles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={pageStyles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
