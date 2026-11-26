"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog, StatusBadge } from "@/components/ui";
import type { PemeriksaanTutupTahun } from "@/core/ledger";
import { formatRupiah } from "@/lib/format/money";

import { tutupTahunAction } from "../actions";
import { STATUS_TAHUN_BUKU } from "../constants";
import styles from "../periode.module.css";

interface TutupTahunProps {
  pemeriksaan: PemeriksaanTutupTahun;
}

export function TutupTahun({ pemeriksaan }: TutupTahunProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pesan, setPesan] = useState<{
    tone: "success" | "danger";
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const terbuka = pemeriksaan.periodeTerbuka;
  const desember = pemeriksaan.desember.status;
  const bisa = pemeriksaan.bisaDitutup;

  function konfirmasi() {
    startTransition(async () => {
      const hasil = await tutupTahunAction(pemeriksaan.tahun);
      if (!hasil.ok) {
        setPesan({ tone: "danger", text: hasil.message });
        return;
      }
      setPesan({
        tone: "success",
        text: `Tahun buku ${pemeriksaan.tahun} berhasil ditutup.`,
      });
      router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="tutup-tahun-title"
      className={`${styles.panel} ${styles.yearSection}`}
      id="tutup-tahun"
    >
      <div className={styles.yearHeader}>
        <div>
          <h2 className={styles.sectionTitle} id="tutup-tahun-title">
            Tutup buku tahunan {pemeriksaan.tahun}
          </h2>
          <p className={styles.sectionMeta}>
            Jan–Nov harus terkunci; Desember dikunci oleh prosedur ini setelah
            jurnal penutup.
          </p>
        </div>
        <StatusBadge
          status={pemeriksaan.status}
          statuses={STATUS_TAHUN_BUKU}
        />
      </div>

      <dl className={styles.pemeriksaanGrid}>
        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Januari–November</dt>
          <dd className={styles.pemeriksaanValue}>
            {terbuka.length === 0 ? (
              <span className={styles.valueSuccess}>
                Tidak ada yang terbuka
              </span>
            ) : (
              <span className={styles.valueDanger}>
                {terbuka.length} periode terbuka
              </span>
            )}
          </dd>
        </div>

        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Desember</dt>
          <dd className={styles.pemeriksaanValue}>
            {desember === "kunci" ? (
              <span className={styles.valueDanger}>Sudah terkunci</span>
            ) : desember === "buka" ? (
              <span className={styles.valueSuccess}>Terbuka</span>
            ) : (
              <span>Belum ada</span>
            )}
          </dd>
        </div>

        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Dokumen setengah posting</dt>
          <dd className={styles.pemeriksaanValue}>
            {pemeriksaan.setengahPosting === 0 ? (
              <span className={styles.valueSuccess}>Tidak ada</span>
            ) : (
              <span className={styles.valueDanger}>
                {pemeriksaan.setengahPosting} dokumen
              </span>
            )}
          </dd>
        </div>

        <div className={styles.pemeriksaanItem}>
          <dt className={styles.pemeriksaanLabel}>Neraca saldo</dt>
          <dd className={styles.pemeriksaanValue}>
            {pemeriksaan.neraca.seimbang ? (
              <span className={styles.valueSuccess}>
                Seimbang · {formatRupiah(pemeriksaan.neraca.totalDebitCents)}
              </span>
            ) : (
              <span className={styles.valueDanger}>
                Tidak seimbang · selisih{" "}
                {formatRupiah(pemeriksaan.neraca.selisihCents)}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {pesan ? (
        <p
          className={
            pesan.tone === "success" ? styles.alertSuccess : styles.alertDanger
          }
          role={pesan.tone === "danger" ? "alert" : "status"}
        >
          {pesan.text}
        </p>
      ) : null}

      {!bisa ? (
        <ul className={styles.reasonList}>
          {pemeriksaan.alasan.map((alasan) => (
            <li key={alasan}>{alasan}</li>
          ))}
        </ul>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
          disabled={!bisa || pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {pending ? "Menutup…" : "Tutup buku tahunan"}
        </button>
      </div>

      <ConfirmDialog
        confirmLabel={`Tutup buku ${pemeriksaan.tahun}`}
        description={
          <div className={styles.dialogStack}>
            <p>
              Jurnal penutup ke 302 Laba ditahan akan dibuat di Desember{" "}
              {pemeriksaan.tahun} bila ada saldo nominal. Desember lalu dikunci
              dan tahun buku ditandai ditutup.
            </p>
            <ul className={styles.dialogList}>
              <li>
                Jan–Nov:{" "}
                {terbuka.length === 0
                  ? "tidak ada yang terbuka"
                  : `${terbuka.length} periode terbuka`}
              </li>
              <li>
                Desember:{" "}
                {desember === "kunci"
                  ? "sudah terkunci"
                  : desember === "buka"
                    ? "terbuka"
                    : "belum ada"}
              </li>
              <li>Dokumen setengah posting: {pemeriksaan.setengahPosting}</li>
              <li>
                Neraca saldo:{" "}
                {pemeriksaan.neraca.seimbang
                  ? `seimbang · ${formatRupiah(pemeriksaan.neraca.totalDebitCents)}`
                  : `tidak seimbang · selisih ${formatRupiah(pemeriksaan.neraca.selisihCents)}`}
              </li>
            </ul>
            <p>
              Tindakan ini tidak bisa dibatalkan. Koreksi setelah tutup buku
              dibuat sebagai jurnal pembalik di periode berjalan.
            </p>
          </div>
        }
        onCancel={() => setOpen(false)}
        onConfirm={konfirmasi}
        onOpenChange={setOpen}
        open={open}
        pending={pending}
        title={`Tutup buku tahunan ${pemeriksaan.tahun}?`}
      />
    </section>
  );
}
