"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui";
import {
  cocokkanMutasiAction,
  lepasPasanganAction,
  pasangkanMutasiAction,
  tandaiSelisihAction,
} from "../actions";
import { INITIAL_REKON_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type OpsiJurnal = { id: string; label: string };

type Props = {
  mutasiId: string;
  status: "BELUM_COCOK" | "COCOK" | "SELISIH";
  opsi: readonly OpsiJurnal[];
};

export function MutasiRowActions({ mutasiId, opsi, status }: Props) {
  if (status === "COCOK") {
    return <LepasForm mutasiId={mutasiId} />;
  }

  return (
    <div>
      <CocokkanForm mutasiId={mutasiId} />
      {opsi.length > 0 ? <PasangForm mutasiId={mutasiId} opsi={opsi} /> : null}
      <SelisihForm mutasiId={mutasiId} />
    </div>
  );
}

function CocokkanForm({ mutasiId }: { mutasiId: string }) {
  const [state, action, pending] = useActionState(
    cocokkanMutasiAction,
    INITIAL_REKON_ACTION_STATE,
  );

  return (
    <form action={action} className={table.inlineForm}>
      <input name="mutasi_id" type="hidden" value={mutasiId} />
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "..." : "Cocokkan ulang"}
      </button>
      {state.status === "error" ? (
        <span className={common.messageError} role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span className={common.messageSuccess} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function PasangForm({ mutasiId, opsi }: { mutasiId: string; opsi: readonly OpsiJurnal[] }) {
  const [state, action, pending] = useActionState(
    pasangkanMutasiAction,
    INITIAL_REKON_ACTION_STATE,
  );

  return (
    <form action={action} className={table.inlineForm}>
      <input name="mutasi_id" type="hidden" value={mutasiId} />
      <select aria-label="Baris jurnal" className={table.qtyInput} name="jurnal_detail_id">
        <option value="">Pilih jurnal</option>
        {opsi.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "..." : "Pasangkan"}
      </button>
      {state.status === "error" ? (
        <span className={common.messageError} role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span className={common.messageSuccess} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function SelisihForm({ mutasiId }: { mutasiId: string }) {
  const [state, action, pending] = useActionState(
    tandaiSelisihAction,
    INITIAL_REKON_ACTION_STATE,
  );

  return (
    <form action={action} className={table.inlineForm}>
      <input name="mutasi_id" type="hidden" value={mutasiId} />
      <Input aria-label="Alasan selisih" name="alasan" placeholder="Alasan selisih" />
      <button className={common.dangerButton} disabled={pending} type="submit">
        {pending ? "..." : "Tandai selisih"}
      </button>
      {state.status === "error" ? (
        <span className={common.messageError} role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span className={common.messageSuccess} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

function LepasForm({ mutasiId }: { mutasiId: string }) {
  const [state, action, pending] = useActionState(
    lepasPasanganAction,
    INITIAL_REKON_ACTION_STATE,
  );

  return (
    <form action={action} className={table.inlineForm}>
      <input name="mutasi_id" type="hidden" value={mutasiId} />
      <button className={common.secondaryButton} disabled={pending} type="submit">
        {pending ? "..." : "Lepas pasangan"}
      </button>
      {state.status === "error" ? (
        <span className={common.messageError} role="alert">
          {state.message}
        </span>
      ) : null}
      {state.status === "success" ? (
        <span className={common.messageSuccess} role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
