/**
 * Pure calculation utilities for PD-002 Sales Orders.
 * Formula (01-requirement.md):
 *   nilai_kotor = round2(qty * harga)
 *   diskon      = round2(nilai_kotor * (diskon_persen / 100))
 *   dpp         = round2(nilai_kotor - diskon)
 *   ppn         = round2(dpp * tarif_ppn)
 *   total       = round2(dpp + ppn)
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface BarisPerhitungan {
  nilaiKotor: number;
  diskonNilai: number;
  dpp: number;
  ppn: number;
  total: number;
}

export function hitungBarisPesanan(
  qty: number,
  hargaSatuan: number,
  diskonPersen: number,
  tarifPpn: number,
): BarisPerhitungan {
  const nilaiKotor = round2(qty * hargaSatuan);
  const diskonNilai = round2(nilaiKotor * (diskonPersen / 100));
  const dpp = round2(nilaiKotor - diskonNilai);
  const ppn = round2(dpp * tarifPpn);
  const total = round2(dpp + ppn);

  return { nilaiKotor, diskonNilai, dpp, ppn, total };
}

export interface TotalPesananPerhitungan {
  nilaiKotor: number;
  diskonTotal: number;
  dpp: number;
  ppn: number;
  total: number;
}

export function hitungTotalPesanan(
  items: Array<{
    qty: number;
    hargaSatuan: number;
    diskonPersen: number;
  }>,
  tarifPpn: number,
): TotalPesananPerhitungan {
  let nilaiKotor = 0;
  let diskonTotal = 0;
  let dpp = 0;
  let ppn = 0;
  let total = 0;

  for (const item of items) {
    const baris = hitungBarisPesanan(
      item.qty,
      item.hargaSatuan,
      item.diskonPersen,
      tarifPpn,
    );
    nilaiKotor = round2(nilaiKotor + baris.nilaiKotor);
    diskonTotal = round2(diskonTotal + baris.diskonNilai);
    dpp = round2(dpp + baris.dpp);
    ppn = round2(ppn + baris.ppn);
    total = round2(total + baris.total);
  }

  return { nilaiKotor, diskonTotal, dpp, ppn, total };
}

export function cekMelewatiBatasKredit(
  exposureSebelumnya: number,
  totalPesananBaru: number,
  batasKredit: number,
): boolean {
  const totalExposure = round2(exposureSebelumnya + totalPesananBaru);
  if (batasKredit <= 0) {
    return totalPesananBaru > 0 || exposureSebelumnya > 0;
  }
  return totalExposure > batasKredit;
}
