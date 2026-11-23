/**
 * Types and constants shared with client components.
 * Keep this module free of `zod`: `schema.ts` imports zod, and a client
 * component that imports anything from it would ship zod to the browser.
 */

export type PemasokField =
  | "nama"
  | "alamat"
  | "npwp"
  | "kontak_perusahaan"
  | "kontak_pic_nama"
  | "kontak_pic_telepon"
  | "termin_hari"
  | "toleransi_persen"
  | "toleransi_nominal";

export type PemasokFieldErrors = Partial<Record<PemasokField, string>>;

export type PemasokActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: PemasokFieldErrors;
};

export const INITIAL_PEMASOK_ACTION_STATE: PemasokActionState = {
  status: "idle",
};
