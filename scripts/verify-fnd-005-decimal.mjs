import { muatTs } from "./lib/ts-loader.mjs";

const decimal = muatTs("../src/core/inventory/decimal.ts", undefined, import.meta.url);
const service = muatTs(
  "../src/core/inventory/service.ts",
  (name) => {
    if (name === "./decimal") return decimal;
    if (name === "@/lib/result") return { fail: (message) => ({ ok: false, message }), ok: (data) => ({ ok: true, data }) };
    throw new Error(`Unexpected dependency: ${name}`);
  },
  import.meta.url,
);
const { defaultValuationStrategy: valuation } = muatTs(
  "../src/core/inventory/valuation.ts",
  undefined,
  import.meta.url,
);
let calls = 0;
const client = { rpc: async () => { calls++; return { data: {}, error: null }; } };
for (const hargaSatuan of ["1.00009", 1.5, "-1"]) {
  const result = await service.catatMutasi(client, { qty: "1", hargaSatuan, tipe: "PENYESUAIAN", alasan: "test", tanggal: "2026-01-01" });
  if (result.ok) throw new Error("Invalid adjustment price accepted");
}
if (calls !== 0) throw new Error("Invalid price reached RPC");
const incoming = valuation.calculateIncoming("0", "0", "0", "900719925474.0993", "0.0001");
const outgoing = valuation.calculateOutgoing(incoming.qtyBaru, incoming.nilaiBaru, incoming.hargaRataBaru, incoming.qtyBaru);
const rounding = valuation.calculateIncoming("0", "0", "0", "1", "0.0050");
const maxMoney = valuation.calculateOutgoing("1", "9999999999999999.99", "1", "1");
if (incoming.qtyBaru !== "900719925474.0993" || incoming.nilaiBaru !== "90071992.55" || outgoing.nilaiBaru !== "0.00" || rounding.nilaiMasuk !== "0.01" || maxMoney.nilaiKeluar !== "9999999999999999.99") throw new Error("Incorrect valuation");
let rejectedOverflow = false;
try { valuation.calculateIncoming("99999999999999.9999", "1", "1", "0.0001", "1"); } catch { rejectedOverflow = true; }
if (!rejectedOverflow) throw new Error("Overflow accepted");
console.log("PASS invalid prices rejected before RPC; exact valuation, rounding, and overflow boundaries");
