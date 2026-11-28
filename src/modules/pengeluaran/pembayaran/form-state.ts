export type BayarActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_BAYAR_ACTION_STATE: BayarActionState = { status: "idle" };
