"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DataTable,
  ROWS_PER_PAGE,
  StatusBadge,
  type DataTableColumn,
} from "@/components/ui";
import type { PenerimaanView } from "@/core/pengadaan";
import { formatTanggalSingkat, STATUS_PENERIMAAN } from "../format";
import common from "../../permintaan/permintaan.module.css";
import { PATH_PENERIMAAN } from "../constants";

type Props = {
  rows: readonly PenerimaanView[];
  selectedId?: string;
  errorMessage?: string;
};

export function PenerimaanTable({ errorMessage, rows, selectedId }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const columns = useMemo<DataTableColumn<PenerimaanView>[]>(
    () => [
      {
        id: "nomor",
        header: "Nomor",
        sortValue: (row) => row.nomor,
        render: (row) => (
          <Link
            aria-current={selectedId === row.dokumenId ? "true" : undefined}
            className={`${common.tableLink} ${
              selectedId === row.dokumenId ? common.tableLinkActive : ""
            }`}
            href={`${PATH_PENERIMAAN}?penerimaan=${row.dokumenId}`}
          >
            {row.nomor}
          </Link>
        ),
      },
      {
        id: "tanggal",
        header: "Tanggal",
        sortValue: (row) => row.tanggal,
        render: (row) => formatTanggalSingkat(row.tanggal),
      },
      {
        id: "po",
        header: "PO",
        sortValue: (row) => row.poNomor ?? "",
        render: (row) => row.poNomor ?? "—",
      },
      {
        id: "jenis",
        header: "Jenis",
        sortValue: (row) => row.jenis,
        render: (row) => (row.jenis === "PENUH" ? "Penuh" : "Sebagian"),
      },
      {
        id: "status",
        header: "Status",
        sortValue: (row) => row.status,
        render: (row) => (
          <span className={common.statusCell}>
            <StatusBadge status={row.status} statuses={STATUS_PENERIMAAN} />
          </span>
        ),
      },
    ],
    [selectedId],
  );

  const visible = useMemo(
    () => rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [page, rows],
  );

  return (
    <DataTable
      caption="Daftar penerimaan barang"
      columns={columns}
      emptyMessage="Belum ada penerimaan barang."
      errorMessage={errorMessage}
      onPageChange={setPage}
      onRetry={() => router.refresh()}
      onSortChange={() => setPage(1)}
      page={page}
      rowKey={(row) => row.dokumenId}
      rows={visible}
      sort={null}
      totalItems={rows.length}
    />
  );
}
