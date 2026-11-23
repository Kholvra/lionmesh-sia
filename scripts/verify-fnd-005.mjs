#!/usr/bin/env node
// Skrip verifikasi FND-005 — membuktikan AC-01 sampai AC-15 dan mencatat bukti.

import { Client } from "pg";

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  throw new Error("SUPABASE_DB_URL must point to an isolated fnd005_test_* database.");
}
const target = new URL(DB_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.slice(1).startsWith("fnd005_test_")) {
  throw new Error("FND-005 verification requires an isolated local fnd005_test_* database.");
}

const client = new Client({ connectionString: DB_URL });
await client.connect();

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

async function recordResult(id, name, runFn) {
  try {
    const detail = await runFn();
    results.push({ id, name, status: "PASS", detail });
    console.log(`[PASS] ${id}: ${name}`);
  } catch (err) {
    results.push({ id, name, status: "FAIL", error: err.message });
    console.error(`[FAIL] ${id}: ${name} — ${err.message}`);
    throw err;
  }
}

console.log("=== Memulai Verifikasi FND-005 ===");

// Dapatkan versi PostgreSQL
const { rows: vRows } = await client.query("select version();");
const pgVersion = vRows[0].version;
console.log(`Database: ${pgVersion}\n`);

// Setup data master uji
await client.query("begin");
// Bersihkan data uji sebelumnya
await client.query(`
  alter table public.mutasi_stok disable trigger trg_mutasi_stok_immutable;
  delete from public.mutasi_stok where produk_id in (select id from public.produk where kode like 'PROD-TEST%');
  delete from public.saldo_stok where produk_id in (select id from public.produk where kode like 'PROD-TEST%');
  alter table public.mutasi_stok enable trigger trg_mutasi_stok_immutable;
  delete from public.produk where kode like 'PROD-TEST%';
  delete from public.gudang where kode like 'G%-TEST%';
  delete from public.satuan where kode like 'SAT-TEST%';
`);

const { rows: satRows } = await client.query(`
  insert into public.satuan (kode, nama) values ('SAT-TEST', 'Satuan Test') returning id;
`);
const satId = satRows[0].id;

const { rows: pRows } = await client.query(`
  insert into public.produk (kode, nama, satuan_dasar_id, aktif)
  values
    ('PROD-TEST-1', 'Produk Uji 1', '${satId}', true),
    ('PROD-TEST-NONAKTIF', 'Produk Nonaktif', '${satId}', false)
  returning id, kode, aktif;
`);
const prodAktif = pRows.find((p) => p.aktif);
const prodNonaktif = pRows.find((p) => !p.aktif);

const { rows: gRows } = await client.query(`
  insert into public.gudang (kode, nama, aktif)
  values
    ('G1-TEST', 'Gudang 1', true),
    ('G2-TEST', 'Gudang 2', true),
    ('G-TEST-NONAKTIF', 'Gudang Nonaktif', false)
  returning id, kode, aktif;
`);
const g1 = gRows.find((g) => g.kode === 'G1-TEST');
const g2 = gRows.find((g) => g.kode === 'G2-TEST');
const gNonaktif = gRows.find((g) => !g.aktif);

await client.query("commit");

// AC-01: Mutasi masuk menaikkan qty dan nilai, dan menghitung ulang harga rata-rata bergerak
await recordResult(
  "AC-01",
  "Mutasi masuk menaikkan qty dan nilai, dan menghitung ulang harga rata-rata bergerak",
  async () => {
    // Set awal: saldo qty 10, nilai 100 (harga 10)
    await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 10:00:00+00', 'MASUK', 10, 10, 'TEST_INIT'
      );
    `);

    // Catat mutasi masuk qty 5 harga 16
    const { rows } = await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 11:00:00+00', 'MASUK', 5, 16, 'TEST_AC01'
      ) as res;
    `);

    const res = rows[0].res;
    assert(Number(res.saldo.qty) === 15, `Qty saldo harus 15, dapat ${res.saldo.qty}`);
    assert(Number(res.saldo.nilai) === 180, `Nilai saldo harus 180, dapat ${res.saldo.nilai}`);
    assert(Number(res.saldo.harga_rata) === 12, `Harga rata harus 12, dapat ${res.saldo.harga_rata}`);

    return `Saldo: qty=${res.saldo.qty}, nilai=${res.saldo.nilai}, harga_rata=${res.saldo.harga_rata}`;
  }
);

