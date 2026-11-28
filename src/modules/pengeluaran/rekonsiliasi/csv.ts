/**
 * Generic CSV import for bank statements (D-52). Parsing happens on the server;
 * the browser only previews headers so the user can map columns.
 */

export type Pemetaan = {
  tanggal: number;
  nominal: number;
  referensi: number | null;
  arah: number | null;
};

export type BarisMutasi = {
  tanggal: string;
  arah: "MASUK" | "KELUAR";
  nominal: string;
  referensi: string | null;
};

/** Splits CSV text with support for quoted cells and `;` or `,` separators. */
export function parseCsv(teks: string): string[][] {
  const pemisah = pilihPemisah(teks);
  const baris: string[][] = [];
  let sel: string[] = [];
  let isi = "";
  let dalamKutip = false;

  for (let i = 0; i < teks.length; i += 1) {
    const huruf = teks[i];
    if (dalamKutip) {
      if (huruf === '"') {
        if (teks[i + 1] === '"') {
          isi += '"';
          i += 1;
        } else {
          dalamKutip = false;
        }
      } else {
        isi += huruf;
      }
      continue;
    }

    if (huruf === '"') {
      dalamKutip = true;
    } else if (huruf === pemisah) {
      sel.push(isi.trim());
      isi = "";
    } else if (huruf === "\n") {
      sel.push(isi.trim());
      baris.push(sel);
      sel = [];
      isi = "";
    } else if (huruf !== "\r") {
      isi += huruf;
    }
  }

  if (isi.length > 0 || sel.length > 0) {
    sel.push(isi.trim());
    baris.push(sel);
  }

  return baris.filter((row) => row.some((cell) => cell.length > 0));
}

function pilihPemisah(teks: string): string {
  const contoh = teks.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const titikKoma = (contoh.match(/;/g) ?? []).length;
  const koma = (contoh.match(/,/g) ?? []).length;
  return titikKoma > koma ? ";" : ",";
}

export function headerCsv(teks: string): string[] {
  const rows = parseCsv(teks);
  return rows[0] ?? [];
}

/** `YYYY-MM-DD`, `DD/MM/YYYY`, or `DD-MM-YYYY` to ISO date. */
export function parseTanggal(nilai: string): string | null {
  const teks = nilai.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(teks);
  if (iso) {
    const [, tahun, bulan, hari] = iso;
    return valid(tahun, bulan, hari);
  }
  const lokal = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(teks);
  if (lokal) {
    const [, hari, bulan, tahun] = lokal;
    return valid(tahun, bulan, hari);
  }
  return null;
}

function valid(tahun: string, bulan: string, hari: string): string | null {
  const t = Number(tahun);
  const b = Number(bulan);
  const h = Number(hari);
  const tanggal = new Date(Date.UTC(t, b - 1, h));
  if (
    tanggal.getUTCFullYear() !== t ||
    tanggal.getUTCMonth() !== b - 1 ||
    tanggal.getUTCDate() !== h
  ) {
    return null;
  }
  return `${tahun}-${bulan.padStart(2, "0")}-${hari.padStart(2, "0")}`;
}

/**
 * Reads Indonesian or plain decimal notation. Returns whole rupiah and sign.
 * `1.234,56` -> 1234.56; `1234.56` -> 1234.56; `1.234` -> 1234.
 */
export function parseNominalRupiah(
  nilai: string,
): { nominal: number; negatif: boolean } | null {
  let teks = nilai.trim().replace(/\s/g, "");
  if (teks.length === 0) return null;

  const negatif = teks.startsWith("-") || (teks.startsWith("(") && teks.endsWith(")"));
  teks = teks.replace(/^[-(]/, "").replace(/\)$/, "").replace(/^\+/, "");

  let bulat = teks;
  let pecahan = "";
  if (teks.includes(",")) {
    const [kiri, kanan = ""] = teks.split(",");
    bulat = kiri;
    pecahan = kanan;
    bulat = bulat.replace(/\./g, "");
  } else if (teks.includes(".")) {
    if (/^\d{1,3}(\.\d{3})+$/.test(teks)) {
      bulat = teks.replace(/\./g, "");
    } else if (/^\d+\.\d{1,2}$/.test(teks)) {
      const [kiri, kanan = ""] = teks.split(".");
      bulat = kiri;
      pecahan = kanan;
      if (/[1-9]/.test(pecahan)) return null;
    } else {
      return null;
    }
  }

  if (!/^\d+$/.test(bulat)) return null;
  if (/[1-9]/.test(pecahan)) return null;

  const nominal = Number(bulat);
  if (!Number.isSafeInteger(nominal) || nominal <= 0) return null;
  return { nominal, negatif };
}

function petakanArah(nilai: string): "MASUK" | "KELUAR" | null {
  const teks = nilai.trim().toLowerCase();
  if (["masuk", "m", "in", "kredit", "cr", "c"].includes(teks)) return "MASUK";
  if (["keluar", "k", "out", "debit", "db", "d"].includes(teks)) return "KELUAR";
  return null;
}

export function petakanBaris(
  rows: readonly string[][],
  pemetaan: Pemetaan,
): { baris: BarisMutasi[]; error: string | null } {
  if (rows.length < 2) {
    return { baris: [], error: "Berkas tidak memuat baris mutasi" };
  }

  const baris: BarisMutasi[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const nomorBaris = index + 1;

    const tanggal = parseTanggal(row[pemetaan.tanggal] ?? "");
    if (!tanggal) {
      return { baris: [], error: `Baris ${nomorBaris} tanggal tidak terbaca` };
    }

    const nominal = parseNominalRupiah(row[pemetaan.nominal] ?? "");
    if (!nominal) {
      return { baris: [], error: `Baris ${nomorBaris} nominal tidak terbaca` };
    }

    let arah: "MASUK" | "KELUAR" | null = null;
    if (pemetaan.arah !== null) {
      arah = petakanArah(row[pemetaan.arah] ?? "");
      if (!arah) {
        return { baris: [], error: `Baris ${nomorBaris} arah tidak terbaca` };
      }
    } else {
      arah = nominal.negatif ? "KELUAR" : "MASUK";
    }

    const referensi =
      pemetaan.referensi === null ? null : (row[pemetaan.referensi] ?? "").trim();

    baris.push({
      tanggal,
      arah,
      nominal: nominal.nominal.toString(),
      referensi: referensi && referensi.length > 0 ? referensi : null,
    });
  }

  return { baris, error: null };
}
