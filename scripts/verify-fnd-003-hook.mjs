import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { FND003_TEST_URL: url, FND003_TEST_DB_URL: dbUrl, FND003_TEST_ANON_KEY: anon, FND003_TEST_SERVICE_KEY: service } = process.env;
if (process.env.FND003_DISPOSABLE !== "1" || !url || !dbUrl || !anon || !service) throw new Error("Disposable local project URLs and keys are required.");
for (const value of [url, dbUrl]) {
  const target = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || ["54321", "54322"].includes(target.port)) throw new Error("Use a dedicated local project on non-default ports.");
}
const admin = createClient(url, service, { auth: { persistSession: false } });
const pub = createClient(url, anon, { auth: { persistSession: false } });
const db = new pg.Client({ connectionString: dbUrl });
await db.connect();
const suffix = randomBytes(8).toString("hex");
const password = randomBytes(20).toString("hex");
const email = `auth-hook-${suffix}@lionmesh.test`;
const checks = [];
function check(name, condition) { checks.push(condition); console.log(`${condition ? "PASS" : "FAIL"} ${name}`); }
try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const id = created.data.user.id;
  const login = await pub.auth.signInWithPassword({ email, password });
  check("active account receives session", !login.error && !!login.data.session);
  const token = login.data.session?.access_token;
  await db.query("update public.profiles set aktif=false where id=$1", [id]);
  const sessions = await db.query("select count(*)::int as count from auth.sessions where user_id=$1", [id]);
  check("deactivation deletes existing sessions", sessions.rows[0].count === 0);
  const staleClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const stale = await staleClient.from("profiles").select("id").eq("id", id);
  check("old token cannot read profile", !stale.error && stale.data.length === 0);
  const wrong = await pub.auth.signInWithPassword({ email, password: "wrong-password" });
  const missing = await pub.auth.signInWithPassword({ email: `missing-${email}`, password: "wrong-password" });
  check("inactive wrong password indistinguishable from missing account", wrong.error?.status === missing.error?.status && wrong.error?.code === missing.error?.code && wrong.error?.message === missing.error?.message);
  const inactive = await pub.auth.signInWithPassword({ email, password });
  check("inactive correct password cannot obtain token", !!inactive.error && !inactive.data.session);
  check("inactive login returns generic message and HTTP status", inactive.error?.status === missing.error?.status && inactive.error?.message === missing.error?.message);
  await db.query("update public.profiles set aktif=true where id=$1", [id]);
  const restored = await pub.auth.signInWithPassword({ email, password });
  check("reactivated account can log in", !restored.error && !!restored.data.session);
  const freshToken = restored.data.session.access_token;
  const sessionId = JSON.parse(Buffer.from(freshToken.split(".")[1], "base64url").toString()).session_id;
  await db.query("update auth.sessions set created_at=now()-interval '9 hours' where id=$1", [sessionId]);
  const expiredClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${freshToken}` } }, auth: { persistSession: false } });
  const expired = await expiredClient.from("profiles").select("id").eq("id", id);
  check("session older than eight hours cannot read profile", !expired.error && expired.data.length === 0);
  const refreshed = await pub.auth.refreshSession({ refresh_token: restored.data.session.refresh_token });
  check("session older than eight hours cannot refresh", !!refreshed.error && !refreshed.data.session);
  await db.query("update auth.users set banned_until='2030-01-01T00:00:00Z' where id=$1", [id]);
  await db.query("update public.profiles set aktif=false where id=$1", [id]);
  const ban = await db.query("select banned_until::text as value from auth.users where id=$1", [id]);
  check("independent administrative ban preserved", ban.rows[0].value.startsWith("2030-01-01"));
} finally { await db.end(); }
if (checks.some((x) => !x)) process.exitCode = 1;
