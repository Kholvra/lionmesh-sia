export type PelangganActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  pelangganId?: string;
};

export const INITIAL_FORM_STATE: PelangganActionState = {
  ok: true,
};
