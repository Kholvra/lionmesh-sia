import { KaryawanStatusScreen } from "@/modules/penggajian/karyawan/form-screens";

export const instant = false;

export default async function StatusKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KaryawanStatusScreen id={id} />;
}
