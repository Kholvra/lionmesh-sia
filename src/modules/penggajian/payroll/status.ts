import type { StatusOption } from "@/components/ui";

export const STATUS_DRAFT: readonly StatusOption[] = [
  { value: "BELUM", label: "Belum dihitung", tone: "neutral" },
  { value: "DRAFT_TERHITUNG", label: "Draft terhitung", tone: "info" },
  { value: "REVISI", label: "Revisi", tone: "danger" },
  { value: "DIPERIKSA", label: "Diperiksa Accounting", tone: "warning" },
  { value: "DISETUJUI", label: "Disetujui Direksi", tone: "success" },
  { value: "DIBAYAR", label: "Dibayar", tone: "success" },
  { value: "GAGAL_TRANSFER", label: "Gagal transfer", tone: "danger" },
  { value: "DIPOSTING", label: "Diposting", tone: "success" },
];

/** From approval on, numbers never change; corrections go through reversing journals (D-35, D-43). */
export const STATUS_TERKUNCI: readonly string[] = ["DISETUJUI", "DIBAYAR", "GAGAL_TRANSFER", "DIPOSTING"];
export const terkunci = (status: string | undefined) => status !== undefined && STATUS_TERKUNCI.includes(status);

export const labelDraft = (status: string) => STATUS_DRAFT.find((s) => s.value === status)?.label ?? status;
