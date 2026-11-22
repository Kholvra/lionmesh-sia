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

function getMissingFieldErrors(form: HTMLFormElement) {
  const requiredControls = Array.from(form.elements).filter(isFormControl);
  const invalidControls = requiredControls.filter(
    (control) => control.required && control.validity.valueMissing,
  );
  const errors = Object.fromEntries(
    invalidControls.flatMap((control) => {
      const key = getFieldKey(control);
      const label = getFieldLabel(control);
      return key && label ? [[key, `${label} wajib diisi.`]] : [];
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
    const { errors: nextErrors, invalidControls } = getMissingFieldErrors(
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
      if (key && !target.validity.valueMissing) {
        setErrors((current) => {
          if (!(key in current)) return current;
          const next = { ...current };
          delete next[key];
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
