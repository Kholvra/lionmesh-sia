import type { JenisNotifikasi } from "./kejadian.ts";

export interface InputEmail {
  /** Judul kejadian yang sudah disusun database (label + nomor dokumen). */
  judul: string;
  nomorDokumen: string | null;
  tautan: string;
  /** Basis URL aplikasi untuk tautan absolut di email. */
  basisUrl?: string;
}

export interface EmailTerkirim {
  subjek: string;
  teks: string;
}

function absolutkan(tautan: string, basisUrl?: string): string {
  if (!basisUrl) return tautan;
  return `${basisUrl.replace(/\/+$/, "")}/${tautan.replace(/^\/+/, "")}`;
}

/**
 * PT-05/AC-09: isi email hanya judul kejadian, nomor dokumen, dan tautan. The
 * input is narrow on purpose so a caller cannot slip an amount into the body;
 * `JenisNotifikasi` stays imported only to keep the event list in the type graph.
 */
export function susunEmail(input: InputEmail): EmailTerkirim {
  const baris = [
    `Judul: ${input.judul}`,
    input.nomorDokumen ? `Nomor dokumen: ${input.nomorDokumen}` : null,
    `Buka: ${absolutkan(input.tautan, input.basisUrl)}`,
    "Email ini dikirim otomatis oleh SIA Lionmesh.",
  ];

  return {
    subjek: input.judul,
    teks: baris.filter((item): item is string => item !== null).join("\n"),
  };
}

export type { JenisNotifikasi };
