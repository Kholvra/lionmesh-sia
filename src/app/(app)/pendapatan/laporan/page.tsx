import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function PendapatanLaporanIndexPage() {
  await connection();
  redirect("/pendapatan/laporan/penjualan");
}
