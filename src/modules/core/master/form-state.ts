/**
 * Types shared with client components.
 * Keep this module free of `zod`: `schema.ts` imports zod, and a client
 * component that imports anything from it would ship zod to the browser.
 */

export type MasterActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const INITIAL_MASTER_ACTION_STATE: MasterActionState = {
  status: "idle",
};
