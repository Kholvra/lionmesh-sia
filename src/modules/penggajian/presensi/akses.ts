import { cekIzin } from "@/lib/auth/permissions";
import type { SesiPenggajian } from "@/modules/penggajian/akun/akun";

/*
 * Readers from GJ-002 "Siapa boleh melihat" (P-08): HR reads everyone and a
 * Karyawan reads only their own rows. The database enforces the same split
 * (presensi_aman, lembur_aman); these flags only decide which screen to show.
 */
export type AksesPresensi = {
  bolehMembaca: boolean;
  bolehCatatAtasNama: boolean;
  bolehAjukanLembur: boolean;
  mandiri: boolean;
};

export function aksesPresensi(sesi: SesiPenggajian): AksesPresensi {
  const hr = sesi.peran === "HR";
  const mandiri = sesi.peran === "Karyawan" && sesi.karyawanId !== null;
  return {
    bolehMembaca: hr || mandiri,
    bolehCatatAtasNama: hr && cekIzin(sesi.peran, "catat_presensi_mandiri"),
    bolehAjukanLembur: (hr || mandiri) && cekIzin(sesi.peran, "ajukan_lembur_mandiri"),
    mandiri,
  };
}
