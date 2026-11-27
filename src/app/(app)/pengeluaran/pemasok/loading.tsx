import { LoadingState } from "@/components/ui/states";

export default function PemasokLoading() {
  return (
    <LoadingState
      judul="Memuat data pemasok"
      teks="Daftar pemasok, termin, dan toleransi sedang disiapkan."
    />
  );
}
