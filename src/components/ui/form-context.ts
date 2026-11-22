"use client";

import { createContext } from "react";

export type FormContextValue = {
  errors: Record<string, string>;
};

export type FieldContextValue = {
  id: string;
  name: string;
  required: boolean;
  error?: string;
  errorId: string;
  helpText?: string;
  helpId: string;
};

export const FormContext = createContext<FormContextValue | undefined>(undefined);
export const FieldContext = createContext<FieldContextValue | undefined>(undefined);
