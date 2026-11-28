import { LoadingState } from "@/components/ui/states";

export default function NotifikasiLoading() {
  return (
    <LoadingState
      judul="Memuat notifikasi"
      teks="Daftar notifikasi dan status pengiriman email sedang disiapkan."
    />
  );
}
