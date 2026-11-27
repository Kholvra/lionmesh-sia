"use client";

import Link from "next/link";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableColumn } from "@/components/ui/data-table.types";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTableState } from "@/components/ui/use-table-state";
import { pathKaryawanDetail } from "@/modules/penggajian/karyawan/constants";
import { samarkanRekening } from "@/modules/penggajian/karyawan/format";
import type { BarisKaryawan } from "@/modules/penggajian/karyawan/queries";
import { STATUS_KARYAWAN } from "@/modules/penggajian/karyawan/status";
import { ui } from "@/modules/penggajian/ui/kelas";

type FilterStatus = "AKTIF" | "NONAKTIF" | "SEMUA";

type KaryawanTableProps = {
  rows: readonly BarisKaryawan[];
  tampilIdentitas: boolean;
  tampilRekening: boolean;
};

function getFilterValues(row: BarisKaryawan): readonly string[] {
  return [row.nama, row.nik ?? ""];
}

function getFilterValue(row: BarisKaryawan): string {
  return row.status;
}

function buildColumns(
  tampilIdentitas: boolean,
  tampilRekening: boolean,
): DataTableColumn<BarisKaryawan>[] {
  const columns: DataTableColumn<BarisKaryawan>[] = [];
  if (tampilIdentitas) {
    columns.push({
      id: "nik",
      header: "NIK",
      render: (row) => <span className={ui.numeric}>{row.nik}</span>,
      sortValue: (row) => row.nik ?? "",
    });
  }
  columns.push({ id: "nama", header: "Nama", render: (row) => row.nama, sortValue: (row) => row.nama });
  if (tampilIdentitas) {
    columns.push(
      { id: "jabatan", header: "Jabatan", render: (row) => row.jabatan },
      {
        id: "departemen",
        header: "Departemen",
        render: (row) => row.departemen,
        sortValue: (row) => row.departemen ?? "",
      },
      { id: "tipe", header: "Tipe", render: (row) => row.tipe },
    );
  }
  if (tampilRekening) {
    columns.push({
      id: "rekening",
      header: "Rekening",
      render: (row) =>
        row.rekening ? `${row.rekening.namaBank} · ${samarkanRekening(row.rekening.nomor)}` : "—",
    });
  }
  columns.push(
    {
      id: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} statuses={STATUS_KARYAWAN} />,
    },
    {
      id: "aksi",
      header: "Aksi",
      align: "right",
      render: (row) => (
        <Link className={ui.buttonSmall} href={pathKaryawanDetail(row.id)}>
          Lihat
        </Link>
      ),
    },
  );
  return columns;
}

export function KaryawanTable({ rows, tampilIdentitas, tampilRekening }: KaryawanTableProps) {
  const columns = useMemo(
    () => buildColumns(tampilIdentitas, tampilRekening),
    [tampilIdentitas, tampilRekening],
  );
  const table = useTableState<BarisKaryawan>(rows, {
    columns,
    getFilterValue,
    getFilterValues,
    initialFilterValue: "AKTIF",
    initialSort: null,
    matchAllFilterValue: "SEMUA",
    resetPageOnSort: false,
  });

  return (
    <>
      <div className={ui.toolbar}>
        <label className={ui.toolbarField}>
          Cari
          <input
            className={ui.select}
            onChange={(event) => {
              table.setFilterText(event.target.value);
            }}
            placeholder={tampilIdentitas ? "Nama atau NIK" : "Nama"}
            type="search"
            value={table.filterText}
          />
        </label>
        <label className={ui.toolbarField}>
          Status
          <select
            className={ui.select}
            onChange={(event) => {
              table.setFilterValue(event.target.value as FilterStatus);
            }}
            value={table.filterValue}
          >
            <option value="AKTIF">Aktif</option>
            <option value="NONAKTIF">Nonaktif</option>
            <option value="SEMUA">Semua</option>
          </select>
        </label>
      </div>
      <DataTable
        caption="Direktori karyawan"
        columns={columns}
        emptyMessage="Tidak ada karyawan yang cocok dengan pencarian atau status ini."
        onPageChange={table.setPage}
        onSortChange={table.setSort}
        page={table.page}
        rowKey={(row) => row.id}
        rows={table.visibleRows}
        sort={table.sort}
        totalItems={table.totalItems}
      />
    </>
  );
}

/** Suspense fallback: five skeleton rows instead of a spinner. */
export function KaryawanTableLoading() {
  return (
    <DataTable
      caption="Direktori karyawan"
      columns={buildColumns(true, false)}
      loading
      onPageChange={() => undefined}
      onSortChange={() => undefined}
      page={1}
      rowKey={(row) => row.id}
      rows={[]}
      sort={null}
      totalItems={0}
    />
  );
}
