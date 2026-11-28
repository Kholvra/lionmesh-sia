import assert from "node:assert/strict";
import { pasangPemuatTs } from "./lib/ts-loader.mjs";

pasangPemuatTs();

const { prosesAntreanEmail } = await import("../src/core/notifikasi/service.ts");
function clientFor(row, failCompletion = false) {
  return { from() {
    let update = null;
    const filters = [];
    const query = {
      select() { return query; }, order() { return query; }, limit() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      is(key, value) { filters.push([key, value]); return query; },
      lte() { return query; },
      update(value) { update = value; return query; },
      then(resolve, reject) {
        try {
          if (!filters.every(([key, value]) => row[key] === value)) return resolve({ data: [], error: null });
          if (!update) return resolve({ data: [{ ...row }], error: null });
          if (failCompletion && update.status === "terkirim") return resolve({ data: null, error: { message: "database gagal" } });
          Object.assign(row, update);
          return resolve({ data: [{ id: row.id }], error: null });
        } catch (error) { return reject(error); }
      },
    };
    return query;
  } };
}
function entry() { return { id: "1", status: "menunggu", percobaan: 0, diklaim_pada: null, alamat: "uji@lionmesh.test", notifikasi: { judul: "Uji", nomor_dokumen: null, tautan: null } }; }
for (const scenario of ["timeout", "completion-fails", "success"]) {
  const row = entry();
  let sends = 0;
  const client = clientFor(row, scenario === "completion-fails");
  const options = { sekarang: new Date("2026-11-24T00:00:00Z"), kirim: async () => { sends++; return scenario === "timeout" ? { ok: false, message: "timeout" } : { ok: true, data: undefined }; } };
  const first = await prosesAntreanEmail(client, options);
  assert.equal(first.ok, true);
  assert.equal(first.data.perluPemeriksaan, scenario === "success" ? 0 : 1);
  await prosesAntreanEmail(client, { ...options, sekarang: new Date("2026-11-24T00:10:00Z") });
  assert.equal(sends, 1, `${scenario}: pengiriman ulang tidak diperbolehkan`);
  assert.equal(row.status, scenario === "success" ? "terkirim" : "perlu_pemeriksaan");
  assert.equal(row.percobaan, 1);
  console.log(`[PASS] ${scenario}: ${row.status}, ${sends} pengiriman`);
}

{
  const row = entry();
  const client = clientFor(row);
  let sends = 0;
  let release;
  let started;
  const startedPromise = new Promise((resolve) => { started = resolve; });
  const finishPromise = new Promise((resolve) => { release = resolve; });
  const options = {
    sekarang: new Date("2026-11-24T00:00:00Z"),
    kirim: async () => {
      sends += 1;
      started();
      await finishPromise;
      return { ok: true, data: undefined };
    },
  };
  const first = prosesAntreanEmail(client, options);
  await startedPromise;
  await prosesAntreanEmail(client, options);
  release();
  await first;
  assert.equal(sends, 1);
  assert.equal(row.status, "terkirim");
  console.log("[PASS] concurrent: satu pengiriman selama worker lain berjalan");
}
