export type PermintaanActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_PERMINTAAN_ACTION_STATE: PermintaanActionState = {
  status: "idle",
};