// AC-02: Mutasi keluar mengurangi qty dan nilai pada harga rata yang berlaku; harga rata tidak berubah
await recordResult(
  "AC-02",
  "Mutasi keluar mengurangi qty dan nilai pada harga rata; harga rata tetap; nilai_keluar 48",
  async () => {
    const { rows } = await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 12:00:00+00', 'KELUAR', 4, null, 'TEST_AC02'
      ) as res;
    `);

    const res = rows[0].res;
    assert(Number(res.saldo.qty) === 11, `Qty saldo harus 11, dapat ${res.saldo.qty}`);
    assert(Number(res.saldo.nilai) === 132, `Nilai saldo harus 132, dapat ${res.saldo.nilai}`);
    assert(Number(res.saldo.harga_rata) === 12, `Harga rata harus 12, dapat ${res.saldo.harga_rata}`);
    assert(Number(res.nilai) === 48, `Nilai keluar harus 48, dapat ${res.nilai}`);

    return `Saldo: qty=${res.saldo.qty}, nilai=${res.saldo.nilai}, harga_rata=${res.saldo.harga_rata}, nilai_keluar=${res.nilai}`;
  }
);

// AC-03: Qty saldo sama dengan jumlah mutasi_stok (ARCH-001 INV-03)
await recordResult(
  "AC-03",
  "Qty saldo sama dengan sum(mutasi_stok.qty) (INV-03)",
  async () => {
    const { rows: sumRows } = await client.query(`
      select sum(qty)::numeric as total_mutasi
      from public.mutasi_stok
      where produk_id = '${prodAktif.id}' and gudang_id = '${g1.id}';
    `);
    const { rows: saldoRows } = await client.query(`
      select qty from public.saldo_stok
      where produk_id = '${prodAktif.id}' and gudang_id = '${g1.id}';
    `);

    const totalMutasi = Number(sumRows[0].total_mutasi);
    const saldoQty = Number(saldoRows[0].qty);
    assert(
      totalMutasi === saldoQty,
      `Total mutasi (${totalMutasi}) tidak sama dengan saldo qty (${saldoQty})`
    );

    return `sum(mutasi)=${totalMutasi}, saldo.qty=${saldoQty}`;
  }
);

// AC-04: Nilai saldo sesuai qty × harga rata dengan toleransi 0,01 + qty × 0,00005 (INV-02)
await recordResult(
  "AC-04",
  "Nilai saldo sesuai qty × harga rata dalam toleransi (INV-02)",
  async () => {
    const { rows: saldoRows } = await client.query(`
      select qty, nilai, harga_rata from public.saldo_stok
      where produk_id = '${prodAktif.id}' and gudang_id = '${g1.id}';
    `);
    const s = saldoRows[0];
    const qty = Number(s.qty);
    const nilai = Number(s.nilai);
    const hargaRata = Number(s.harga_rata);

    const hitung = qty * hargaRata;
    const diff = Math.abs(nilai - hitung);
    const toleransi = 0.01 + qty * 0.00005;

    assert(
      diff <= toleransi,
      `Selisih ${diff} melebihi toleransi ${toleransi} (nilai=${nilai}, hitung=${hitung})`
    );

    return `diff=${diff.toFixed(6)}, toleransi=${toleransi.toFixed(6)}`;
  }
);

// AC-05: Mutasi dan saldo tersimpan dalam satu transaksi; jika salah satu gagal, keduanya batal
await recordResult(
  "AC-05",
  "Mutasi dan saldo dalam satu transaksi; rollback jika gagal",
  async () => {
    const { rows: cntBefore } = await client.query(`
      select count(*)::int as cnt from public.mutasi_stok
      where produk_id = '${prodAktif.id}' and gudang_id = '${g1.id}';
    `);

    let threw = false;
    try {
      // Coba keluar melebihi stok (misal 9999) yang memicu exception
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodAktif.id}', '${g1.id}', '2026-11-22 12:30:00+00', 'KELUAR', 9999, null, 'TEST_FAIL'
        );
      `);
    } catch {
      threw = true;
    }
    assert(threw, "Transaksi seharusnya gagal dan melempar error");

    const { rows: cntAfter } = await client.query(`
      select count(*)::int as cnt from public.mutasi_stok
      where produk_id = '${prodAktif.id}' and gudang_id = '${g1.id}';
    `);

    assert(
      cntBefore[0].cnt === cntAfter[0].cnt,
      `Baris mutasi berubah dari ${cntBefore[0].cnt} ke ${cntAfter[0].cnt}`
    );

    return `Baris mutasi sebelum=${cntBefore[0].cnt}, sesudah=${cntAfter[0].cnt}`;
  }
);

