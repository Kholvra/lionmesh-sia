"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, ROWS_PER_PAGE, StatusBadge } from "@/components/ui";
import type { DataTableColumn, TableSort } from "@/components/ui";
import { samarkanRekening } from "@/modules/penggajian/karyawan/format";
import type { BarisKaryawan } from "@/modules/penggajian/karyawan/queries";
import { STATUS_KARYAWAN } from "@/modules/penggajian/karyawan/status";
import ui from "@/modules/penggajian/shell/ui.module.css";

type FilterStatus = "AKTIF" | "NONAKTIF" | "SEMUA";

type KaryawanTableProps = {
  rows: readonly BarisKaryawan[];
  tampilIdentitas: boolean;
  tampilRekening: boolean;
};

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
        <Link className={`${ui.button} ${ui.small}`} href={`/penggajian/karyawan/${row.id}`}>
          Lihat
        </Link>
      ),
    },
  );
  return columns;
}

function sortRows(rows: BarisKaryawan[], columns: DataTableColumn<BarisKaryawan>[], sort: TableSort | null) {
  const column = sort && columns.find((candidate) => candidate.id === sort.columnId);
  if (!sort || !column?.sortValue) return rows;
  const value = column.sortValue;
  const factor = sort.direction === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => String(value(a)).localeCompare(String(value(b)), "id") * factor);
}

export function KaryawanTable({ rows, tampilIdentitas, tampilRekening }: KaryawanTableProps) {
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<FilterStatus>("AKTIF");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSort | null>(null);
  const columns = useMemo(
    () => buildColumns(tampilIdentitas, tampilRekening),
    [tampilIdentitas, tampilRekening],
  );

  const filtered = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (status === "SEMUA" || row.status === status) &&
        (!kata || row.nama.toLowerCase().includes(kata) || row.nik?.includes(kata)),
    );
  }, [cari, rows, status]);
  const sorted = useMemo(() => sortRows(filtered, columns, sort), [columns, filtered, sort]);
  const pageRows = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <>
      <div className={ui.toolbar}>
        <label className={ui.toolbarField}>
          Cari
          <input
            className={ui.select}
            onChange={(event) => {
              setCari(event.target.value);
              setPage(1);
            }}
            placeholder={tampilIdentitas ? "Nama atau NIK" : "Nama"}
            type="search"
            value={cari}
          />
        </label>
        <label className={ui.toolbarField}>
          Status
          <select
            className={ui.select}
            onChange={(event) => {
              setStatus(event.target.value as FilterStatus);
              setPage(1);
            }}
            value={status}
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
        onPageChange={setPage}
        onSortChange={setSort}
        page={page}
        rowKey={(row) => row.id}
        rows={pageRows}
        sort={sort}
        totalItems={sorted.length}
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
