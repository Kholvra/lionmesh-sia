"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import type { SelectHTMLAttributes } from "react";

import { FieldContext } from "@/components/ui/form-context";

export type SelectOption = string | { value: string; label: string; disabled?: boolean };
export type SelectSize = "sm" | "md" | "lg";
export type SelectVariant = "native" | "custom";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  /** `native` keeps the form control; `custom` keeps the dropdown trigger. */
  variant?: SelectVariant;
  size?: SelectSize;
  options?: readonly SelectOption[];
  placeholder?: string;
  /** Dropdown opens above or below its trigger. */
  direction?: "down" | "up";
  invalid?: boolean;
  /** Error message; presence marks the control invalid. */
  error?: string;
  /** Value-style callback used by the custom dropdown. */
  onValueChange?: (value: string) => void;
};

export type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  direction?: "down" | "up";
  disabled?: boolean;
  size?: SelectSize;
  invalid?: boolean;
};

const nativeBase = [
  "w-full border-[length:var(--border-width-default)] border-solid border-[var(--border-input)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[color:var(--text-primary)]",
  "focus-visible:border-[var(--border-focus)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[var(--focus-ring-offset)]",
  "aria-invalid:border-[var(--status-danger-text)] disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[color:var(--text-muted)]",
].join(" ");

const controlSize: Record<SelectSize, string> = {
  sm: "h-[var(--button-sm-height)] px-[var(--space-3)] text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]",
  md: "h-[var(--control-height)] px-[var(--space-3)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)]",
  lg: "h-[var(--button-lg-height)] px-[var(--space-4)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)]",
};

const customTextSize: Record<SelectSize, string> = {
  sm: "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]",
  md: "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]",
  lg: "text-[length:var(--font-size-body)] leading-[var(--line-height-body)]",
};

function optionLabel(option: SelectOption): string {
  return typeof option === "string" ? option : option.label;
}

function optionValue(option: SelectOption): string {
  return typeof option === "string" ? option : option.value;
}

type DropdownViewProps = {
  describedBy?: string;
  direction: "down" | "up";
  disabled?: boolean;
  invalid: boolean;
  onValueChange?: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  selectedValue: string;
  size: SelectSize;
};

function DropdownView({
  describedBy,
  direction,
  disabled,
  invalid,
  onValueChange,
  options,
  placeholder = "Pilih...",
  selectedValue,
  size,
}: DropdownViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = `pilihan-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerClass = [
    "flex w-full min-h-[var(--control-height)] items-center justify-between rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-left transition-colors outline-none",
    customTextSize[size],
    invalid
      ? "border-[var(--status-danger-text)]"
      : isOpen
        ? "border-[var(--brand-500)] ring-[var(--focus-ring-width)] ring-[color:var(--brand-50)]"
        : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]",
    disabled ? "cursor-not-allowed opacity-70" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative mt-[var(--space-2)]" ref={containerRef}>
      <button
        aria-describedby={describedBy || undefined}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        className={triggerClass}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        role="combobox"
        type="button"
      >
        <span
          className={
            selectedValue
              ? "text-[color:var(--text-primary)]"
              : "text-[color:var(--text-muted)]"
          }
        >
          {selectedValue || placeholder}
        </span>

        <svg
          aria-hidden="true"
          className={`shrink-0 text-[color:var(--ink-500)] transition-transform duration-[var(--motion-base)] ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          height="14"
          viewBox="0 0 16 16"
          width="14"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {isOpen && !disabled ? (
        <div
          className={`absolute left-0 z-30 w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] ${
            direction === "up"
              ? "bottom-full mb-[var(--space-2)]"
              : "top-full mt-[var(--space-2)]"
          }`}
        >
          <ul className="max-h-72 overflow-y-auto py-[var(--space-1)]" id={listId} role="listbox">
            {options.map((option) => {
              const label = optionLabel(option);
              const isSelected = optionValue(option) === selectedValue;
              const isDisabled = typeof option !== "string" && option.disabled;
              return (
                <li key={optionValue(option)}>
                  <button
                    className={`flex w-full items-center justify-between px-[var(--space-3)] py-[var(--space-2)] text-left transition-colors ${
                      customTextSize[size]
                    } ${
                      isSelected
                        ? "bg-[var(--bg-selected)] font-semibold text-[color:var(--brand-700)]"
                        : "font-normal text-[color:var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                    disabled={isDisabled}
                    aria-selected={isSelected}
                    onClick={() => {
                      onValueChange?.(optionValue(option));
                      setIsOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <span>{label}</span>
                    {isSelected ? (
                      <svg
                        aria-hidden="true"
                        className="shrink-0 text-[color:var(--brand-500)]"
                        fill="none"
                        height="14"
                        viewBox="0 0 16 16"
                        width="14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.33337 8.5L6.33337 11.5L12.6667 4.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * One select for the three shapes used in the app: field-aware native select,
 * token-styled native select with options, and the custom dropdown.
 */
export function Select({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  children,
  className,
  direction = "down",
  disabled,
  error,
  id,
  invalid,
  name,
  onValueChange,
  options,
  placeholder,
  required,
  size = "md",
  variant = "native",
  ...props
}: SelectProps) {
  const field = useContext(FieldContext);
  const isInvalid = Boolean(invalid || error) || Boolean(field?.error);
  const describedBy = Array.from(
    new Set(
      [
        ariaDescribedBy,
        field?.error ? field.errorId : field?.helpText ? field.helpId : undefined,
      ].filter(Boolean) as string[],
    ),
  ).join(" ");

  if (variant === "custom") {
    const selectedValue =
      typeof props.value === "string" ? props.value : String(props.defaultValue ?? "");
    return (
      <DropdownView
        describedBy={describedBy}
        direction={direction}
        disabled={disabled}
        invalid={isInvalid}
        onValueChange={onValueChange}
        options={options ?? []}
        placeholder={placeholder}
        selectedValue={selectedValue}
        size={size}
      />
    );
  }

  return (
    <select
      {...props}
      aria-describedby={describedBy || undefined}
      aria-invalid={isInvalid || ariaInvalid || undefined}
      className={className ?? `${nativeBase} ${controlSize[size]}`}
      disabled={disabled}
      id={field?.id ?? id}
      name={field?.name ?? name}
      required={field ? field.required : required}
    >
      {children ??
        (options ? (
          <>
            {placeholder ? (
              <option disabled value="">
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                disabled={typeof option !== "string" ? option.disabled : undefined}
                key={optionValue(option)}
                value={optionValue(option)}
              >
                {optionLabel(option)}
              </option>
            ))}
          </>
        ) : null)}
    </select>
  );
}

/** Dropdown facade matching the original `CustomSelect` prop surface. */
export function CustomSelect({
  direction = "down",
  disabled,
  invalid,
  onChange,
  options,
  placeholder = "Pilih...",
  size = "md",
  value,
}: CustomSelectProps) {
  return (
    <Select
      direction={direction}
      disabled={disabled}
      invalid={invalid}
      onValueChange={onChange}
      options={options}
      placeholder={placeholder}
      size={size}
      value={value}
      variant="custom"
    />
  );
}

/** Native options facade matching the payroll `Pilihan` prop surface. */
export function PilihanSelect({
  defaultValue,
  id,
  invalid,
  name,
  options,
  required,
}: {
  defaultValue?: string;
  id?: string;
  invalid?: boolean;
  name?: string;
  options: readonly { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <Select
      defaultValue={defaultValue ?? ""}
      id={id ?? name}
      invalid={invalid}
      name={name}
      options={options}
      placeholder="Pilih…"
      required={required}
    />
  );
}

