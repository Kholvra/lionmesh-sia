"use client";

import { useActionState } from "react";

import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { Notice } from "@/modules/penggajian/ui/notice";
import { ui } from "@/modules/penggajian/ui/kelas";

type AbsenTombolProps = {
  aksi: () => Promise<AksiState>;
  label: string;
};

export function AbsenTombol({ aksi, label }: AbsenTombolProps) {
  const [state, dispatch, pending] = useActionState(aksi, null);
  return (
    <form action={dispatch} className={ui.stack}>
      {state && !state.ok ? <Notice title={state.message} tone="danger" /> : null}
      <div>
        <button className={ui.buttonPrimary} disabled={pending} type="submit">
          {pending ? "Mencatat…" : label}
        </button>
      </div>
    </form>
  );
}
