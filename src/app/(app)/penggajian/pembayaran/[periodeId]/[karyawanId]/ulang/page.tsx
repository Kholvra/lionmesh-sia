import { UlangTransferScreen } from "@/modules/penggajian/pembayaran/ulang-screen";

export const instant = false;

type Props = { params: Promise<{ periodeId: string; karyawanId: string }> };

export default async function UlangTransferPage({ params }: Props) {
  const { periodeId, karyawanId } = await params;
  return <UlangTransferScreen karyawanId={karyawanId} periodeId={periodeId} />;
}
