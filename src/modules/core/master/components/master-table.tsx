"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTable, StatusBadge, type DataTableColumn } from "@/components/ui";
import { useTableState } from "@/components/ui/use-table-state";

import { STATUS_MASTER, statusMaster } from "../format";
import styles from "../master.module.css";

export type MasterBaris = {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
  [kolom: string]: string | number | boolean;
};

export type MasterKolom = {
  id: string;
  header: string;
  align?: "left" | "right";
};

type MasterTableProps = {
  caption: string;
  hrefBase: string;
  rows: readonly MasterBaris[];
  kolom: readonly MasterKolom[];
  selectedId?: string;
  emptyMessage: string;
  errorMessage?: string;
};

export function MasterTable({
  caption,
  emptyMessage,
  errorMessage,
  hrefBase,
  kolom,
  rows,
  selectedId,
}: MasterTableProps) {
  const router = useRouter();
  const columns = useMemo<DataTableColumn<MasterBaris>[]>(
    () => [
      {
        id: "kode",
        header: "Kode",
        sortValue: (row) => row.kode,
        render: (row) => (
          <Link
            aria-current={selectedId === row.id ? "true" : undefined}
            className={`${styles.tableLink} ${
              selectedId === row.id ? styles.tableLinkActive : ""
            }`}
            href={`${hrefBase}?id=${row.id}`}
          >
            {row.kode}
          </Link>
        ),
      },
      {
        id: "nama",
        header: "Nama",
        sortValue: (row) => row.nama,
        render: (row) => row.nama,
      },
      ...kolom.map<DataTableColumn<MasterBaris>>((item) => ({
        id: item.id,
        header: item.header,
        align: item.align,
        sortValue: (row) => String(row[item.id] ?? ""),
        render: (row) => (
          <span className={item.align === "right" ? styles.numericCell : undefined}>
            {String(row[item.id] ?? "—")}
          </span>
        ),
      })),
      {
        id: "status",
        header: "Status",
        sortValue: (row) => statusMaster(row.aktif),
        render: (row) => (
          <span className={styles.statusCell}>
            <StatusBadge
              status={statusMaster(row.aktif)}
              statuses={STATUS_MASTER}
            />
          </span>
        ),
      },
    ],
    [hrefBase, kolom, selectedId],
  );

  const {
    onPageChange,
    onSortChange,
    page,
    sort,
    totalItems,
    visibleRows,
  } = useTableState(rows, {
    columns,
    emptyMessage,
    initialSort: { columnId: "kode", direction: "ascending" },
  });


  return (
    <DataTable
      caption={caption}
      columns={columns}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      onPageChange={onPageChange}
      onRetry={() => router.refresh()}
      onSortChange={onSortChange}
      page={page}
      rowKey={(row) => row.id}
      rows={visibleRows}
      sort={sort}
      totalItems={totalItems}
    />
  );
}
