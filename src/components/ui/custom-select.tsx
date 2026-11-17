"use client";

import { useEffect, useId, useRef, useState } from "react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  id,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const triggerId = id ?? generatedId;

  // Tutup dropdown saat klik di luar komponen atau tekan Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative mt-1.5">
      {/* Trigger Button */}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-all duration-150 outline-none ${
          isOpen
            ? "border-[#ED8B00] ring-2 ring-[#ED8B00]/20"
            : "border-slate-300 hover:border-slate-400 focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
        } ${disabled ? "cursor-not-allowed bg-slate-50 opacity-60" : "cursor-pointer"}`}
      >
        <span className={`truncate ${value ? "font-medium text-slate-800" : "text-slate-400"}`}>
          {value || placeholder}
        </span>

        {/* Chevron Icon */}
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ED8B00]" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Popover List */}
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute left-0 z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-lg shadow-slate-900/8 ring-1 ring-black/3 animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-amber-50 font-semibold text-[#D97F00]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{option}</span>
                {isSelected && (
                  <svg
                    className="h-4 w-4 shrink-0 text-[#ED8B00]"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}