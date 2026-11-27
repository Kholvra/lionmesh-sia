import { LemburListScreen } from "@/modules/penggajian/presensi/lembur-screens";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string }> };

export default async function LemburPage({ searchParams }: Props) {
  const { periode } = await searchParams;
  return <LemburListScreen periodeId={periode} />;
}
