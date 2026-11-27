import { RekapScreen } from "@/modules/penggajian/rekap/rekap-screen";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string; pesan?: string }> };

export default async function RekapPage({ searchParams }: Props) {
  const { periode, pesan } = await searchParams;
  return <RekapScreen periodeId={periode} pesan={pesan} />;
}
