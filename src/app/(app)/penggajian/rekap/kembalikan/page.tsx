import { KembalikanRekapScreen } from "@/modules/penggajian/rekap/detail-screens";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string; departemen?: string }> };

export default async function KembalikanRekapPage({ searchParams }: Props) {
  const { periode, departemen } = await searchParams;
  return <KembalikanRekapScreen departemenId={departemen} periodeId={periode} />;
}
