"use client";

import { ui } from "@/modules/penggajian/ui/kelas";

type PilihanProps = {
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
  invalid?: boolean;
};

/** Native select styled with tokens; FND-007 has no Select primitive yet. */
export function Pilihan({ defaultValue, invalid, name, options, required }: PilihanProps) {
  return (
    <select
      aria-describedby={invalid ? `${name}-error` : undefined}
      aria-invalid={invalid || undefined}
      className={ui.select}
      defaultValue={defaultValue ?? ""}
      id={name}
      name={name}
      required={required}
    >
      <option disabled value="">
        Pilih…
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
