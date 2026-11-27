export type QcActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_QC_ACTION_STATE: QcActionState = { status: "idle" };
