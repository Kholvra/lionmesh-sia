import { MasterLoading } from "@/modules/core/master/components/master-loading";

export default function Loading() {
  return (
    <MasterLoading
      judul="Memuat Mata uang dan kurs"
      teks="Data master sedang disiapkan."
    />
  );
}
