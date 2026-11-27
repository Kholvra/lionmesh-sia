import { PayrollScreen } from "@/modules/penggajian/payroll/payroll-screen";

export const instant = false;

type Props = { searchParams: Promise<{ periode?: string; pesan?: string }> };

export default async function PayrollPage({ searchParams }: Props) {
  const { periode, pesan } = await searchParams;
  return <PayrollScreen periodeId={periode} pesan={pesan} />;
}
