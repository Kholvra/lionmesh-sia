"use client";

import { useState } from "react";
import type {
  FormEvent,
  FormEventHandler,
  FormHTMLAttributes,
  InputEvent,
} from "react";

import { FormContext } from "@/components/ui/form-context";
import styles from "@/components/ui/form.module.css";

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

function isFormControl(element: EventTarget | null): element is FormControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function getFieldKey(control: FormControl) {
  return control.name || control.id;
}

function getFieldLabel(control: FormControl) {
  return (
    control.labels?.[0]?.textContent?.replace(/\*/g, "").trim() ||
    control.getAttribute("aria-label") ||
    control.name
  );
}

function hasLengthLimits(
  control: FormControl,
): control is HTMLInputElement | HTMLTextAreaElement {
  return control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement;
}

function exceedsMaxLength(control: FormControl) {
  return (
    hasLengthLimits(control) &&
    control.maxLength >= 0 &&
    control.value.length > control.maxLength
  );
}

/** Client feedback only; the server remains authoritative for every rule. */
function getFieldError(control: FormControl): string | undefined {
  const label = getFieldLabel(control);
  if (!label) return undefined;
  const { validity } = control;

  if (validity.valueMissing) return `${label} wajib diisi.`;
  if (validity.typeMismatch) {
    const format =
      control instanceof HTMLInputElement && control.type === "email"
        ? "alamat email yang valid"
        : control instanceof HTMLInputElement && control.type === "url"
          ? "URL yang valid"
          : "nilai yang valid";
    return `${label} harus berupa ${format}.`;
  }
  if (validity.badInput) return `${label} tidak dikenali.`;
  if (validity.patternMismatch) return `${label} tidak sesuai format yang diharapkan.`;
  if (validity.tooShort) {
    const min = hasLengthLimits(control) ? control.minLength : 0;
    return `${label} terlalu pendek (minimal ${min} karakter).`;
  }
  if (validity.tooLong || exceedsMaxLength(control)) {
    const max = hasLengthLimits(control) ? control.maxLength : 0;
    return `${label} terlalu panjang (maksimal ${max} karakter).`;
  }
  if (control instanceof HTMLInputElement) {
    if (validity.rangeUnderflow) return `${label} tidak boleh kurang dari ${control.min}.`;
    if (validity.rangeOverflow) return `${label} tidak boleh lebih dari ${control.max}.`;
    if (validity.stepMismatch) return `${label} tidak sesuai kelipatan yang diizinkan.`;
  }
  return validity.valid ? undefined : `${label} tidak valid.`;
}

function collectFieldErrors(form: HTMLFormElement) {
  const controls = Array.from(form.elements).filter(isFormControl);
  const invalidControls = controls.filter(
    (control) => !control.validity.valid || exceedsMaxLength(control),
  );
  const errors = Object.fromEntries(
    invalidControls.flatMap((control) => {
      const key = getFieldKey(control);
      const message = getFieldError(control);
      return key && message ? [[key, message]] : [];
    }),
  );
  return { errors, invalidControls };
}

export function Form({
  className,
  onInput,
  onReset,
  onSubmit,
  ...props
}: FormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const { errors: nextErrors, invalidControls } = collectFieldErrors(
      event.currentTarget,
    );

    if (invalidControls.length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      invalidControls[0]?.focus();
      return;
    }

    setErrors({});
    onSubmit?.(event);
  }

  function handleInput(event: InputEvent<HTMLFormElement>) {
    const target = event.target;
    if (isFormControl(target)) {
      const key = getFieldKey(target);
      if (key) {
        const message = getFieldError(target);
        setErrors((current) => {
          if (message === current[key] || (!message && !(key in current))) return current;
          const next = { ...current };
          if (message) next[key] = message;
          else delete next[key];
          return next;
        });
      }
    }

    onInput?.(event);
  }

  function handleReset(event: FormEvent<HTMLFormElement>) {
    setErrors({});
    onReset?.(event);
  }

  return (
    <FormContext.Provider value={{ errors }}>
      <form
        {...props}
        className={className ? `${styles.form} ${className}` : styles.form}
        noValidate
        onInput={handleInput}
        onReset={handleReset}
        onSubmit={handleSubmit}
      />
    </FormContext.Provider>
  );
}
