import { RekapKaryawanScreen } from "@/modules/penggajian/rekap/detail-screens";

export const instant = false;

type Props = { params: Promise<{ karyawanId: string }>; searchParams: Promise<{ periode?: string }> };

export default async function RekapKaryawanPage({ params, searchParams }: Props) {
  const [{ karyawanId }, { periode }] = await Promise.all([params, searchParams]);
  return <RekapKaryawanScreen karyawanId={karyawanId} periodeId={periode} />;
}
