"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField, Input } from "@/components/ui";
import type { KategoriProduk, Produk, Satuan } from "@/core/master/types";

import { simpanProdukAction } from "../actions";
import { PATH_MASTER_PRODUK } from "../constants";
import { INITIAL_MASTER_ACTION_STATE } from "../form-state";
import { PILIHAN_TIPE_PRODUK } from "../format";
import styles from "../master.module.css";
import { Select } from "./select";

type ProdukFormProps = {
  produk?: Produk;
  satuanAktif: readonly Satuan[];
  kategori: readonly KategoriProduk[];
};

export function ProdukForm({ kategori, produk, satuanAktif }: ProdukFormProps) {
  const [state, formAction, pending] = useActionState(
    simpanProdukAction,
    INITIAL_MASTER_ACTION_STATE,
  );

  const fieldErrors = state.fieldErrors ?? {};
  const cancelHref = produk
    ? `${PATH_MASTER_PRODUK}?id=${produk.id}`
    : PATH_MASTER_PRODUK;

  // Entri lama yang satuannya dinonaktifkan tetap tampil apa adanya, supaya
  // produk lama masih bisa disunting tanpa mengganti satuan dasarnya.
  const satuanPilihan = [...satuanAktif];
  if (produk && !satuanPilihan.some((item) => item.id === produk.satuan_dasar_id)) {
    satuanPilihan.push({
      id: produk.satuan_dasar_id,
      kode: `${produk.satuan_dasar_kode} (nonaktif)`,
      nama: produk.satuan_dasar_nama,
      aktif: false,
      created_at: "",
      updated_at: "",
    });
  }

  const kategoriPilihan = kategori.filter((item) => item.aktif);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {produk ? <input name="id" type="hidden" value={produk.id} /> : null}

      {state.status === "error" && state.message ? (
        <p className={styles.messageError} role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p className={styles.messageSuccess} role="status">
          {state.message}
        </p>
      ) : null}

      <div className={styles.formGrid}>
        <FormField error={fieldErrors.kode} label="Kode produk" name="kode" required>
          <Input
            autoComplete="off"
            defaultValue={produk?.kode ?? ""}
            name="kode"
            placeholder="Contoh: PRD-001"
          />
        </FormField>

        <FormField
          error={fieldErrors.tipe}
          helpText="Tipe menentukan akun persediaan (120, 121, 122)."
          label="Tipe produk"
          name="tipe"
          required
        >
          <Select defaultValue={produk?.tipe ?? ""} name="tipe">
            <option value="">Pilih tipe</option>
            {PILIHAN_TIPE_PRODUK.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className={styles.fieldFull}>
          <FormField error={fieldErrors.nama} label="Nama produk" name="nama" required>
            <Input
              autoComplete="off"
              defaultValue={produk?.nama ?? ""}
              name="nama"
              placeholder="Contoh: Besi Beton Ulir 10 mm"
            />
          </FormField>
        </div>

        <FormField
          error={fieldErrors.satuan_dasar}
          helpText="Hanya satuan aktif yang bisa dipilih."
          label="Satuan dasar"
          name="satuan_dasar"
          required
        >
          <Select
            defaultValue={produk?.satuan_dasar_id ?? ""}
            name="satuan_dasar"
          >
            <option value="">Pilih satuan</option>
            {satuanPilihan.map((item) => (
              <option key={item.id} value={item.id}>
                {item.kode} — {item.nama}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={fieldErrors.kategori}
          helpText="Opsional; hanya kategori aktif yang bisa dipilih."
          label="Kategori produk"
          name="kategori"
        >
          <Select defaultValue={produk?.kategori_id ?? ""} name="kategori">
            <option value="">Tanpa kategori</option>
            {kategoriPilihan.map((item) => (
              <option key={item.id} value={item.id}>
                {item.kode} — {item.nama}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending
            ? "Menyimpan..."
            : produk
              ? "Simpan perubahan"
              : "Simpan produk"}
        </button>
        <Link className={styles.secondaryButton} href={cancelHref}>
          Batal
        </Link>
      </div>
    </form>
  );
}
