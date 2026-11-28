import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function PendapatanRootPage() {
  await connection();
  redirect("/pendapatan/pelanggan");
}
