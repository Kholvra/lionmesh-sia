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
import type { PurchaseOrderView } from "@/core/pengadaan";
import { formatRupiah } from "@/lib/format/number";
import { formatTanggalSingkat, STATUS_PO } from "../format";
import common from "../../permintaan/permintaan.module.css";
import { PATH_PO } from "../constants";

type Props = {
  rows: readonly PurchaseOrderView[];
  selectedId?: string;
  errorMessage?: string;
};

export function PoTable({ errorMessage, rows, selectedId }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const columns = useMemo<DataTableColumn<PurchaseOrderView>[]>(
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
            href={`${PATH_PO}?po=${row.dokumenId}`}
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
        id: "pemasok",
        header: "Pemasok",
        sortValue: (row) => row.pemasokNama,
        render: (row) => row.pemasokNama,
      },
      {
        id: "total",
        header: "Total",
        align: "right",
        sortValue: (row) => Number(row.nominal ?? 0),
        render: (row) => (row.nominal === null ? "—" : formatRupiah(row.nominal)),
      },
      {
        id: "status",
        header: "Status",
        sortValue: (row) => row.status,
        render: (row) => (
          <span className={common.statusCell}>
            <StatusBadge status={row.status} statuses={STATUS_PO} />
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
      caption="Daftar purchase order"
      columns={columns}
      emptyMessage="Belum ada purchase order."
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