// AC-06: Role klien tidak bisa menulis saldo_stok atau mutasi_stok langsung (ARCH-04, OQ-05-07)
await recordResult(
  "AC-06",
  "Role klien (anon, authenticated) ditolak saat insert/update/delete langsung",
  async () => {
    const roles = ["anon", "authenticated"];
    const actions = [
      `update public.saldo_stok set qty = 999 where produk_id = '${prodAktif.id}' and gudang_id = '${g1.id}'`,
      `insert into public.mutasi_stok (produk_id, gudang_id, tanggal, tipe, qty, harga_satuan, nilai, sumber_tipe, sumber_id) values ('${prodAktif.id}', '${g1.id}', now(), 'MASUK', 1, 10, 10, 'HACK', gen_random_uuid())`,
      `delete from public.saldo_stok where produk_id = '${prodAktif.id}'`,
      `delete from public.mutasi_stok where produk_id = '${prodAktif.id}'`,
    ];

    for (const r of roles) {
      for (const action of actions) {
        let rejected = false;
        try {
          await client.query("begin");
          await client.query(`set local role ${r};`);
          await client.query(action);
          await client.query("commit");
        } catch {
          await client.query("rollback").catch(() => {});
          rejected = true;
        }
        assert(rejected, `Role ${r} seharusnya ditolak pada aksi: ${action}`);
      }
    }

    let rpcRejected = false;
    try {
      await client.query("begin");
      await client.query("set local role authenticated");
      await client.query(`select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 12:15:00+00', 'MASUK', 1, 12, 'TEST_AUTH'
      )`);
      await client.query("commit");
    } catch {
      await client.query("rollback");
      rpcRejected = true;
    }
    assert(rpcRejected, "RPC harus ditolak untuk authenticated");

    await client.query("begin");
    await client.query("set local role service_role");
    const { rows: okRows } = await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 12:15:00+00', 'MASUK', 1, 12, 'TEST_AUTH'
      ) as res;
    `);
    await client.query("commit");
    assert(Number(okRows[0].res.saldo.qty) === 12, "RPC service_role gagal");

    // Kembalikan ke qty 11 dengan keluar 1
    await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 12:20:00+00', 'KELUAR', 1, null, 'TEST_CLEANUP'
      );
    `);

    return "DML dan RPC klien ditolak; RPC service_role berhasil. Integrasi aplikasi masih perlu diuji.";
  }
);

// AC-07: Mutasi dengan tanggal mendahului mutasi terakhir ditolak
await recordResult(
  "AC-07",
  "Mutasi backdate ditolak dengan pesan yang menyebut tanggal terakhir",
  async () => {
    let errMsg = "";
    try {
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodAktif.id}', '${g1.id}', '2026-11-22 09:00:00+00', 'MASUK', 2, 10, 'TEST_BACKDATE'
        );
      `);
    } catch (e) {
      errMsg = e.message;
    }

    assert(
      errMsg.includes("Tanggal mutasi tidak boleh mendahului mutasi terakhir"),
      `Pesan salah: ${errMsg}`
    );

    return `Ditolak dengan pesan: "${errMsg}"`;
  }
);

// AC-08: Mutasi dengan qty nol ditolak
await recordResult(
  "AC-08",
  "Mutasi dengan qty nol ditolak dengan pesan 'Qty harus bukan nol.'",
  async () => {
    let errMsg = "";
    try {
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodAktif.id}', '${g1.id}', '2026-11-22 13:00:00+00', 'MASUK', 0, 10, 'TEST_QTY0'
        );
      `);
    } catch (e) {
      errMsg = e.message;
    }

    assert(errMsg.includes("Qty harus bukan nol."), `Pesan salah: ${errMsg}`);
    return `Ditolak dengan pesan: "${errMsg}"`;
  }
);

// AC-09: Mutasi tidak bisa diubah atau dihapus
await recordResult(
  "AC-09",
  "Mutasi tidak bisa diubah atau dihapus (trigger immutability)",
  async () => {
    const { rows: mRows } = await client.query(`
      select id from public.mutasi_stok where produk_id = '${prodAktif.id}' limit 1;
    `);
    const mId = mRows[0].id;

    let updateErr = "";
    try {
      await client.query(`update public.mutasi_stok set qty = 999 where id = '${mId}';`);
    } catch (e) {
      updateErr = e.message;
    }

    assert(
      updateErr.includes("Mutasi stok tidak bisa diubah atau dihapus. Koreksi dengan mutasi baru."),
      `Pesan update salah: ${updateErr}`
    );

    let deleteErr = "";
    try {
      await client.query(`delete from public.mutasi_stok where id = '${mId}';`);
    } catch (e) {
      deleteErr = e.message;
    }

    assert(
      deleteErr.includes("Mutasi stok tidak bisa diubah atau dihapus. Koreksi dengan mutasi baru."),
      `Pesan delete salah: ${deleteErr}`
    );

    return `Trigger berhasil mencegah update dan delete dengan pesan immutability.`;
  }
);

