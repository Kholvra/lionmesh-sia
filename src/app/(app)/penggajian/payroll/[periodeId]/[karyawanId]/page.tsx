import { RincianGajiScreen } from "@/modules/penggajian/payroll/rincian-screen";

export const instant = false;

type Props = { params: Promise<{ periodeId: string; karyawanId: string }>; searchParams: Promise<{ pesan?: string }> };

export default async function RincianGajiPage({ params, searchParams }: Props) {
  const [{ periodeId, karyawanId }, { pesan }] = await Promise.all([params, searchParams]);
  return <RincianGajiScreen karyawanId={karyawanId} periodeId={periodeId} pesan={pesan} />;
}
