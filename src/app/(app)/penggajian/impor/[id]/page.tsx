import { HasilImporScreen } from "@/modules/penggajian/impor/impor-screens";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function HasilImporPage({ params }: Props) {
  const { id } = await params;
  return <HasilImporScreen id={id} />;
}
