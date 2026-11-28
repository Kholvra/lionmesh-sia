import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { ArrowIcon } from "@/components/ui/arrow-icon";

export type TableActionLinkProps = Omit<
  ComponentProps<typeof Link>,
  "children" | "className"
> & {
  children: ReactNode;
  className?: string;
  direction?: "right" | "left";
  iconPosition?: "start" | "end";
  spacing?: "tight" | "default";
  underline?: boolean;
};

const BASE =
  "group inline-flex items-center text-[length:var(--font-size-label)] font-semibold text-[color:var(--text-link)] hover:text-[color:var(--brand-500)]";
const ICON_RIGHT =
  "transition-transform duration-[var(--motion-fast)] group-hover:translate-x-0.5";
const ICON_LEFT =
  "transition-transform duration-[var(--motion-fast)] group-hover:-translate-x-0.5";

/** Link used in table action cells and back links; the arrow follows the label by default. */
export function TableActionLink({
  children,
  className,
  direction = "right",
  iconPosition = "end",
  spacing = "default",
  underline = false,
  ...linkProps
}: TableActionLinkProps) {
  const icon = (
    <ArrowIcon
      className={direction === "left" ? ICON_LEFT : ICON_RIGHT}
      direction={direction}
    />
  );

  return (
    <Link
      {...linkProps}
      className={`${BASE} ${
        spacing === "tight" ? "gap-[var(--space-1)]" : "gap-[var(--space-2)]"
      } ${underline ? "transition-all hover:underline" : ""} ${className ?? ""}`}
    >
      {iconPosition === "start" ? (
        <>
          {icon}
          <span>{children}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {icon}
        </>
      )}
    </Link>
  );
}
