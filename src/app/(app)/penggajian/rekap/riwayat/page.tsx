import { RiwayatRekapScreen } from "@/modules/penggajian/rekap/riwayat-screen";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string }> };

export default async function RiwayatRekapPage({ searchParams }: Props) {
  const { periode } = await searchParams;
  return <RiwayatRekapScreen periodeId={periode} />;
}
