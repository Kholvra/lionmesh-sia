"use client";

import Link from "next/link";
import { MetricCardGrid } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { STATUS_TUGAS_PRODUKSI, StatusBadge } from "@/components/ui/status-badge";
import { TableActionLink } from "@/components/ui/table-action-link";
import { ProduksiSubnav } from "../components/produksi-subnav";

interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  siklus: string;
  statusLabel: string;
  actionLabel: string;
  href: string;
}

interface ActivityItem {
  time: string;
  description: string;
}

const TASKS_NEED_ACTION: TaskItem[] = [
  {
    id: "task-1",
    title: "SPK-2611-013 · dari SO-2611-015",
    subtitle: "Wiremesh M6 · 120 lembar",
    siklus: "Produksi",
    statusLabel: "Menunggu cek bahan Gudang",
    actionLabel: "Lihat",
    href: "/produksi/perintah-produksi?spk=SPK-2611-013",
  },
  {
    id: "task-2",
    title: "PR-2611-010 · wire rod 6 mm",
    subtitle: "1,1 ton",
    siklus: "Produksi",
    statusLabel: "Diperiksa Purchasing",
    actionLabel: "Lihat",
    href: "/produksi/pembelian-bahan?pr=PR-2611-010",
  },
  {
    id: "task-3",
    title: "SPK-2611-012 · Wiremesh M8",
    subtitle: "Selesai diproduksi · 400 lembar",
    siklus: "Produksi",
    statusLabel: "Hasil belum dicatat",
    actionLabel: "Catat hasil",
    href: "/produksi/hasil-produksi?spk=SPK-2611-012",
  },
];

const RECENT_ACTIVITIES: ActivityItem[] = [
  { time: "09.30", description: "Mesin las 2 selesai SPK-2611-012" },
  { time: "08.00", description: "SPK-2611-013 dibuat" },
  { time: "Kemarin", description: "SPK-2611-011 dikirim ke QC" },
];

export function ProduksiHubScreen() {
  return (
    <div className="w-full text-[#172335] animate-fade-in">
      <ProduksiSubnav />

      <PageHeader
        breadcrumb={["Beranda", "Produksi"]}
        description="21 November 2026 · Siklus produksi"
        separator="·"
        title="Beranda"
        variant="cycle"
      />

      <MetricCardGrid
        className="mt-6"
        columns={3}
        items={[
          { label: "SPK berjalan", value: 2, hover: "lift-eased", minHeight: true },
          { label: "Permintaan bahan", value: 1, hover: "lift-eased", minHeight: true },
          { label: "Menunggu QC", value: 1, hover: "lift-eased", minHeight: true },
        ]}
      />

      {/* Content Section: 2 Columns */}
      <div className="mt-6 grid grid-cols-1 gap-[24px] lg:grid-cols-12">
        {/* Left Column (8 cols): Perlu Tindakan Anda */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#172335]">
              Perlu tindakan Anda
            </h2>
            <span className="text-[13px] text-[#526174]">3 tugas</span>
          </div>

          <div className="mt-3.5 space-y-3">
            {TASKS_NEED_ACTION.map((task) => (
              <div
                key={task.id}
                className="shadow-card flex items-center justify-between rounded-[10px] border border-transparent bg-white px-5 py-4 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200"
              >
                <div>
                  <h3 className="text-[14px] font-semibold text-[#172335]">
                    {task.title}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#526174]">
                    {task.subtitle}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-[#526174]">
                      {task.siklus}
                    </span>
                    <span className="text-[#526174]">·</span>
                    <StatusBadge
                      status={task.statusLabel}
                      statuses={STATUS_TUGAS_PRODUKSI}
                      variant="compact"
                    />
                  </div>
                </div>

                <div>
                  <Link
                    href={task.href}
                    className="inline-flex h-[32px] items-center rounded-[6px] bg-[#E88A06] px-3.5 text-[12px] font-semibold text-white shadow-2xs transition-all duration-150 ease-out hover:bg-[#D17B05] active:scale-[0.98]"
                  >
                    {task.actionLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (4 cols): Aktivitas Terbaru */}
        <div className="lg:col-span-4">
          <h2 className="text-[16px] font-bold text-[#172335]">
            Aktivitas terbaru
          </h2>

          <div className="shadow-card mt-3.5 rounded-[10px] border border-transparent bg-white p-5 transition-all duration-150 ease-out hover:shadow-md">
            <div className="relative pl-6">
              {/* Vertical connector line */}
              <div className="absolute top-2.5 bottom-2.5 left-[7px] w-[2px] bg-slate-200" />

              <div className="space-y-6">
                {RECENT_ACTIVITIES.map((act, index) => (
                  <div key={index} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[24px] top-1.5 h-[16px] w-[16px] rounded-full border-2 border-white bg-slate-400 shadow-2xs transition-transform duration-150 hover:scale-110" />
                    <div>
                      <p className="text-[11px] font-medium text-[#526174]">
                        {act.time}
                      </p>
                      <p className="mt-0.5 text-[13px] font-medium text-[#172335]">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Row */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <TableActionLink
          className="gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
          href="/produksi/bom-produk"
        >
          Kelola BOM Produk
        </TableActionLink>
        <TableActionLink
          className="gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
          href="/produksi/perintah-produksi"
        >
          Perintah Produksi (SPK)
        </TableActionLink>
        <TableActionLink
          className="gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
          href="/produksi/pembelian-bahan"
        >
          Pembelian Bahan
        </TableActionLink>
        <TableActionLink
          className="gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
          href="/produksi/hasil-produksi"
        >
          Catat Hasil Produksi
        </TableActionLink>
      </div>

      {/* Prototype Footnote */}
      <p className="mt-6 text-[12px] text-[#526174]">
        Data ilustrasi untuk prototipe
      </p>
    </div>
  );
}
