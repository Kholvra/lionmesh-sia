import { PeriodeScreen } from "@/modules/penggajian/periode/periode-screen";

export const instant = false;

type Props = { searchParams: Promise<{ pesan?: string }> };

export default async function PeriodePage({ searchParams }: Props) {
  const { pesan } = await searchParams;
  return <PeriodeScreen pesan={pesan} />;
}
