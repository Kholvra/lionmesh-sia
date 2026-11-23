import type { Profile } from "@/lib/auth/types";
import type { LaporanSlug } from "./daftar-laporan";
import { ArusKasScreen } from "./screens/arus-kas";
import { BukuBesarScreen } from "./screens/buku-besar";
import { DaftarJurnalScreen } from "./screens/daftar-jurnal";
import { KartuPersediaanScreen } from "./screens/kartu-persediaan";
import { LabaRugiScreen } from "./screens/laba-rugi";
import { NeracaScreen } from "./screens/neraca";
import { NeracaSaldoScreen } from "./screens/neraca-saldo";
import type { LaporanParams } from "./screens/shared";

interface LaporanScreenProps {
  slug: LaporanSlug;
  profil: Profile;
  params: LaporanParams;
}

export function LaporanScreen({ slug, profil, params }: LaporanScreenProps) {
  switch (slug) {
    case "buku-besar":
      return <BukuBesarScreen params={params} profil={profil} />;
    case "neraca-saldo":
      return <NeracaSaldoScreen params={params} profil={profil} />;
    case "laba-rugi":
      return <LabaRugiScreen params={params} profil={profil} />;
    case "neraca":
      return <NeracaScreen params={params} profil={profil} />;
    case "daftar-jurnal":
      return <DaftarJurnalScreen params={params} profil={profil} />;
    case "arus-kas":
      return <ArusKasScreen params={params} profil={profil} />;
    case "kartu-persediaan":
      return <KartuPersediaanScreen params={params} profil={profil} />;
  }
}
