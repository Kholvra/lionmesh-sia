export type InvoiceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const INITIAL_INVOICE_ACTION_STATE: InvoiceActionState = { status: "idle" };
