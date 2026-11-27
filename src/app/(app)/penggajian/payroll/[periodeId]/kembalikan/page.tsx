import { KembalikanPayrollScreen } from "@/modules/penggajian/payroll/kembalikan-screen";

export const instant = false;

type Props = { params: Promise<{ periodeId: string }> };

export default async function KembalikanPayrollPage({ params }: Props) {
  const { periodeId } = await params;
  return <KembalikanPayrollScreen periodeId={periodeId} />;
}
