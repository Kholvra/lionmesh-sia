"use client";

import { useContext } from "react";
import type { InputHTMLAttributes } from "react";

import { FieldContext } from "@/components/ui/form-context";
import styles from "@/components/ui/form.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  id,
  name,
  required,
  ...props
}: InputProps) {
  const field = useContext(FieldContext);
  const describedBy = [
    ariaDescribedBy,
    field?.error ? field.errorId : field?.helpText ? field.helpId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      {...props}
      aria-describedby={describedBy || undefined}
      aria-invalid={field?.error ? true : ariaInvalid}
      className={className ? `${styles.input} ${className}` : styles.input}
      id={field?.id ?? id}
      name={field?.name ?? name}
      required={field ? field.required : required}
    />
  );
}
