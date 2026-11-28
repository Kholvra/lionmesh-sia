import { LemburDetailScreen } from "@/modules/penggajian/presensi/lembur-screens";

export const instant = false;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ pesan?: string }> };

export default async function LemburDetailPage({ params, searchParams }: Props) {
  const [{ id }, { pesan }] = await Promise.all([params, searchParams]);
  return <LemburDetailScreen id={id} pesan={pesan} />;
}
