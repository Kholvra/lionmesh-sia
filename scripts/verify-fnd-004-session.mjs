#!/usr/bin/env node
// Proves that document actors come from the Supabase session, not request data.

import { createServerClient } from "@supabase/ssr";
import pg from "pg";

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
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Only local endpoints are permitted.");
  }
  if (url.port === "54321" || url.port === "54322") {
    throw new Error("Do not run against the shared default Supabase project.");
  }
}

const db = new pg.Client({ connectionString: dbUrl });
await db.connect();
const jar = new Map();
const supabase = createServerClient(api, anon, {
  cookies: {
    getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
    setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
  },
});

function check(name, condition) {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) process.exitCode = 1;
}

try {
  let response = await fetch(`${app}/fnd004-session-probe`);
  check("anonymous request denied", response.status === 403);

  const login = await supabase.auth.signInWithPassword({
    email: "manajemen@lionmesh.test",
    password,
  });
  if (login.error) throw login.error;

  const cookieHeader = Array.from(jar, ([name, value]) => `${name}=${value}`).join("; ");
  response = await fetch(`${app}/fnd004-session-probe`, {
    headers: { cookie: cookieHeader },
  });
  const context = await response.json();
  check(
    "session context returns the authenticated actor",
    response.status === 200 &&
      context.ok === true &&
      context.actorId === login.data.user.id &&
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
    documentRows[0]?.pembuat_id === login.data.user.id &&
      historyRows[0]?.actor_id === login.data.user.id &&
      historyRows[0]?.aksi === "BUAT",
  );
} finally {
  await db.end();
}
