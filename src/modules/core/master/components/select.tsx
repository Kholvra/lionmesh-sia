"use client";

import { useContext } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

import { FieldContext } from "@/components/ui/form-context";

import styles from "../master.module.css";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

/**
 * Native select that reads the same field context as `Input`, so `FormField`
 * labels, help text, and error messages work unchanged. FND-007 owns the shared
 * primitive; this stays local until that item adds one.
 */
export function Select({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  children,
  id,
  name,
  required,
  ...props
}: SelectProps) {
  const field = useContext(FieldContext);
  const describedBy = [
    ariaDescribedBy,
    field?.error ? field.errorId : field?.helpText ? field.helpId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <select
      {...props}
      aria-describedby={describedBy || undefined}
      aria-invalid={field?.error ? true : ariaInvalid}
      className={styles.select}
      id={field?.id ?? id}
      name={field?.name ?? name}
      required={field ? field.required : required}
    >
      {children}
    </select>
  );
}
