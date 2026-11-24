"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Pelanggan } from "@/core/pelanggan";
import { createPelangganAction, updatePelangganAction } from "../actions";
import { PATH_PELANGGAN } from "../constants";
import { INITIAL_FORM_STATE } from "../form-state";
import styles from "../pelanggan.module.css";

type PelangganFormProps = {
  mode: "new" | "edit";
  pelanggan?: Pelanggan | null;
  canManageCredit?: boolean;
};

export function PelangganForm({
  mode,
  pelanggan,
  canManageCredit = false,
}: PelangganFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(pelanggan);

  const boundAction = isEdit && pelanggan
    ? updatePelangganAction.bind(null, pelanggan.id)
    : createPelangganAction;

  const [state, formAction, isPending] = useActionState(
    boundAction,
    INITIAL_FORM_STATE
  );

  useEffect(() => {
    if (state.ok && state.pelangganId) {
      router.push(`${PATH_PELANGGAN}?pelanggan=${state.pelangganId}`);
      router.refresh();
    }
  }, [state, router]);

  const judulForm = isEdit
    ? `Ubah Data Pelanggan — ${pelanggan?.nama}`
    : "Tambah Pelanggan Baru";

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>{judulForm}</h2>
          <p className={styles.panelSubtitle}>
            {isEdit
              ? "Perubahan data master akan berlaku untuk dokumen transaksi berikutnya."
              : "Lengkapi data pelanggan baru, termin pembayaran, dan informasi kontak."}
          </p>
        </div>
      </div>

      {state.message ? (
        <div
          className={`${styles.alertBox} ${
            state.ok ? styles.alertSuccess : styles.alertError
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className={styles.formGrid}>
        <div>
          <label
            htmlFor="nama"
            style={{
              display: "block",
              marginBottom: "var(--space-1)",
              fontSize: "var(--font-size-caption)",
              fontWeight: 500,
            }}
          >
            Nama Pelanggan <span style={{ color: "var(--color-danger-text)" }}>*</span>
          </label>
          <input
            className={styles.searchInput}
            defaultValue={pelanggan?.nama ?? ""}
            id="nama"
            name="nama"
            placeholder="PT Contoh Sejahtera"
            required
            type="text"
          />
          {state.fieldErrors?.nama ? (
            <p
              style={{
                color: "var(--color-danger-text)",
                fontSize: "var(--font-size-caption)",
                margin: "var(--space-1) 0 0",
              }}
            >
              {state.fieldErrors.nama[0]}
            </p>
          ) : null}
        </div>

        <div className={styles.fieldGrid}>
          <div>
            <label
              htmlFor="terminHari"
              style={{
                display: "block",
                marginBottom: "var(--space-1)",
                fontSize: "var(--font-size-caption)",
                fontWeight: 500,
              }}
            >
              Termin Pembayaran (Hari)
            </label>
            <input
              className={styles.searchInput}
              defaultValue={pelanggan?.terminHari ?? 30}
              id="terminHari"
              name="terminHari"
              placeholder="30"
              type="number"
            />
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "var(--font-size-caption)",
                margin: "var(--space-1) 0 0",
              }}
            >
              Default: 30 hari. 0 untuk tunai.
            </p>
            {state.fieldErrors?.terminHari ? (
              <p
                style={{
                  color: "var(--color-danger-text)",
                  fontSize: "var(--font-size-caption)",
                  margin: "var(--space-1) 0 0",
                }}
              >
                {state.fieldErrors.terminHari[0]}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="batasKredit"
              style={{
                display: "block",
                marginBottom: "var(--space-1)",
                fontSize: "var(--font-size-caption)",
                fontWeight: 500,
              }}
            >
              Batas Kredit Awal (Rp)
            </label>
            <input
              className={styles.searchInput}
              defaultValue={pelanggan?.batasKredit ?? "0"}
              disabled={isEdit && !canManageCredit}
              id="batasKredit"
              name="batasKredit"
              placeholder="0"
              type="text"
            />
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "var(--font-size-caption)",
                margin: "var(--space-1) 0 0",
              }}
            >
              {isEdit && !canManageCredit
                ? "Hanya Manajemen yang berwenang mengubah batas kredit."
                : "Batas kredit awal pelanggan (0 = tunai)."}
            </p>
            {state.fieldErrors?.batasKredit ? (
              <p
                style={{
                  color: "var(--color-danger-text)",
                  fontSize: "var(--font-size-caption)",
                  margin: "var(--space-1) 0 0",
                }}
              >
                {state.fieldErrors.batasKredit[0]}
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.detailSection} style={{ marginTop: "var(--space-2)" }}>
          <h3 className={styles.sectionHeader}>Informasi Kontak & Perpajakan</h3>

          <div style={{ marginBottom: "var(--space-3)" }}>
            <label
              htmlFor="npwp"
              style={{
                display: "block",
                marginBottom: "var(--space-1)",
                fontSize: "var(--font-size-caption)",
                fontWeight: 500,
              }}
            >
              NPWP
            </label>
            <input
              className={styles.searchInput}
              defaultValue={pelanggan?.npwp ?? ""}
              id="npwp"
              name="npwp"
              placeholder="01.234.567.8-901.000"
              type="text"
            />
          </div>

          <div className={styles.fieldGrid} style={{ marginBottom: "var(--space-3)" }}>
            <div>
              <label
                htmlFor="telepon"
                style={{
                  display: "block",
                  marginBottom: "var(--space-1)",
                  fontSize: "var(--font-size-caption)",
                  fontWeight: 500,
                }}
              >
                Nomor Telepon
              </label>
              <input
                className={styles.searchInput}
                defaultValue={pelanggan?.telepon ?? ""}
                id="telepon"
                name="telepon"
                placeholder="021-12345678"
                type="text"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "var(--space-1)",
                  fontSize: "var(--font-size-caption)",
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <input
                className={styles.searchInput}
                defaultValue={pelanggan?.email ?? ""}
                id="email"
                name="email"
                placeholder="kontak@pelanggan.test"
                type="email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="alamat"
              style={{
                display: "block",
                marginBottom: "var(--space-1)",
                fontSize: "var(--font-size-caption)",
                fontWeight: 500,
              }}
            >
              Alamat Lengkap
            </label>
            <textarea
              className={styles.searchInput}
              defaultValue={pelanggan?.alamat ?? ""}
              id="alamat"
              name="alamat"
              placeholder="Jl. Raya Industri No. 12, Bekasi"
              rows={3}
              style={{ height: "auto", padding: "var(--space-2) var(--space-3)" }}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Link
            className={styles.secondaryButton}
            href={
              pelanggan
                ? `${PATH_PELANGGAN}?pelanggan=${pelanggan.id}`
                : PATH_PELANGGAN
            }
          >
            Batal
          </Link>
          <button
            className={styles.primaryButton}
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Pelanggan"}
          </button>
        </div>
      </form>
    </div>
  );
}
