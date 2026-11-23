"use client";

import Link from "next/link";

import { Form, FormField, Input } from "@/components/ui";
import type { AksiState } from "@/modules/penggajian/karyawan/actions";
import { Pilihan } from "@/modules/penggajian/karyawan/components/pilihan";
import { useAksiForm } from "@/modules/penggajian/karyawan/components/use-aksi-form";
import { TIPE_KARYAWAN } from "@/modules/penggajian/karyawan/rules";
import type { DaftarAktif, Karyawan } from "@/modules/penggajian/karyawan/types";
import { Notice } from "@/modules/penggajian/shell/notice";
import ui from "@/modules/penggajian/shell/ui.module.css";

type KaryawanFormProps = {
  aksi: (state: AksiState, formData: FormData) => Promise<AksiState>;
  daftar: DaftarAktif;
  batalHref: string;
  /** Present when editing; NIK is then fixed. */
  karyawan?: Karyawan;
};

export function KaryawanForm({ aksi, batalHref, daftar, karyawan }: KaryawanFormProps) {
  const { fieldErrors: e, message, onSubmit, pending } = useAksiForm(aksi);
  const ubah = Boolean(karyawan);
  const opsi = (list: readonly { id: string; nama: string }[]) =>
    list.map((item) => ({ value: item.id, label: item.nama }));

  return (
    <Form className={ui.card} onSubmit={onSubmit}>
      {message ? <Notice title={message} tone="danger" /> : null}
      <p className={ui.cardHint}>
        Tanda * wajib diisi. NIK 16 digit angka dan tidak boleh sama dengan karyawan lain.
      </p>

      <fieldset className={ui.formSection}>
        <legend className={ui.legend}>Identitas</legend>
        <div className={ui.formGrid}>
          {ubah ? (
            <FormField helpText="NIK tidak bisa diubah." label="NIK" name="nikTetap">
              <Input className={ui.numeric} readOnly value={karyawan?.nik} />
            </FormField>
          ) : (
            <FormField error={e.nik} label="NIK" name="nik" required>
              <Input autoComplete="off" className={ui.numeric} inputMode="numeric" maxLength={16} placeholder="3216051290010005" />
            </FormField>
          )}
          <FormField error={e.nama} label="Nama lengkap" name="nama" required>
            <Input defaultValue={karyawan?.nama} />
          </FormField>
          <FormField error={e.departemenId} label="Departemen" name="departemenId" required>
            <Pilihan defaultValue={karyawan?.departemenId} invalid={Boolean(e.departemenId)} name="departemenId" options={opsi(daftar.departemen)} required />
          </FormField>
          <FormField error={e.jabatanId} label="Jabatan" name="jabatanId" required>
            <Pilihan defaultValue={karyawan?.jabatanId} invalid={Boolean(e.jabatanId)} name="jabatanId" options={opsi(daftar.jabatan)} required />
          </FormField>
          <FormField error={e.tipe} label="Tipe" name="tipe" required>
            <Pilihan defaultValue={karyawan?.tipe} invalid={Boolean(e.tipe)} name="tipe" options={TIPE_KARYAWAN} required />
          </FormField>
          <FormField error={e.tanggalMasuk} label="Tanggal masuk" name="tanggalMasuk" required>
            <Input defaultValue={karyawan?.tanggalMasuk} type="date" />
          </FormField>
        </div>
      </fieldset>

      <fieldset className={ui.formSection}>
        <legend className={ui.legend}>Pajak dan rekening</legend>
        <div className={ui.formGrid}>
          <FormField error={e.ptkpKode} helpText="Hanya kategori dari daftar PTKP yang berlaku." label="Status PTKP" name="ptkpKode" required>
            <Pilihan
              defaultValue={karyawan?.ptkpKode}
              invalid={Boolean(e.ptkpKode)}
              name="ptkpKode"
              options={daftar.ptkp.map((item) => ({ value: item.kode, label: `${item.kode} · ${item.keterangan}` }))}
              required
            />
          </FormField>
          <FormField error={e.rekeningNamaBank} label="Nama bank" name="rekeningNamaBank" required>
            <Input defaultValue={karyawan?.rekening.namaBank} placeholder="BCA" />
          </FormField>
          <FormField error={e.rekeningNomor} helpText="Angka saja." label="Nomor rekening" name="rekeningNomor" required>
            <Input className={ui.numeric} defaultValue={karyawan?.rekening.nomor} inputMode="numeric" />
          </FormField>
          <FormField error={e.rekeningNamaPemilik} label="Nama pemilik rekening" name="rekeningNamaPemilik" required>
            <Input defaultValue={karyawan?.rekening.namaPemilik} />
          </FormField>
        </div>
      </fieldset>

      {ubah ? null : (
        <fieldset className={ui.formSection}>
          <legend className={ui.legend}>Gaji pokok awal</legend>
          <div className={ui.formGrid}>
            <FormField error={e.gajiPokok} helpText="Rupiah, tanpa desimal. Contoh: 2.500.000" label="Gaji pokok" name="gajiPokok" required>
              <Input className={ui.numeric} inputMode="numeric" />
            </FormField>
            <FormField error={e.tanggalBerlaku} label="Tanggal berlaku" name="tanggalBerlaku" required>
              <Input type="date" />
            </FormField>
          </div>
        </fieldset>
      )}

      <div className={ui.formActions}>
        <button className={`${ui.button} ${ui.primary}`} disabled={pending} type="submit">
          {pending ? "Menyimpan…" : ubah ? "Simpan perubahan" : "Simpan karyawan"}
        </button>
        <Link className={ui.button} href={batalHref}>
          Batal
        </Link>
      </div>
    </Form>
  );
}
