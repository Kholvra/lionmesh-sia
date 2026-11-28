export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface OpenFakturCandidate {
  id: string;
  tanggalFaktur: string;
  sisaPiutang: number;
}

export interface FifoAlokasiResult {
  allocations: Array<{ fakturId: string; nominal: number }>;
  totalAllocated: number;
}

/**
 * PD-006 (D-49, AC-03): Alokasi otomatis ke faktur pelanggan yang sama,
 * dimulai dari tanggal faktur paling lama (FIFO).
 */
export function alokasiFifoPembayaran(
  nominalPembayaran: number,
  openFakturs: OpenFakturCandidate[],
): FifoAlokasiResult {
  const sorted = [...openFakturs].sort((a, b) =>
    a.tanggalFaktur.localeCompare(b.tanggalFaktur),
  );

  let sisaUang = round2(nominalPembayaran);
  let totalAllocated = 0;
  const allocations: Array<{ fakturId: string; nominal: number }> = [];

  for (const fak of sorted) {
    if (sisaUang <= 0) break;
    if (fak.sisaPiutang <= 0) continue;

    const alokasi = round2(Math.min(sisaUang, fak.sisaPiutang));
    if (alokasi > 0) {
      allocations.push({ fakturId: fak.id, nominal: alokasi });
      sisaUang = round2(sisaUang - alokasi);
      totalAllocated = round2(totalAllocated + alokasi);
    }
  }

  return { allocations, totalAllocated };
}

export function hitungStatusFakturSetelahAlokasi(
  totalFaktur: number,
  sisaBaru: number,
): "LUNAS" | "SEBAGIAN_LUNAS" | "DITERBITKAN" {
  const s = round2(sisaBaru);
  if (s <= 0) return "LUNAS";
  if (s < round2(totalFaktur)) return "SEBAGIAN_LUNAS";
  return "DITERBITKAN";
}
