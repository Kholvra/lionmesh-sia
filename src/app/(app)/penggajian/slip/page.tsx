import { SlipListScreen } from "@/modules/penggajian/slip/slip-screens";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string }> };

export default async function SlipPage({ searchParams }: Props) {
  const { periode } = await searchParams;
  return <SlipListScreen periodeId={periode} />;
}