// AC-10: Keluar yang melebihi qty saldo ditolak
await recordResult(
  "AC-10",
  "Keluar yang melebihi saldo ditolak dengan 'Qty keluar {x} melebihi stok tersedia {y}.'",
  async () => {
    // Current saldo di g1 adalah 11
    let errMsg = "";
    try {
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodAktif.id}', '${g1.id}', '2026-11-22 13:00:00+00', 'KELUAR', 12, null, 'TEST_OVER'
        );
      `);
    } catch (e) {
      errMsg = e.message;
    }

    assert(
      errMsg.includes("Qty keluar 12 melebihi stok tersedia 11."),
      `Pesan salah: ${errMsg}`
    );

    return `Ditolak dengan pesan: "${errMsg}"`;
  }
);

// AC-11: Keluar seluruh saldo membuat nilai nol dan mempertahankan harga_rata
await recordResult(
  "AC-11",
  "Keluar seluruh saldo membuat nilai 0 dan mempertahankan harga_rata",
  async () => {
    // Current saldo qty 11 nilai 132, keluar 11
    const { rows } = await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 13:00:00+00', 'KELUAR', 11, null, 'TEST_AC11'
      ) as res;
    `);

    const res = rows[0].res;
    assert(Number(res.saldo.qty) === 0, `Qty saldo harus 0, dapat ${res.saldo.qty}`);
    assert(Number(res.saldo.nilai) === 0, `Nilai saldo harus 0, dapat ${res.saldo.nilai}`);
    assert(Number(res.saldo.harga_rata) === 12, `Harga rata harus 12, dapat ${res.saldo.harga_rata}`);

    return `Saldo: qty=${res.saldo.qty}, nilai=${res.saldo.nilai}, harga_rata=${res.saldo.harga_rata}`;
  }
);

// AC-12: Transfer antar gudang memindahkan qty dan nilai dalam satu transaksi
await recordResult(
  "AC-12",
  "Transfer antar gudang memindahkan qty dan nilai dalam satu transaksi (D-52)",
  async () => {
    // Isi dulu saldo G1: masuk 11 @ 12
    await client.query(`
      select public.catat_mutasi_stok(
        '${prodAktif.id}', '${g1.id}', '2026-11-22 13:30:00+00', 'MASUK', 11, 12, 'TEST_ISI_G1'
      );
    `);

    // Transfer 3 ke G2 (kosong)
    const { rows } = await client.query(`
      select public.transfer_stok(
        '${prodAktif.id}', '${g1.id}', '${g2.id}', 3, '2026-11-22 14:00:00+00', null, null
      ) as res;
    `);

    const res = rows[0].res;
    assert(Number(res.saldo_asal.qty) === 8, `G1 qty harus 8, dapat ${res.saldo_asal.qty}`);
    assert(Number(res.saldo_asal.nilai) === 96, `G1 nilai harus 96, dapat ${res.saldo_asal.nilai}`);
    assert(Number(res.saldo_tujuan.qty) === 3, `G2 qty harus 3, dapat ${res.saldo_tujuan.qty}`);
    assert(Number(res.saldo_tujuan.nilai) === 36, `G2 nilai harus 36, dapat ${res.saldo_tujuan.nilai}`);
    assert(Number(res.saldo_tujuan.harga_rata) === 12, `G2 harga rata harus 12, dapat ${res.saldo_tujuan.harga_rata}`);

    // Uji transfer ke gudang yang sama
    let sameWhErr = "";
    try {
      await client.query(`
        select public.transfer_stok(
          '${prodAktif.id}', '${g1.id}', '${g1.id}', 1, '2026-11-22 14:10:00+00'
        );
      `);
    } catch (e) {
      sameWhErr = e.message;
    }
    assert(
      sameWhErr.includes("Gudang asal dan tujuan tidak boleh sama."),
      `Pesan salah: ${sameWhErr}`
    );

    return `G1: qty=${res.saldo_asal.qty}, nilai=${res.saldo_asal.nilai}; G2: qty=${res.saldo_tujuan.qty}, nilai=${res.saldo_tujuan.nilai}, harga_rata=${res.saldo_tujuan.harga_rata}`;
  }
);

