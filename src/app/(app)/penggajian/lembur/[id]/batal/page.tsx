import { BatalLemburScreen } from "@/modules/penggajian/presensi/lembur-screens";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function BatalLemburPage({ params }: Props) {
  const { id } = await params;
  return <BatalLemburScreen id={id} />;
}
