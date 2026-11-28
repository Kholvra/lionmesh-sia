// Shared assertion, failure, and reporting primitives for verification scripts.
export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function assertGagal(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

export function gagal(pesan, label) {
  console.error(`\n[${label}] ${pesan}\n`);
  process.exit(1);
}

export function gagalVerifikasi(pesan, label) {
  console.error(`\n[${label}] GAGAL: ${pesan}\n`);
  process.exit(1);
}

export function catatHasil(results, id, name, detail) {
  results.push({ detail, id, name });
  console.log(`[PASS] ${id}: ${name}`);
}

export async function expectError(run, expected, formatPesan) {
  let message = "";
  try {
    await run();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  if (!message.includes(expected)) {
    throw new Error(
      formatPesan
        ? formatPesan(message)
        : `Expected "${expected}", received "${message}"`,
    );
  }
  return message;
}

export function ringkasan(results) {
  console.log("\n=== Ringkasan ===");
  for (const result of results) {
    console.log(`${result.id}: PASS — ${result.detail}`);
  }
  console.log(`\n${results.length} pemeriksaan lulus.`);
}

// `gaya: "polos"` scripts report PASS <name>; bracket styles report [PASS] <id>: <name>.
export function buatLaporan({
  gaya = "kurung",
  sertakanDetailPass = true,
  stderrSaatGagal = false,
  keluarSaatGagal = false,
  lemparSaatGagal = false,
} = {}) {
  const hasil = [];
  let lulus = 0;
  let gagalCount = 0;

  function baris(status, a, b, c) {
    if (gaya === "polos") {
      const detail = b ?? "";
      return `${status} ${a}${detail ? ` — ${detail}` : ""}`;
    }
    const detail = c ?? "";
    return `[${status}] ${a}: ${b ?? ""}${detail ? ` — ${detail}` : ""}`;
  }

  function pass(a, b, c) {
    const detail = gaya === "polos" ? (b ?? "") : (c ?? "");
    console.log(baris("PASS", a, b, c));
    hasil.push({
      id: gaya === "polos" ? "" : a,
      nama: gaya === "polos" ? a : (b ?? ""),
      status: "PASS",
      detail,
    });
    lulus += 1;
    return detail;
  }

  function fail(a, b, c) {
    const detail = gaya === "polos" ? (b ?? "") : (c ?? "");
    const tulis = stderrSaatGagal ? console.error : console.log;
    tulis(baris("FAIL", a, b, c));
    hasil.push({
      id: gaya === "polos" ? "" : a,
      nama: gaya === "polos" ? a : (b ?? ""),
      status: "FAIL",
      detail,
    });
    gagalCount += 1;
    if (keluarSaatGagal) process.exitCode = 1;
    if (lemparSaatGagal) throw new Error(detail || "Pemeriksaan gagal");
  }

  function status(a, b, c) {
    if (b) pass(a, c);
    else fail(a, c);
  }

  async function record(id, nama, run, { lempar = false } = {}) {
    try {
      const detail = await run();
      pass(id, nama, sertakanDetailPass ? detail : "");
      return detail;
    } catch (error) {
      const pesan = error instanceof Error ? error.message : String(error);
      fail(id, nama, pesan);
      if (lempar) throw error;
      return null;
    }
  }

  async function periksa(id, nama, fn) {
    try {
      pass(id, nama, await fn());
    } catch (error) {
      fail(id, nama, error instanceof Error ? error.message : String(error));
    }
  }

  function sama(nama, kiri, kanan) {
    if (JSON.stringify(kiri) === JSON.stringify(kanan)) {
      pass(nama, JSON.stringify(kiri));
    } else {
      fail(nama, `${JSON.stringify(kiri)} != ${JSON.stringify(kanan)}`);
    }
  }

  return {
    hasil,
    pass,
    fail,
    status,
    record,
    periksa,
    sama,
    get jumlahLulus() {
      return lulus;
    },
    get jumlahGagal() {
      return gagalCount;
    },
  };
}
