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
import type { PermintaanPembelianView } from "@/core/pengadaan";
import { formatTanggalSingkat, STATUS_PERMINTAAN } from "../../permintaan/format";
import common from "../../permintaan/permintaan.module.css";
import { PATH_PEMILIHAN } from "../constants";

type Props = {
  rows: readonly PermintaanPembelianView[];
  selectedId?: string;
  errorMessage?: string;
};

export function PemilihanTable({ errorMessage, rows, selectedId }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const columns = useMemo<DataTableColumn<PermintaanPembelianView>[]>(
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
            href={`${PATH_PEMILIHAN}?permintaan=${row.dokumenId}`}
          >
            {row.nomor}
          </Link>
        ),
      },
      {
        id: "butuh",
        header: "Butuh",
        sortValue: (row) => row.tanggalButuh,
        render: (row) => formatTanggalSingkat(row.tanggalButuh),
      },
      {
        id: "pemohon",
        header: "Pemohon",
        sortValue: (row) => row.pemohonNama,
        render: (row) => row.pemohonNama,
      },
      {
        id: "status",
        header: "Status",
        sortValue: (row) => row.status,
        render: (row) => (
          <span className={common.statusCell}>
            <StatusBadge status={row.status} statuses={STATUS_PERMINTAAN} />
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
      caption="Permintaan yang siap dipilih pemasoknya"
      columns={columns}
      emptyMessage="Belum ada permintaan yang disetujui."
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
