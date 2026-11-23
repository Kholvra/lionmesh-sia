"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  StatusBadge,
  type DataTableColumn,
  type StatusOption,
} from "@/components/ui";
import type { Notifikasi } from "@/core/notifikasi";
import { formatWaktu } from "@/lib/format/date";

import { tandaiDibacaAction } from "../actions";
import styles from "../notifikasi.module.css";

const STATUS_EMAIL: readonly StatusOption[] = [
  { label: "Menunggu", tone: "warning", value: "menunggu" },
  { label: "Terkirim", tone: "success", value: "terkirim" },
  { label: "Gagal", tone: "danger", value: "gagal" },
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
  const [page, setPage] = useState(1);
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
            <span className={styles.cellMeta}>{formatWaktu(row.created_at)}</span>
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
              <button
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
              >
                Tandai dibaca
              </button>
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
                {kirim.status === "gagal"
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

  const visibleRows = useMemo(
    () => rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, rows],
  );

  return (
    <div className={styles.list}>
      {pesan ? (
        <p className={styles.messageError} role="alert">
          {pesan}
        </p>
      ) : null}

      <DataTable
        caption="Daftar notifikasi"
        columns={columns}
        emptyMessage="Belum ada notifikasi. Kejadian yang menunggu tindakan Anda akan muncul di sini."
        errorMessage={errorMessage}
        onPageChange={setPage}
        onRetry={() => router.refresh()}
        onSortChange={() => undefined}
        page={page}
        rowKey={(row) => row.id}
        rows={visibleRows}
        sort={null}
        totalItems={rows.length}
      />
    </div>
  );
}
