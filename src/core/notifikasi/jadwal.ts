import type { StatusPengirimanEmail } from "./types";

/**
 * Kebijakan kirim ulang email (PT-07, `[USULAN-AGEN]`): tiga percobaan otomatis
 * dengan jeda 5, 15, dan 60 menit setelah percobaan pertama.
 */
export const JEDA_PERCOBAAN_MENIT = [5, 15, 60] as const;

/** Percobaan pertama ditambah tiga percobaan otomatis. */
export const MAKS_PERCOBAAN = JEDA_PERCOBAAN_MENIT.length + 1;

const ALASAN_UMUM = "Penyedia email tidak dapat dihubungi.";
const ALASAN_AKHIR = "Email gagal setelah tiga percobaan otomatis.";

export interface HasilPercobaan {
  status: StatusPengirimanEmail;
  percobaan: number;
  alasan: string | null;
  jadwalBerikutnya: string | null;
}

export interface InputPercobaan {
  /** Percobaan yang sudah tercatat sebelum percobaan ini. */
  percobaan: number;
  berhasil: boolean;
  alasan?: string | null;
  sekarang: Date;
}

/** INV-03/AC-08: `gagal` dan `terkirim` adalah status akhir di versi awal. */
export function bolehDicoba(status: StatusPengirimanEmail): boolean {
  return status === "menunggu";
}

function normalisasiAlasan(alasan: string | null | undefined): string {
  const teks = alasan?.trim();
  return teks && teks.length > 0 ? teks : ALASAN_UMUM;
}

export function hitungPercobaan(input: InputPercobaan): HasilPercobaan {
  const percobaan = input.percobaan + 1;

  if (input.berhasil) {
    return { alasan: null, jadwalBerikutnya: null, percobaan, status: "terkirim" };
  }

  const alasan = normalisasiAlasan(input.alasan);

  if (percobaan >= MAKS_PERCOBAAN) {
    return {
      alasan: `${ALASAN_AKHIR} Alasan terakhir: ${alasan}`,
      jadwalBerikutnya: null,
      percobaan,
      status: "gagal",
    };
  }

  const jedaMenit = JEDA_PERCOBAAN_MENIT[percobaan - 1];
  return {
    alasan,
    jadwalBerikutnya: new Date(
      input.sekarang.getTime() + jedaMenit * 60_000,
    ).toISOString(),
    percobaan,
    status: "menunggu",
  };
}
