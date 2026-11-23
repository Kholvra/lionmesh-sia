#!/usr/bin/env node
// Seed the local database without asking for the test password first.
// The password stays a seed input (FND-008); this wrapper only supplies the
// shared local value so an agent or a new teammate can run one command.

import { spawnSync } from "node:child_process";

const LOCAL_TEST_PASSWORD = "lionmesh-dev-2026";

const AKUN = [
  ["Penjualan", "penjualan@lionmesh.test"],
  ["Pengiriman", "pengiriman@lionmesh.test"],
  ["Gudang", "gudang@lionmesh.test"],
  ["Purchasing", "purchasing@lionmesh.test"],
  ["QC", "qc@lionmesh.test"],
  ["Produksi", "produksi@lionmesh.test"],
  ["Accounting", "accounting@lionmesh.test"],
  ["Finance", "finance@lionmesh.test"],
  ["Manajemen", "manajemen@lionmesh.test"],
  ["Direksi", "direksi@lionmesh.test"],
  ["HR", "hr@lionmesh.test"],
  ["Supervisor Lapangan", "supervisor-lapangan@lionmesh.test"],
  ["Karyawan", "karyawan@lionmesh.test"],
];

const password = process.env.FND_TEST_PASSWORD ?? LOCAL_TEST_PASSWORD;

const result = spawnSync(process.execPath, ["scripts/db-seed.mjs"], {
  stdio: "inherit",
  env: { ...process.env, FND_TEST_PASSWORD: password },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const lines = AKUN.map(([peran, email]) => `  ${peran.padEnd(20)} ${email}`);

process.stdout.write(
  `\n[db:seed:local] akun uji siap — sandi: ${password}\n` +
    `${lines.join("\n")}\n\n` +
    "Masuk di http://localhost:3000/login\n" +
    "Sandi hanya untuk database lokal Docker; jangan dipakai di lingkungan lain.\n\n",
);
