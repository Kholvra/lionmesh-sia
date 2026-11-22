"use client";

import { useContext, useId } from "react";
import type { ReactNode } from "react";

import { FieldContext, FormContext } from "@/components/ui/form-context";
import styles from "@/components/ui/form.module.css";

export type FormFieldProps = {
  label: string;
  name?: string;
  id?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({
  children,
  error,
  helpText,
  id,
  label,
  name,
  required = false,
}: FormFieldProps) {
  const generatedId = useId().replace(/:/g, "");
  const fieldId = id ?? name ?? `field-${generatedId}`;
  const fieldName = name ?? fieldId;
  const form = useContext(FormContext);
  const message = error ?? form?.errors[fieldName];
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={styles.field}>
      <FieldContext.Provider
        value={{
          id: fieldId,
          name: fieldName,
          required,
          error: message,
          errorId,
          helpText,
          helpId,
        }}
      >
        <label className={styles.fieldLabel} htmlFor={fieldId}>
          {label}
          {required ? (
            <span aria-hidden="true" className={styles.requiredMark}>
              *
            </span>
          ) : null}
        </label>
        {children}
        {message ? (
          <span className={styles.fieldError} id={errorId} role="alert">
            <span aria-hidden="true" className={styles.errorIcon}>
              !
            </span>
            {message}
          </span>
        ) : helpText ? (
          <span className={styles.fieldHelp} id={helpId}>
            {helpText}
          </span>
        ) : null}
      </FieldContext.Provider>
    </div>
  );
}
