import { BukaUlangScreen } from "@/modules/penggajian/periode/buka-ulang-screen";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string }> };

export default async function BukaUlangPage({ searchParams }: Props) {
  const { periode } = await searchParams;
  return <BukaUlangScreen periodeId={periode} />;
}
