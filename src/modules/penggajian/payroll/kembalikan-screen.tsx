import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { returnPayroll } from "@/modules/penggajian/payroll/persetujuan-actions";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { TidakBerwenang } from "@/modules/penggajian/shared/states";

async function Konten({ periodeId }: { periodeId: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "Accounting" && sesi.peran !== "Direksi") {
    return <TidakBerwenang pesan="Draft dikembalikan oleh Accounting atau Direksi." />;
  }
  return (
    <FormAksi
      aksi={returnPayroll}
      batalHref={`/penggajian/payroll?periode=${periodeId}`}
      isian={[{ name: "alasan", label: "Alasan pengembalian", wajib: true, lebar: true }]}
      judul="Kembalikan draft payroll"
      kirimLabel="Kembalikan ke HR"
      tersembunyi={{ periodeId }}
    />
  );
}

export function KembalikanPayrollScreen({ periodeId }: { periodeId: string }) {
  return (
    <>
      <PageHeader
        back={{ href: `/penggajian/payroll?periode=${periodeId}`, label: "Draft payroll" }}
        description="Alasan wajib dan tampil bagi HR. Draft menjadi Revisi sampai HR menghitung ulang."
        item="GJ-005 Memeriksa dan menyetujui payroll"
        title="Kembalikan draft payroll"
      />
      <Suspense fallback={null}>
        <Konten periodeId={periodeId} />
      </Suspense>
    </>
  );
}
