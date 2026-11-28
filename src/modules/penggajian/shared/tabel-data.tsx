"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { DataTable, ROWS_PER_PAGE } from "@/components/ui";
import type { DataTableColumn, TableSort } from "@/components/ui";

export type KolomTabel = { id: string; header: string; align?: "left" | "right"; urut?: boolean };

/** Cells are rendered on the server, so render functions never cross to the client. */
export type BarisTabel = {
  key: string;
  cells: Record<string, ReactNode>;
  nilaiUrut?: Record<string, string | number>;
};

type TabelDataProps = {
  caption: string;
  kolom: readonly KolomTabel[];
  baris: readonly BarisTabel[];
  pesanKosong: string;
};

export function TabelData({ baris, caption, kolom, pesanKosong }: TabelDataProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TableSort | null>(null);
  const columns = useMemo<DataTableColumn<BarisTabel>[]>(
    () =>
      kolom.map((k) => ({
        id: k.id,
        header: k.header,
        align: k.align,
        render: (row) => row.cells[k.id],
        sortValue: k.urut ? (row) => row.nilaiUrut?.[k.id] ?? "" : undefined,
      })),
    [kolom],
  );
  const sorted = useMemo(() => {
    if (!sort) return baris;
    const factor = sort.direction === "ascending" ? 1 : -1;
    return [...baris].sort((a, b) => {
      const x = a.nilaiUrut?.[sort.columnId] ?? "";
      const y = b.nilaiUrut?.[sort.columnId] ?? "";
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id")) * factor;
    });
  }, [baris, sort]);

  return (
    <DataTable
      caption={caption}
      columns={columns}
      emptyMessage={pesanKosong}
      onPageChange={setPage}
      onSortChange={setSort}
      page={page}
      rowKey={(row) => row.key}
      rows={sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)}
      sort={sort}
      totalItems={sorted.length}
    />
  );
}

export function TabelMemuat({ caption, kolom }: { caption: string; kolom: readonly KolomTabel[] }) {
  return (
    <DataTable
      caption={caption}
      columns={kolom.map((k) => ({ id: k.id, header: k.header, render: () => null }))}
      loading
      onPageChange={() => undefined}
      onSortChange={() => undefined}
      page={1}
      rowKey={() => ""}
      rows={[]}
      sort={null}
      totalItems={0}
    />
  );
}
