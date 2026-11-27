"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ProduksiSubnav } from "../components/produksi-subnav";

interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  siklus: string;
  statusLabel: string;
  statusVariant: "amber" | "indigo";
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
    statusVariant: "amber",
    actionLabel: "Lihat",
    href: "/produksi/perintah-produksi?spk=SPK-2611-013",
  },
  {
    id: "task-2",
    title: "PR-2611-010 · wire rod 6 mm",
    subtitle: "1,1 ton",
    siklus: "Produksi",
    statusLabel: "Diperiksa Purchasing",
    statusVariant: "indigo",
    actionLabel: "Lihat",
    href: "/produksi/pembelian-bahan?pr=PR-2611-010",
  },
  {
    id: "task-3",
    title: "SPK-2611-012 · Wiremesh M8",
    subtitle: "Selesai diproduksi · 400 lembar",
    siklus: "Produksi",
    statusLabel: "Hasil belum dicatat",
    statusVariant: "amber",
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

      {/* Breadcrumb & Header */}
      <nav className="text-xs font-medium text-[#526174]">
        <span>Beranda</span>
        <span className="mx-1.5">·</span>
        <span>Produksi</span>
      </nav>

      <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-tight text-[#172335]">
        Beranda
      </h1>
      <p className="mt-1 text-[13px] text-[#526174]">
        21 November 2026 · Siklus produksi
      </p>

      {/* 3 Summary Metric Cards */}
      <div className="mt-6 grid grid-cols-1 gap-[16px] md:grid-cols-3">
        {/* Card 1 */}
        <div className="shadow-card flex min-h-[108px] flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] leading-none font-normal text-[#526174]">
            SPK berjalan
          </p>
          <p className="mt-1 text-[26px] leading-none font-semibold text-[#172335]">
            2
          </p>
        </div>

        {/* Card 2 */}
        <div className="shadow-card flex min-h-[108px] flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] leading-none font-normal text-[#526174]">
            Permintaan bahan
          </p>
          <p className="mt-1 text-[26px] leading-none font-semibold text-[#172335]">
            1
          </p>
        </div>

        {/* Card 3 */}
        <div className="shadow-card flex min-h-[108px] flex-col justify-start gap-[6px] rounded-[10px] border border-transparent bg-white px-[20px] py-[16px] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[13px] leading-none font-normal text-[#526174]">
            Menunggu QC
          </p>
          <p className="mt-1 text-[26px] leading-none font-semibold text-[#172335]">
            1
          </p>
        </div>
      </div>

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
                    <span
                      className={`inline-flex items-center rounded-[6px] px-2 py-0.5 text-[11px] font-medium ${
                        task.statusVariant === "amber"
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : "bg-[#E0E7FF] text-[#3730A3]"
                      }`}
                    >
                      {task.statusLabel}
                    </span>
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
        <Link
          href="/produksi/bom-produk"
          className="group inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
        >
          <span>Kelola BOM Produk</span>
          <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/produksi/perintah-produksi"
          className="group inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
        >
          <span>Perintah Produksi (SPK)</span>
          <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/produksi/pembelian-bahan"
          className="group inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
        >
          <span>Pembelian Bahan</span>
          <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/produksi/hasil-produksi"
          className="group inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#172335] shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:bg-slate-50 active:scale-[0.98]"
        >
          <span>Catat Hasil Produksi</span>
          <ArrowIcon className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Prototype Footnote */}
      <p className="mt-6 text-[12px] text-[#526174]">
        Data ilustrasi untuk prototipe
      </p>
    </div>
  );
}
