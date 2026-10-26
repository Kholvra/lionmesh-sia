"use client";

import { useSearchParams } from "next/navigation";

export function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) {
    return null;
  }

  return (
    <p className="mb-4 w-full max-w-md rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
      {error}
    </p>
  );
}
