import { PembayaranScreen } from "@/modules/penggajian/pembayaran/pembayaran-screen";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string; pesan?: string }> };

export default async function PembayaranPage({ searchParams }: Props) {
  const { periode, pesan } = await searchParams;
  return <PembayaranScreen periodeId={periode} pesan={pesan} />;
}
