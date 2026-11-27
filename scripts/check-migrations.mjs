#!/usr/bin/env node
// Memvalidasi berkas migrasi sebelum menyentuh database.
// Kontrak: PRE-02, B-01, INV-02 pada FND-001.

import { readdirSync } from "node:fs";

const DIR = "supabase/migrations";
const POLA = /^(\d{4})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
// GJ-001 reserves 0016; see docs/tech-debt/gj-001-mock-store.md.
const NOMOR_DICADANGKAN = new Set(["0016"]);


const berkas = readdirSync(DIR)
  .filter((nama) => nama.endsWith(".sql"))
  .sort();

if (berkas.length === 0) {
  console.error(`[check:migrations] tidak ada berkas migrasi di ${DIR}`);
  process.exit(1);
}

const masalah = [];
const nomor = new Map();

for (const nama of berkas) {
  const cocok = POLA.exec(nama);
  if (!cocok) {
    masalah.push(`nama tidak sesuai pola NNNN_nama.sql: ${nama}`);
    continue;
  }
  const n = cocok[1];
  if (nomor.has(n)) {
    masalah.push(`nomor ${n} dipakai dua berkas: ${nomor.get(n)} dan ${nama}`);
  } else {
    nomor.set(n, nama);
  }
}
const angka = [...nomor.keys()].map((n) => Number(n)).sort((a, b) => a - b);
if (angka.length > 1) {
  for (let n = angka[0]; n < angka[angka.length - 1]; n += 1) {
    const kunci = String(n).padStart(4, "0");
    if (!nomor.has(kunci) && !NOMOR_DICADANGKAN.has(kunci)) {
      masalah.push(`celah nomor: ${kunci} tidak ada dalam urutan migrasi`);
    }
  }
}

if (masalah.length > 0) {
  console.error("[check:migrations] gagal:");
  for (const m of masalah) console.error(`  - ${m}`);
  process.exit(1);
}


console.log(`[check:migrations] ok — ${berkas.length} berkas, nomor unik`);
for (const cadangan of NOMOR_DICADANGKAN) {
  if (!nomor.has(cadangan)) {
    console.log(`[check:migrations] nomor ${cadangan} dicadangkan untuk GJ-001`);
  }
}
