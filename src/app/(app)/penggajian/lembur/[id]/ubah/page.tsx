import { PerbaikiLemburScreen } from "@/modules/penggajian/rekap/perbaiki-lembur-screen";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function PerbaikiLemburPage({ params }: Props) {
  const { id } = await params;
  return <PerbaikiLemburScreen id={id} />;
}
