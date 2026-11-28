export type PemilihanActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_PEMILIHAN_ACTION_STATE: PemilihanActionState = {
  status: "idle",
};
