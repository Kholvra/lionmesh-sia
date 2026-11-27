import { LoadingState } from "@/components/ui/states";

export default function Loading() {
  return (
    <LoadingState
      judul="Memuat Mata uang dan kurs"
      teks="Data master sedang disiapkan."
    />
  );
}
