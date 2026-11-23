"use client";

import { startTransition, useActionState } from "react";
import type { FormEvent } from "react";

import type { AksiState } from "@/modules/penggajian/karyawan/actions";

type Aksi = (state: AksiState, formData: FormData) => Promise<AksiState>;

/**
 * Dispatches the server action from onSubmit instead of the form `action`
 * prop, so React does not reset the fields when the server rejects the input.
 */
export function useAksiForm(aksi: Aksi) {
  const [state, dispatch, pending] = useActionState(aksi, null);

  function kirim(form: HTMLFormElement) {
    const formData = new FormData(form);
    startTransition(() => dispatch(formData));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    kirim(event.currentTarget);
  }

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const message = state && !state.ok ? state.message : null;

  return { fieldErrors, kirim, message, onSubmit, pending };
}
