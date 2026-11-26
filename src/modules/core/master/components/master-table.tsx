"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  StatusBadge,
  type DataTableColumn,
  type TableSort,
} from "@/components/ui";

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

function sortRows(
  rows: readonly MasterBaris[],
  sort: TableSort | null,
): MasterBaris[] {
  if (!sort) return [...rows];

  const factor = sort.direction === "ascending" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = a[sort.columnId] ?? "";
    const right = b[sort.columnId] ?? "";
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }
    return String(left).localeCompare(String(right), "id") * factor;
  });
}

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
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSort | null>({
    columnId: "kode",
    direction: "ascending",
  });

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

  const sortedRows = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const visibleRows = useMemo(
    () => sortedRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, sortedRows],
  );

  return (
    <DataTable
      caption={caption}
      columns={columns}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      onPageChange={setPage}
      onRetry={() => router.refresh()}
      onSortChange={(nextSort) => {
        setSort(nextSort);
        setPage(1);
      }}
      page={page}
      rowKey={(row) => row.id}
      rows={visibleRows}
      sort={sort}
      totalItems={sortedRows.length}
    />
  );
}
