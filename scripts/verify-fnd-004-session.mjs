#!/usr/bin/env node
// Proves that document actors come from the Supabase session, not request data.

import pg from "pg";
import { buatLaporan } from "./lib/harness.mjs";
import { validasiLokal } from "./lib/local-host.mjs";
import { masukSesi } from "./lib/session-login.mjs";

const api = process.env.FND004_TEST_API_URL;
const app = process.env.FND004_TEST_APP_URL;
const anon = process.env.FND004_TEST_ANON_KEY;
const dbUrl = process.env.FND004_TEST_DB_URL;
const password = process.env.FND004_TEST_PASSWORD;

if (
  process.env.FND004_DISPOSABLE !== "1" ||
  !api ||
  !app ||
  !anon ||
  !dbUrl ||
  !password
) {
  throw new Error("Provide isolated local test URLs, keys, and FND004_DISPOSABLE=1.");
}

for (const value of [api, app, dbUrl]) {
  validasiLokal(value, "Only local endpoints are permitted.");
  if (new URL(value).port === "54321" || new URL(value).port === "54322") {
    throw new Error("Do not run against the shared default Supabase project.");
  }
}


const db = new pg.Client({ connectionString: dbUrl });
await db.connect();
const laporan = buatLaporan({ gaya: "polos", keluarSaatGagal: true });
const { status: check } = laporan;


try {
  let response = await fetch(`${app}/fnd004-session-probe`);
  check("anonymous request denied", response.status === 403);

  const login = await masukSesi({
    url: api,
    key: anon,
    email: "manajemen@lionmesh.test",
    password,
  });


  const cookieHeader = login.cookie;

  response = await fetch(`${app}/fnd004-session-probe`, {
    headers: { cookie: cookieHeader },
  });
  const context = await response.json();
  check(
    "session context returns the authenticated actor",
    response.status === 200 &&
      context.ok === true &&
      context.actorId === login.user.id &&
      context.peran === "Manajemen",
  );

  response = await fetch(`${app}/fnd004-session-probe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({ actorId: "00000000-0000-4000-8000-000000000000" }),
  });
  const created = await response.json();
  check("document creation through the session boundary succeeds", response.status === 200 && created.ok === true);

  const documentId = created.data.dokumen.id;
  const { rows: documentRows } = await db.query(
    "select pembuat_id from public.dokumen where id = $1",
    [documentId],
  );
  const { rows: historyRows } = await db.query(
    "select actor_id, aksi from public.riwayat_status where dokumen_id = $1 order by created_at, id",
    [documentId],
  );
  check(
    "forged request actor was ignored",
      context.actorId === login.user.id &&
      historyRows[0]?.actor_id === login.user.id &&
      historyRows[0]?.aksi === "BUAT",
  );
} finally {
  await db.end();
}
