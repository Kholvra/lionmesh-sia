#!/usr/bin/env node
// Automated verification script for PD-001 (Customer master, credit limits, terms, contact protection).
// Verifies AC-01 through AC-07, AC-10, and AC-11.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(relativePath, customRequire = () => { throw new Error("Unexpected require"); }) {
  const fileUrl = new URL(relativePath, import.meta.url);
  const source = readFileSync(fileUrl, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const loadedModule = { exports: {} };
  const context = {
    module: loadedModule,
    exports: loadedModule.exports,
    require: customRequire,
    console,
    Date,
    String,
    Number,
    Boolean,
    Record: Object,
  };
  vm.runInNewContext(transpiled, context);
  return loadedModule.exports;
}

const resultLib = {
  ok: (data) => ({ ok: true, data }),
  fail: (message) => ({ ok: false, message }),
};

const moneyLib = {
  isMoney: (value) => typeof value === "string" && /^\d+(\.\d{1,2})?$/.test(value.trim()),
};

const messages = load("../src/core/pelanggan/messages.ts");
const types = load("../src/core/pelanggan/types.ts");

const service = load("../src/core/pelanggan/service.ts", (dep) => {
  if (dep === "@/lib/result") return resultLib;
  if (dep === "@/core/ledger/money") return moneyLib;
  if (dep === "./messages") return messages;
  if (dep === "./types") return types;
  throw new Error(`Unexpected dependency in service.ts: ${dep}`);
});

const queries = load("../src/core/pelanggan/queries.ts", (dep) => {
  if (dep === "@/lib/result") return resultLib;
  if (dep === "./messages") return messages;
  if (dep === "./service") return service;
  if (dep === "./types") return types;
  throw new Error(`Unexpected dependency in queries.ts: ${dep}`);
});

console.log("=== PD-001 Verification ===");

// AC-01: Create customer with valid name, term, and credit limit
{
  const mockDb = {
    from: (table) => {
      assert.equal(table, "pelanggan");
      return {
        insert: (row) => {
          assert.equal(row.nama, "PT Contoh A");
          assert.equal(row.termin_hari, 30);
          assert.equal(row.batas_kredit, "50000000.00");
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: "00000000-0000-0000-0000-000000000001",
                  kode_pelanggan: "PLG-000001",
                  nama: row.nama,
                  termin_hari: row.termin_hari,
                  batas_kredit: row.batas_kredit,
                  status: "aktif",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  npwp: null,
                  alamat: null,
                  telepon: null,
                  email: null,
                },
                error: null,
              }),
            }),
          };
        },
      };
    },
  };

  const res = await service.createPelanggan(
    mockDb,
    { nama: "PT Contoh A", terminHari: "", batasKredit: "50000000.00" },
    { id: "usr-penjualan-01", peran: "Penjualan" }
  );

  assert.equal(res.ok, true, "createPelanggan should succeed");
  assert.equal(res.data.nama, "PT Contoh A");
  assert.equal(res.data.kodePelanggan, "PLG-000001");
  console.log("[PASS] AC-01: Penjualan membuat pelanggan baru dengan nama, termin, dan batas kredit");
}

// AC-02: Default term 30 days when empty/omitted
{
  const emptyRes = service.parseTermin("");
  assert.equal(emptyRes.ok, true);
  assert.equal(emptyRes.data, 30);

  const nullRes = service.parseTermin(null);
  assert.equal(nullRes.ok, true);
  assert.equal(nullRes.data, 30);

  const undefRes = service.parseTermin(undefined);
  assert.equal(undefRes.ok, true);
  assert.equal(undefRes.data, 30);
  console.log("[PASS] AC-02: Pelanggan baru tanpa termin mendapat termin default 30 hari");
}

// AC-03: Negative credit limit rejected
{
  const negativeRes = service.parseBatasKredit("-1");
  assert.equal(negativeRes.ok, false);
  assert.equal(negativeRes.message, "Batas kredit tidak boleh negatif.");

  const negativeDecimal = service.parseBatasKredit("-50000.00");
  assert.equal(negativeDecimal.ok, false);
  assert.equal(negativeDecimal.message, "Batas kredit tidak boleh negatif.");
  console.log("[PASS] AC-03: Batas kredit negatif ditolak dengan pesan yang sesuai");
}

// AC-04: Non-integer or negative term rejected
{
  for (const invalid of ["2,5", "abc", "-1", "3.5", -5]) {
    const res = service.parseTermin(invalid);
    assert.equal(res.ok, false, `Expected failure for term: ${invalid}`);
    assert.equal(res.message, "Termin pembayaran harus berupa jumlah hari, minimal 0.");
  }
  console.log("[PASS] AC-04: Termin non-bilangan bulat atau negatif ditolak");
}

