#!/usr/bin/env node
// Memvalidasi berkas migrasi sebelum menyentuh database.
// Kontrak: PRE-02, B-01, INV-02 pada FND-001.

import { readdirSync } from "node:fs";

const DIR = "supabase/migrations";
const POLA = /^(\d{4})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;

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

if (masalah.length > 0) {
  console.error("[check:migrations] gagal:");
  for (const m of masalah) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`[check:migrations] ok — ${berkas.length} berkas, nomor unik`);
