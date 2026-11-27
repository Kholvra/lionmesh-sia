export function formatAngka(val: number | string | null | undefined): string {
  const num = typeof val === "number" ? val : Number(val ?? 0);
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return "-";
  }
}

export function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "-";
  }
}
