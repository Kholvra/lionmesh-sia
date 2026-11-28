"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
  type StatusOption,
} from "@/components/ui";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { useTableState } from "@/components/ui/use-table-state";
import type { Notifikasi } from "@/core/notifikasi";
import { formatTanggalWaktu } from "@/lib/format/date";

import { tandaiDibacaAction } from "../actions";
import styles from "../notifikasi.module.css";

const STATUS_EMAIL: readonly StatusOption[] = [
  { label: "Menunggu", tone: "warning", value: "menunggu" },
  { label: "Terkirim", tone: "success", value: "terkirim" },
  { label: "Gagal", tone: "danger", value: "gagal" },
  { label: "Perlu pemeriksaan", tone: "warning", value: "perlu_pemeriksaan" },
];

const STATUS_BACA: readonly StatusOption[] = [
  { label: "Belum dibaca", tone: "info", value: "belum" },
  { label: "Sudah dibaca", tone: "neutral", value: "sudah" },
];

type DaftarNotifikasiProps = {
  rows: readonly Notifikasi[];
  errorMessage?: string;
};

export function DaftarNotifikasi({ errorMessage, rows }: DaftarNotifikasiProps) {
  const router = useRouter();
  const [pesan, setPesan] = useState<string | null>(null);
  const [sedangProses, mulaiProses] = useTransition();

  const columns = useMemo<DataTableColumn<Notifikasi>[]>(
    () => [
      {
        header: "Notifikasi",
        id: "judul",
        render: (row) => (
          <span className={styles.cellStack}>
            <span className={styles.cellTitle}>{row.judul}</span>
            <span className={styles.cellMeta}>{formatTanggalWaktu(row.created_at)}</span>
          </span>
        ),
      },
      {
        header: "Baca",
        id: "baca",
        render: (row) => (
          <span className={styles.cellStack}>
            <StatusBadge
              status={row.dibaca_at ? "sudah" : "belum"}
              statuses={STATUS_BACA}
            />
            {row.dibaca_at ? null : (
              <SubmitButton
                className={styles.secondaryButton}
                disabled={sedangProses}
                onClick={() => {
                  mulaiProses(async () => {
                    const hasil = await tandaiDibacaAction(row.id);
                    if (!hasil.ok) {
                      setPesan(hasil.message);
                      return;
                    }
                    setPesan(null);
                    router.refresh();
                  });
                }}
                type="button"
                variant="secondary"
              >
                Tandai dibaca
              </SubmitButton>
            )}
          </span>
        ),
      },
      {
        header: "Email",
        id: "email",
        render: (row) => {
          const kirim = row.pengiriman_email;
          if (!row.kanal_email || !kirim) {
            return <span className={styles.cellMeta}>Tanpa email</span>;
          }
          return (
            <span className={`${styles.cellStack} ${styles.cellEmail}`}>
              <StatusBadge status={kirim.status} statuses={STATUS_EMAIL} />
              <span className={styles.cellMeta}>
                {kirim.status === "gagal" || kirim.status === "perlu_pemeriksaan"
                  ? (kirim.alasan ?? "Alasan tidak tersedia.")
                  : `${kirim.alamat} · ${kirim.percobaan} percobaan`}
              </span>
            </span>
          );
        },
      },
    ],
    [router, sedangProses],
  );

  const { onPageChange, page, totalItems, visibleRows } = useTableState(rows);


  return (
    <div className={styles.list}>
      {pesan ? (
        <Notice className={styles.messageError} tone="danger">
          {pesan}
        </Notice>
      ) : null}

      <DataTable
        caption="Daftar notifikasi"
        columns={columns}
        emptyMessage="Belum ada notifikasi. Kejadian yang menunggu tindakan Anda akan muncul di sini."
        errorMessage={errorMessage}
        onPageChange={onPageChange}
        onRetry={() => router.refresh()}
        onSortChange={() => undefined}
        page={page}
        rowKey={(row) => row.id}
        rows={visibleRows}
        sort={null}
        totalItems={totalItems}
      />
    </div>
  );
}
