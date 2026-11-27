import { PengaturanImporScreen } from "@/modules/penggajian/impor/impor-screens";

export const instant = false;

type Props = { searchParams: Promise<{ pesan?: string }> };

export default async function PengaturanImporPage({ searchParams }: Props) {
  const { pesan } = await searchParams;
  return <PengaturanImporScreen pesan={pesan} />;
}
