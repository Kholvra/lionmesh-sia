import { cekIzin } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";

/*
 * Field visibility from GJ-001 "Siapa boleh melihat" (P-06, D-58). Finance
 * also sees the name, otherwise an account number cannot be matched to anyone.
 */
const PEMBACA_IDENTITAS: readonly Peran[] = ["HR", "Accounting"];
const PEMBACA_GAJI_PTKP: readonly Peran[] = ["HR", "Accounting"];
const PEMBACA_REKENING: readonly Peran[] = ["HR", "Finance"];
const PEMBACA_DATA_KARYAWAN: readonly Peran[] = ["HR", "Accounting", "Finance"];

export type AksesKaryawan = {
  bolehMembaca: boolean;
  identitas: boolean;
  gajiPtkp: boolean;
  rekening: boolean;
  bolehMengubah: boolean;
};

export function aksesKaryawan(peran: Peran | null): AksesKaryawan {
  const punya = (daftar: readonly Peran[]) => peran !== null && daftar.includes(peran);
  return {
    bolehMembaca: punya(PEMBACA_DATA_KARYAWAN),
    identitas: punya(PEMBACA_IDENTITAS),
    gajiPtkp: punya(PEMBACA_GAJI_PTKP),
    rekening: punya(PEMBACA_REKENING),
    bolehMengubah: cekIzin(peran, "kelola_data_karyawan"),
  };
}
