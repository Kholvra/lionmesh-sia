export type PoActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_PO_ACTION_STATE: PoActionState = { status: "idle" };
