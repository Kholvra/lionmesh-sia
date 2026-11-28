"use client";

import { useActionState, useState } from "react";

import { FormField, Input } from "@/components/ui";
import { imporMutasiAction, simpanProfilAction } from "../actions";
import { headerCsv } from "../csv";
import { INITIAL_REKON_ACTION_STATE } from "../form-state";
import common from "../../permintaan/permintaan.module.css";
import table from "../../penerimaan/penerimaan.module.css";

type Profil = {
  id: string;
  nama: string;
  pemetaan: {
    tanggal: number;
    nominal: number;
    referensi: number | null;
    arah: number | null;
  };
};

type Props = {
  rekening: readonly { id: string; label: string }[];
  profil: readonly Profil[];
  periode: string;
};

export function ImporForm({ periode, profil, rekening }: Props) {
  const [state, action, pending] = useActionState(
    imporMutasiAction,
    INITIAL_REKON_ACTION_STATE,
  );
  const [header, setHeader] = useState<string[]>([]);
  const [pilihan, setPilihan] = useState<{ tanggal: string; nominal: string; referensi: string; arah: string }>({
    tanggal: "",
    nominal: "",
    referensi: "",
    arah: "",
  });

  function terapkanProfil(id: string) {
    const found = profil.find((item) => item.id === id);
    if (!found) return;
    setPilihan({
      tanggal: String(found.pemetaan.tanggal ?? ""),
      nominal: String(found.pemetaan.nominal ?? ""),
      referensi: found.pemetaan.referensi === null ? "" : String(found.pemetaan.referensi),
      arah: found.pemetaan.arah === null ? "" : String(found.pemetaan.arah),
    });
  }

  async function bacaHeader(berkas: File | null) {
    if (!berkas) {
      setHeader([]);
      return;
    }
    const teks = await berkas.text();
    setHeader(headerCsv(teks));
  }

  return (
    <div>
      <form action={action} className={common.form} noValidate>
        {state.status === "error" && state.message ? (
          <p className={common.messageError} role="alert">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" && state.message ? (
          <p className={common.messageSuccess} role="status">
            {state.message}
          </p>
        ) : null}

        <div className={common.formGrid}>
          <FormField id="impor-rekening" label="Rekening bank" name="rekening_bank_id" required>
            <select className={table.select} id="impor-rekening" name="rekening_bank_id">
              <option value="">Pilih rekening</option>
              {rekening.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="impor-periode" label="Periode (bulan)" name="periode" required>
            <Input defaultValue={periode} id="impor-periode" name="periode" type="month" />
          </FormField>

          <div className={common.fieldFull}>
            <FormField
              helpText="CSV dengan header. Pemisah koma atau titik koma."
              id="impor-berkas"
              label="Berkas mutasi"
              name="berkas"
              required
            >
              <input
                accept=".csv,text/csv"
                className={common.reasonInput}
                id="impor-berkas"
                name="berkas"
                onChange={(event) => void bacaHeader(event.target.files?.[0] ?? null)}
                type="file"
              />
            </FormField>
          </div>

          {profil.length > 0 ? (
            <div className={common.fieldFull}>
              <FormField id="impor-profil" label="Pakai profil pemetaan" name="profil_id">
                <select
                  className={table.select}
                  defaultValue=""
                  id="impor-profil"
                  onChange={(event) => terapkanProfil(event.target.value)}
                >
                  <option value="">Tanpa profil</option>
                  {profil.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          ) : null}
        </div>

        {header.length === 0 ? (
          <p className={common.panelMeta}>
            Pilih berkas untuk membaca header kolom.
          </p>
        ) : (
          <div className={common.formGrid}>
            <FormField id="kolom-tanggal" label="Kolom tanggal" name="kolom_tanggal" required>
              <select className={table.select} id="kolom-tanggal" name="kolom_tanggal" value={pilihan.tanggal} onChange={(e) => setPilihan({ ...pilihan, tanggal: e.target.value })}>
                <option value="">Pilih kolom</option>
                {header.map((nama, index) => (
                  <option key={`t-${index}`} value={index}>{nama || `Kolom ${index + 1}`}</option>
                ))}
              </select>
            </FormField>

            <FormField id="kolom-nominal" label="Kolom nominal" name="kolom_nominal" required>
              <select className={table.select} id="kolom-nominal" name="kolom_nominal" value={pilihan.nominal} onChange={(e) => setPilihan({ ...pilihan, nominal: e.target.value })}>
                <option value="">Pilih kolom</option>
                {header.map((nama, index) => (
                  <option key={`n-${index}`} value={index}>{nama || `Kolom ${index + 1}`}</option>
                ))}
              </select>
            </FormField>

            <FormField id="kolom-referensi" label="Kolom referensi (opsional)" name="kolom_referensi">
              <select className={table.select} id="kolom-referensi" name="kolom_referensi" value={pilihan.referensi} onChange={(e) => setPilihan({ ...pilihan, referensi: e.target.value })}>
                <option value="">Tidak ada</option>
                {header.map((nama, index) => (
                  <option key={`r-${index}`} value={index}>{nama || `Kolom ${index + 1}`}</option>
                ))}
              </select>
            </FormField>

            <FormField id="kolom-arah" label="Kolom arah (opsional)" name="kolom_arah">
              <select className={table.select} id="kolom-arah" name="kolom_arah" value={pilihan.arah} onChange={(e) => setPilihan({ ...pilihan, arah: e.target.value })}>
                <option value="">Tanpa kolom arah</option>
                {header.map((nama, index) => (
                  <option key={`a-${index}`} value={index}>{nama || `Kolom ${index + 1}`}</option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        <div className={common.formActions}>
          <button className={common.primaryButton} disabled={pending} type="submit">
            {pending ? "Mengimpor..." : "Impor mutasi"}
          </button>
        </div>
      </form>

      <hr className={common.sectionDivider} />

      <ProfilForm rekening={rekening} />
    </div>
  );
}

function ProfilForm({ rekening }: { rekening: readonly { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(
    simpanProfilAction,
    INITIAL_REKON_ACTION_STATE,
  );

  return (
    <form action={action} className={common.form}>
      {state.status === "error" && state.message ? (
        <p className={common.messageError} role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className={common.messageSuccess} role="status">
          {state.message}
        </p>
      ) : null}

      <div className={common.formGrid}>
        <FormField id="profil-nama" label="Nama profil pemetaan" name="nama" required>
          <Input id="profil-nama" name="nama" placeholder="Contoh: BCA koran" />
        </FormField>
        <FormField id="profil-rekening" label="Rekening" name="rekening_bank_id">
          <select className={table.select} id="profil-rekening" name="rekening_bank_id">
            <option value="">Semua rekening</option>
            {rekening.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </FormField>
        <FormField id="profil-tanggal" label="Indeks kolom tanggal" name="kolom_tanggal" required>
          <Input id="profil-tanggal" inputMode="numeric" name="kolom_tanggal" placeholder="0" />
        </FormField>
        <FormField id="profil-nominal" label="Indeks kolom nominal" name="kolom_nominal" required>
          <Input id="profil-nominal" inputMode="numeric" name="kolom_nominal" placeholder="1" />
        </FormField>
        <FormField id="profil-referensi" label="Indeks kolom referensi" name="kolom_referensi">
          <Input id="profil-referensi" inputMode="numeric" name="kolom_referensi" placeholder="2" />
        </FormField>
        <FormField id="profil-arah" label="Indeks kolom arah" name="kolom_arah">
          <Input id="profil-arah" inputMode="numeric" name="kolom_arah" placeholder="3" />
        </FormField>
      </div>

      <div className={common.formActions}>
        <button className={common.secondaryButton} disabled={pending} type="submit">
          {pending ? "Menyimpan..." : "Simpan profil"}
        </button>
      </div>
    </form>
  );
}
