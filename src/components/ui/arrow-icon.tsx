interface ArrowIconProps {
  direction?: "right" | "left";
  className?: string;
}

export function ArrowIcon({ direction = "right", className = "" }: ArrowIconProps) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${direction === "left" ? "rotate-180" : ""} ${className}`}
    >
      <path
        d="M3.33337 8H12.6667M12.6667 8L8.66671 4M12.6667 8L8.66671 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}