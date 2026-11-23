import { randomUUID } from "node:crypto";
import { Client } from "pg";

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function createVerificationClient() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (process.env.FND004_DISPOSABLE !== "1" || !dbUrl) {
    throw new Error("Set FND004_DISPOSABLE=1 and SUPABASE_DB_URL to a disposable local database.");
  }

  const target = new URL(dbUrl);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) {
    throw new Error("FND-004 verification only permits local database endpoints.");
  }
  if (target.port === "54322") {
    throw new Error("Do not run FND-004 verification against the shared default Supabase project.");
  }
  const databaseName = decodeURIComponent(target.pathname.replace(/^\/+/, ""));
  if (!databaseName.startsWith("fnd004_test_")) {
    throw new Error("FND-004 verification requires a database named fnd004_test_*.");
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  return { client, dbUrl, suffix: randomUUID().slice(0, 8) };
}

export async function recordResult(results, id, name, run) {
  const detail = await run();
  results.push({ id, name, detail });
  console.log(`[PASS] ${id}: ${name}`);
}

export async function expectError(run, expectedMessage) {
  let message = "";
  try {
    await run();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assert(message.includes(expectedMessage), `Expected "${expectedMessage}", received "${message}"`);
  return message;
}

export async function createAccount(client, role, suffix) {
  const id = randomUUID();
  const email = `fnd004-${role.toLowerCase().replaceAll(" ", "-")}-${randomUUID().slice(0, 8)}-${suffix}@lionmesh.test`;
  await client.query(
    `insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
      extensions.crypt('fnd004-local-test', extensions.gen_salt('bf')),
      '2026-01-01 00:00:00+00', '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', $3::text), '2026-01-01 00:00:00+00',
      '2026-01-01 00:00:00+00', '', '', '', ''
    )`,
    [id, email, role],
  );
  await client.query("update public.profiles set peran = $1 where id = $2", [role, id]);
  return id;
}

export async function registerType(
  client,
  { tipe, initial, statuses, needsApproval = false, waiting = null, actor },
) {
  const { rows } = await client.query(
    "select public.daftarkan_jenis_dokumen($1, $2, $3, $4, $5, $6, $7) as result",
    [tipe, `Jenis uji ${tipe}`, initial, statuses, needsApproval, waiting, actor],
  );
  return rows[0].result;
}

export async function addRule(client, { tipe, level, role, min = "0", max = null, actor }) {
  await client.query(
    `insert into public.aturan_approval (
      tipe, level, peran, batas_bawah, batas_atas, created_by, updated_by
    ) values ($1, $2, $3, $4, $5, $6, $6)`,
    [tipe, level, role, min, max, actor],
  );
}

export async function createDocument(
  client,
  { tipe, actor, nominal = "1000.00", date = "2026-11-10" },
) {
  const { rows } = await client.query(
    "select public.buat_dokumen($1, $2, $3, $4) as result",
    [tipe, actor, nominal, date],
  );
  return rows[0].result;
}

export async function history(client, dokumenId) {
  const { rows } = await client.query(
    `select id, aksi, status_asal, status_tujuan, level, actor_id, siklus_approval, created_at
     from public.riwayat_status
     where dokumen_id = $1
     order by created_at, id`,
    [dokumenId],
  );
  return rows;
}

export function printSummary(results) {
  console.log("\n=== Ringkasan ===");
  for (const result of results) {
    console.log(`${result.id}: PASS — ${result.detail}`);
  }
  console.log(`\n${results.length} pemeriksaan lulus.`);
}
