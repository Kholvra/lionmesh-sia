import { LoadingState } from "@/components/ui/states";

export default function PermintaanLoading() {
  return (
    <LoadingState
      judul="Memuat permintaan pembelian"
      teks="Antrean dan detail permintaan sedang disiapkan."
    />
  );
}
