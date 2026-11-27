import { SlipPenggantiScreen } from "@/modules/penggajian/slip/slip-screens";

export const instant = false;

type Props = { params: Promise<{ periodeId: string; karyawanId: string }> };

export default async function SlipPenggantiPage({ params }: Props) {
  const { periodeId, karyawanId } = await params;
  return <SlipPenggantiScreen karyawanId={karyawanId} periodeId={periodeId} />;
}
