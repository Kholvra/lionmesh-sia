import { cekIzin } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";

export type AksesKaryawan = {
  bolehMembaca: boolean;
  identitas: boolean;
  gajiPtkp: boolean;
  rekening: boolean;
  bolehMengubah: boolean;
};

export function aksesKaryawan(peran: Peran | null): AksesKaryawan {
  return {
    bolehMembaca: cekIzin(peran, "baca_data_karyawan"),
    identitas: cekIzin(peran, "baca_identitas_karyawan"),
    gajiPtkp: cekIzin(peran, "baca_gaji_ptkp_karyawan"),
    rekening: cekIzin(peran, "baca_rekening_karyawan"),
    bolehMengubah: cekIzin(peran, "kelola_data_karyawan"),
  };
}
