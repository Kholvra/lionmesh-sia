export type PenerimaanActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_PENERIMAAN_ACTION_STATE: PenerimaanActionState = {
  status: "idle",
};
