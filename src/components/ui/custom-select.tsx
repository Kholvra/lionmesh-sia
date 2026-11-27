"use client";

import { useEffect, useRef, useState } from "react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  direction?: "down" | "up";
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  direction = "down",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative mt-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-[8px] border bg-white px-3.5 py-2 text-left text-[13px] transition outline-none ${
          isOpen
            ? "border-[#E88A06] ring-2 ring-[#E88A06]/15"
            : "border-[#E5E7EB] hover:border-slate-300"
        }`}
      >
        <span className={value ? "text-[#172335]" : "text-[#94A3B8]"}>
          {value || placeholder}
        </span>

        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 text-[#526174] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-30 w-full rounded-[8px] border border-[#E5E7EB] bg-white shadow-lg ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <ul className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option === value;
              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] transition-colors ${
                      isSelected
                        ? "bg-amber-50/70 font-semibold text-[#C96A00]"
                        : "font-normal text-[#172335] hover:bg-slate-50"
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 text-[#E88A06]"
                      >
                        <path
                          d="M3.33337 8.5L6.33337 11.5L12.6667 4.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}