// AC-05: Non-Manajemen cannot update credit limit
{
  const mockDb = {
    from: () => ({
      update: (row) => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => ({
              data: {
                id: "00000000-0000-0000-0000-000000000001",
                kode_pelanggan: "PLG-000001",
                nama: "PT Contoh A",
                termin_hari: 30,
                batas_kredit: row.batas_kredit,
                status: "aktif",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
  };

  // Attempt as Penjualan -> Rejected
  const penjRes = await service.updateBatasKredit(
    mockDb,
    { id: "00000000-0000-0000-0000-000000000001", batasKredit: "75000000" },
    { id: "usr-penjualan-01", peran: "Penjualan" }
  );
  assert.equal(penjRes.ok, false);
  assert.equal(penjRes.message, messages.PESAN_BATAS_TANPA_IZIN);

  // Attempt as Manajemen -> Accepted
  const manRes = await service.updateBatasKredit(
    mockDb,
    { id: "00000000-0000-0000-0000-000000000001", batasKredit: "75000000" },
    { id: "usr-manajemen-01", peran: "Manajemen" }
  );
  assert.equal(manRes.ok, true);
  assert.equal(manRes.data.batasKredit, "75000000");
  console.log("[PASS] AC-05: Pengguna tanpa izin Manajemen ditolak mengubah batas kredit");
}

// AC-06 & AC-07: Deactivation and reactivation
{
  let currentStatus = "aktif";
  const mockDb = {
    from: () => ({
      update: (row) => {
        currentStatus = row.status;
        return {
          eq: () => ({
            select: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "00000000-0000-0000-0000-000000000001",
                  kode_pelanggan: "PLG-000001",
                  nama: "PT Contoh A",
                  termin_hari: 30,
                  batas_kredit: "50000000",
                  status: currentStatus,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      },
    }),
  };

  // AC-06: Deactivate
  const deact = await service.updateStatusPelanggan(
    mockDb,
    { id: "00000000-0000-0000-0000-000000000001", status: "nonaktif" },
    { id: "usr-penjualan-01", peran: "Penjualan" }
  );
  assert.equal(deact.ok, true);
  assert.equal(deact.data.status, "nonaktif");
  console.log("[PASS] AC-06: Menonaktifkan pelanggan mengeset status nonaktif");

  // AC-07: Reactivate
  const react = await service.updateStatusPelanggan(
    mockDb,
    { id: "00000000-0000-0000-0000-000000000001", status: "aktif" },
    { id: "usr-penjualan-01", peran: "Penjualan" }
  );
  assert.equal(react.ok, true);
  assert.equal(react.data.status, "aktif");
  console.log("[PASS] AC-07: Mengaktifkan kembali pelanggan nonaktif");
}

// AC-10: Credit limit 0 saved as cash
{
  const zeroCredit = service.parseBatasKredit("0");
  assert.equal(zeroCredit.ok, true);
  assert.equal(zeroCredit.data, "0");

  const emptyCredit = service.parseBatasKredit("");
  assert.equal(emptyCredit.ok, true);
  assert.equal(emptyCredit.data, "0");
  console.log("[PASS] AC-10: Batas kredit 0 atau kosong tersimpan sebagai '0' (tunai)");
}

// AC-11: Contact privacy - only Penjualan, Accounting, Manajemen can read contacts
{
  assert.equal(queries.canReadKontak({ id: "1", peran: "Penjualan" }), true);
  assert.equal(queries.canReadKontak({ id: "2", peran: "Accounting" }), true);
  assert.equal(queries.canReadKontak({ id: "3", peran: "Manajemen" }), true);

  assert.equal(queries.canReadKontak({ id: "4", peran: "Gudang" }), false);
  assert.equal(queries.canReadKontak({ id: "5", peran: "Produksi" }), false);
  assert.equal(queries.canReadKontak({ id: "6", peran: "QC" }), false);
  assert.equal(queries.canReadKontak({ id: "7", peran: "Purchasing" }), false);

  const mockDb = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "00000000-0000-0000-0000-000000000001",
              kode_pelanggan: "PLG-000001",
              nama: "PT Contoh A",
              termin_hari: 30,
              batas_kredit: "50000000",
              status: "aktif",
              npwp: "01.234.567.8-901.000",
              alamat: "Jl. Industri No. 1",
              telepon: "021-12345678",
              email: "info@contoh.test",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      }),
    }),
  };

  const gudangQuery = await queries.getPelangganDenganKontak(
    mockDb,
    "00000000-0000-0000-0000-000000000001",
    { id: "usr-gudang", peran: "Gudang" }
  );
  assert.equal(gudangQuery.ok, false);
  assert.equal(gudangQuery.message, messages.PESAN_KONTAK_TANPA_IZIN);

  const penjualanQuery = await queries.getPelangganDenganKontak(
    mockDb,
    "00000000-0000-0000-0000-000000000001",
    { id: "usr-penjualan", peran: "Penjualan" }
  );
  assert.equal(penjualanQuery.ok, true);
  assert.equal(penjualanQuery.data.telepon, "021-12345678");
  console.log("[PASS] AC-11: Data kontak hanya terbaca oleh peran yang berhak (Penjualan/Accounting/Manajemen)");
}

console.log("\nSemua kriteria verifikasi PD-001 LULUS!");
