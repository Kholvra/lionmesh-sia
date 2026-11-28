"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { ConfirmDialog, Form, FormField, Input } from "@/components/ui";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { PilihanSelect } from "@/components/ui/select";
import { useAksiForm } from "@/modules/penggajian/karyawan/components/use-aksi-form";
import { Notice } from "@/components/ui/notice";
import { ui } from "@/modules/penggajian/ui/kelas";

export type IsianForm = {
  name: string;
  label: string;
  jenis?: "text" | "date" | "time" | "pilihan" | "file";
  terima?: string;
  pilihan?: readonly { value: string; label: string }[];
  wajib?: boolean;
  bantuan?: string;
  awal?: string;
  contoh?: string;
  lebar?: boolean;
};

type FormAksiProps = {
  aksi: (state: AksiState, formData: FormData) => Promise<AksiState>;
  judul?: string;
  /** One-line hint under the card title, as in the Figma forms. */
  petunjuk?: string;
  /** Cards rendered above the form card inside the same form, e.g. read-only identity. */
  atas?: ReactNode;
  isian: readonly IsianForm[];
  kirimLabel: string;
  batalHref?: string;
  batalLabel?: string;
  /** Destructive submits ask for confirmation first (ConfirmDialog). */
  konfirmasi?: { judul: string; pesan: string; ya: string };
  tersembunyi?: Record<string, string>;
};

/** One form shell for the payroll screens: labels above fields, server-side validation. */
export function FormAksi({ aksi, atas, batalHref, batalLabel = "Batal", isian, judul, kirimLabel, konfirmasi, petunjuk, tersembunyi }: FormAksiProps) {
  const { fieldErrors: e, kirim, message, onSubmit, pending } = useAksiForm(aksi);
  const [buka, setBuka] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <>
      <Form
        className={ui.stack}
        noValidate
        onSubmit={(event) => {
          if (!konfirmasi) return onSubmit(event);
          event.preventDefault();
          formRef.current = event.currentTarget;
          setBuka(true);
        }}
      >
        {message ? <Notice title={message} tone="danger" /> : null}
        {atas}
        {Object.entries(tersembunyi ?? {}).map(([name, value]) => (
          <input key={name} name={name} type="hidden" value={value} />
        ))}
        {judul || isian.length > 0 ? (
          <section className={ui.card}>
            {judul ? <h2 className={ui.cardTitle}>{judul}</h2> : null}
            {petunjuk ? <p className={ui.cardHint}>{petunjuk}</p> : null}
            {isian.length > 0 ? (
              <div className={ui.formGrid}>
                {isian.map((f) => (
                  <div className={f.lebar ? ui.formWide : undefined} key={f.name}>
                    <FormField error={e[f.name]} helpText={f.bantuan} label={f.label} name={f.name} required={f.wajib}>
                      {f.jenis === "pilihan" ? (
                        <PilihanSelect defaultValue={f.awal} invalid={Boolean(e[f.name])} name={f.name} options={f.pilihan ?? []} />
                      ) : (
                        <Input accept={f.terima} defaultValue={f.awal} placeholder={f.contoh} type={f.jenis ?? "text"} />
                      )}
                    </FormField>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        <div className={ui.formActions}>
          <button className={konfirmasi ? ui.buttonDanger : ui.buttonPrimary} disabled={pending} type="submit">
            {pending ? "Menyimpan…" : kirimLabel}
          </button>
          {batalHref ? (
            <Link className={ui.button} href={batalHref}>
              {batalLabel}
            </Link>
          ) : null}
        </div>
      </Form>
      {konfirmasi ? (
        <ConfirmDialog
          cancelLabel="Kembali"
          confirmLabel={konfirmasi.ya}
          description={konfirmasi.pesan}
          destructive
          onConfirm={() => {
            setBuka(false);
            if (formRef.current) kirim(formRef.current);
          }}
          onOpenChange={setBuka}
          open={buka}
          title={konfirmasi.judul}
        />
      ) : null}
    </>
  );
}
