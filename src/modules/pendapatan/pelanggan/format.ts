export function formatRupiah(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Rp 0";
  }
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(numeric)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatTermin(hari: number | null | undefined): string {
  if (hari === null || hari === undefined) return "30 hari";
  return `${hari} hari`;
}

export function formatTanggal(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(isoString));
  } catch {
    return "-";
  }
}
