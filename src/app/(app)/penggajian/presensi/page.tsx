import { PresensiScreen } from "@/modules/penggajian/presensi/presensi-screen";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string; pesan?: string }> };

export default async function PresensiPage({ searchParams }: Props) {
  const { periode, pesan } = await searchParams;
  return <PresensiScreen periodeId={periode} pesan={pesan} />;
}
