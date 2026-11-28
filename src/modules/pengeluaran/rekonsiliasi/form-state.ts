export type RekonActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_REKON_ACTION_STATE: RekonActionState = { status: "idle" };
