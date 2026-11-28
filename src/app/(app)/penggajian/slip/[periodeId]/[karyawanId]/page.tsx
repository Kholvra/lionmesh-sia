import { SlipDetailScreen } from "@/modules/penggajian/slip/slip-screens";

export const instant = false;

type Props = { params: Promise<{ periodeId: string; karyawanId: string }>; searchParams: Promise<{ pesan?: string }> };

export default async function SlipDetailPage({ params, searchParams }: Props) {
  const [{ periodeId, karyawanId }, { pesan }] = await Promise.all([params, searchParams]);
  return <SlipDetailScreen karyawanId={karyawanId} pesan={pesan} periodeId={periodeId} />;
}