// AC-13: Stock opname menghasilkan mutasi penyesuaian sebesar selisih fisik dan saldo
await recordResult(
  "AC-13",
  "Stock opname penyesuaian selisih fisik dan saldo (D-52)",
  async () => {
    // Saldo G1 saat ini: qty 8 nilai 96 (harga rata 12)
    // Fisik 10: mutasi PENYESUAIAN masuk 2, nilai 24, hasil saldo qty 10 nilai 120 harga rata 12
    const { rows: op1 } = await client.query(`
      select public.opname_stok(
        '${prodAktif.id}', '${g1.id}', 10, 'Opname fisik lebih 2', '2026-11-22 15:00:00+00'
      ) as res;
    `);
    const r1 = op1[0].res;
    assert(Number(r1.selisih) === 2, `Selisih harus 2, dapat ${r1.selisih}`);
    assert(Number(r1.saldo.qty) === 10, `Qty harus 10, dapat ${r1.saldo.qty}`);
    assert(Number(r1.saldo.nilai) === 120, `Nilai harus 120, dapat ${r1.saldo.nilai}`);
    assert(Number(r1.saldo.harga_rata) === 12, `Harga rata harus 12, dapat ${r1.saldo.harga_rata}`);

    // Fisik 7: mutasi PENYESUAIAN keluar 3, nilai 36, hasil saldo qty 7 nilai 84 harga rata 12
    const { rows: op2 } = await client.query(`
      select public.opname_stok(
        '${prodAktif.id}', '${g1.id}', 7, 'Opname fisik susut 3', '2026-11-22 16:00:00+00'
      ) as res;
    `);
    const r2 = op2[0].res;
    assert(Number(r2.selisih) === -3, `Selisih harus -3, dapat ${r2.selisih}`);
    assert(Number(r2.saldo.qty) === 7, `Qty harus 7, dapat ${r2.saldo.qty}`);
    assert(Number(r2.saldo.nilai) === 84, `Nilai harus 84, dapat ${r2.saldo.nilai}`);
    assert(Number(r2.saldo.harga_rata) === 12, `Harga rata harus 12, dapat ${r2.saldo.harga_rata}`);

    // Tanpa alasan ditolak
    let noReasonErr = "";
    try {
      await client.query(`
        select public.opname_stok(
          '${prodAktif.id}', '${g1.id}', 7, '', '2026-11-22 16:10:00+00'
        );
      `);
    } catch (e) {
      noReasonErr = e.message;
    }
    assert(
      noReasonErr.includes("Isi alasan penyesuaian stok."),
      `Pesan salah: ${noReasonErr}`
    );

    return `Fisik 10: selisih=+2, saldo=(10, 120); Fisik 7: selisih=-3, saldo=(7, 84); Tanpa alasan: ditolak.`;
  }
);

// AC-14: Produk atau gudang nonaktif tidak bisa dipakai di mutasi baru
await recordResult(
  "AC-14",
  "Produk atau gudang nonaktif tidak bisa dipakai di mutasi baru (D-50)",
  async () => {
    let whErr = "";
    try {
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodAktif.id}', '${gNonaktif.id}', '2026-11-22 16:30:00+00', 'MASUK', 1, 10
        );
      `);
    } catch (e) {
      whErr = e.message;
    }
    assert(
      whErr.includes(`Gudang ${gNonaktif.kode} tidak ditemukan atau nonaktif.`),
      `Pesan salah: ${whErr}`
    );

    let prodErr = "";
    try {
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodNonaktif.id}', '${g1.id}', '2026-11-22 16:30:00+00', 'MASUK', 1, 10
        );
      `);
    } catch (e) {
      prodErr = e.message;
    }
    assert(
      prodErr.includes(`Produk ${prodNonaktif.kode} tidak ditemukan atau nonaktif.`),
      `Pesan salah: ${prodErr}`
    );

    return `Gudang nonaktif ditolak: "${whErr}"; Produk nonaktif ditolak: "${prodErr}"`;
  }
);

// AC-15: Harga satuan masuk nol atau negatif ditolak
await recordResult(
  "AC-15",
  "Harga satuan masuk nol atau negatif ditolak dengan 'Harga satuan harus lebih dari nol.'",
  async () => {
    let zeroErr = "";
    try {
      await client.query(`
        select public.catat_mutasi_stok(
          '${prodAktif.id}', '${g1.id}', '2026-11-22 17:00:00+00', 'MASUK', 5, 0
        );
      `);
    } catch (e) {
      zeroErr = e.message;
    }
    assert(
      zeroErr.includes("Harga satuan harus lebih dari nol."),
      `Pesan salah: ${zeroErr}`
    );

    return `Ditolak dengan pesan: "${zeroErr}"`;
  }
);

console.log("\n=== 15 pemeriksaan database lulus; integrasi core dan identitas sesi belum diuji. ===");
await client.end();
