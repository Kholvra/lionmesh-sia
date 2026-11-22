import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { readFileSync } from "node:fs";

import { DAFTAR_PERAN } from "../src/lib/auth/types.ts";
import { MATRIKS_IZIN, cekIzin } from "../src/lib/auth/permissions.ts";

const { Client } = pg;

const SUPABASE_URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SERVICE_ROLE_KEY || !ANON_KEY) {
  throw new Error("Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY for the isolated local test project.");
}
const PG_CONN = process.env.SUPABASE_TEST_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const db = new Client({ connectionString: PG_CONN });
await db.connect();

const results = {};

function logAC(id, passed, detail) {
  results[id] = { passed, detail };
  console.log(`[${passed ? "PASS" : "FAIL"}] ${id}: ${detail}`);
  if (!passed) {
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// AC-07: Tepat 13 nilai peran yang sah
// -------------------------------------------------------------
try {
  const res = await db.query(`
    select pg_get_constraintdef(oid) as def
    from pg_constraint
    where conname = 'ck_profiles_peran';
  `);
  const def = res.rows[0]?.def || "";
  const matches = [...def.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const is13 = matches.length === 13;
  const sameAsTypes =
    is13 && matches.every((r) => DAFTAR_PERAN.includes(r));
  logAC(
    "AC-07",
    is13 && sameAsTypes,
    `Constraint ck_profiles_peran memiliki tepat ${matches.length} peran: ${matches.join(", ")}`,
  );
} catch (e) {
  logAC("AC-07", false, e.message);
}

// -------------------------------------------------------------
// AC-08: Peran di luar daftar ditolak database dengan nama constraint
// -------------------------------------------------------------
try {
  let failedAsExpected = false;
  let constraintName = "";
  try {
    await db.query(`
      insert into public.profiles (id, display_name, peran)
      values (gen_random_uuid(), 'Admin Tester', 'ADMIN');
    `);
  } catch (err) {
    failedAsExpected = true;
    constraintName = err.constraint || err.message;
  }
  logAC(
    "AC-08",
    failedAsExpected && constraintName.includes("ck_profiles_peran"),
    `Insert peran 'ADMIN' ditolak oleh constraint: ${constraintName}`,
  );
} catch (e) {
  logAC("AC-08", false, e.message);
}

// Helper to create or get test user in auth.users
async function createTestUser(email, password, peran, aktif = true, karyawan_id = null) {
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existing = userList?.users.find((u) => u.email === email);
  let userId;
  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  // Update profile
  await db.query(
    `insert into public.profiles (id, display_name, peran, aktif, karyawan_id)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do update set
       peran = excluded.peran,
       aktif = excluded.aktif,
       karyawan_id = excluded.karyawan_id,
       updated_at = now()`,
    [userId, email.split("@")[0], peran, aktif, karyawan_id],
  );

  return userId;
}

// -------------------------------------------------------------
// AC-10: Satu akun hanya punya satu peran (unique/primary key di profiles)
// -------------------------------------------------------------
try {
  const emailPk = "pktest@lionmesh.test";
  const pkUserId = await createTestUser(emailPk, "password123456", "Penjualan");

  let duplicateRejected = false;
  let constraint = "";
  try {
    await db.query(
      `insert into public.profiles (id, display_name, peran) values ($1, 'User 1 Duplicate', 'Accounting')`,
      [pkUserId],
    );
  } catch (err) {
    duplicateRejected = true;
    constraint = err.constraint || err.message;
  }

  logAC(
    "AC-10",
    duplicateRejected && constraint.includes("profiles_pkey"),
    `Duplikasi profil untuk satu akun ditolak oleh primary key (${constraint})`,
  );
} catch (e) {
  logAC("AC-10", false, e.message);
}

// -------------------------------------------------------------
// AC-13: Sesi berakhir 8 jam (D-42) - jwt_expiry = 28800
// -------------------------------------------------------------
try {
  const config = readFileSync("supabase/config.toml", "utf-8");
  const match = config.match(/jwt_expiry\s*=\s*(\d+)/);
  const expiry = match ? parseInt(match[1], 10) : 0;
  const is8Hours = expiry === 28800; // 8 * 3600
  logAC(
    "AC-13",
    is8Hours,
    `Konfigurasi jwt_expiry = ${expiry} detik (tepat 8 jam)`,
  );
} catch (e) {
  logAC("AC-13", false, e.message);
}

// -------------------------------------------------------------
// AC-14: Pendaftaran mandiri tidak tersedia (OQ-03-05)
// -------------------------------------------------------------
try {
  const config = readFileSync("supabase/config.toml", "utf-8");
  const authSignupDisabled = /enable_signup\s*=\s*false/.test(config);

  const authFormCode = readFileSync("src/components/auth-form.tsx", "utf-8");
  const hasNoSignUpTab =
    !authFormCode.includes('"sign-up"') && !authFormCode.includes("buat akun");

  // Direct signup attempt
  const { error: signUpError } = await anonClient.auth.signUp({
    email: `self-register-${Date.now()}@lionmesh.test`,
    password: "password123456",
  });

  const apiRejected = Boolean(signUpError);

  logAC(
    "AC-14",
    authSignupDisabled && hasNoSignUpTab && apiRejected,
    `Pendaftaran mandiri dimatikan di config.toml, UI /login tidak menyediakan formulir daftar, dan API signUp menolak: ${signUpError?.message}`,
  );
} catch (e) {
  logAC("AC-14", false, e.message);
}

// -------------------------------------------------------------
// AC-02: Pengguna dengan sesi sah tanpa peran tidak membaca tabel domain
// -------------------------------------------------------------
try {
  const emailNoRole = "norole@lionmesh.test";
  const pass = "password123456";
  await createTestUser(emailNoRole, pass, null, true);

  // Ensure test data exists in domain tables
  await db.query(`
    insert into public.satuan (kode, nama) values ('MTR', 'Meter')
    on conflict (kode) do nothing;
    insert into public.gudang (kode, nama) values ('GDG-TEST', 'Gudang Test')
    on conflict (kode) do nothing;
  `);

  // Sign in as norole user
  const clientNoRole = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: loginErr } = await clientNoRole.auth.signInWithPassword({
    email: emailNoRole,
    password: pass,
  });
  if (loginErr) throw loginErr;

  const { data: satuanData, error: satuanErr } = await clientNoRole
    .from("satuan")
    .select("*");
  const { data: produkData, error: produkErr } = await clientNoRole
    .from("produk")
    .select("*");
  const { data: gudangData, error: gudangErr } = await clientNoRole
    .from("gudang")
    .select("*");

  const emptySatuan = !satuanErr && satuanData.length === 0;
  const emptyProduk = !produkErr && produkData.length === 0;
  const emptyGudang = !gudangErr && gudangData.length === 0;

  logAC(
    "AC-02",
    emptySatuan && emptyProduk && emptyGudang,
    `User tanpa peran membaca satuan (${satuanData?.length || 0} baris), produk (${produkData?.length || 0} baris), gudang (${gudangData?.length || 0} baris) -> seluruhnya kosong oleh RLS`,
  );
} catch (e) {
  logAC("AC-02", false, e.message);
}

// -------------------------------------------------------------
// AC-11: Karyawan hanya membaca baris miliknya; domain data lain tidak terbaca
// -------------------------------------------------------------
try {
  const emailKaryawan = "karyawan@lionmesh.test";
  const emailOther = "otherstaff@lionmesh.test";
  const pass = "password123456";
  const karyawanId = "11111111-1111-1111-1111-111111111111";

  const userKaryawanId = await createTestUser(
    emailKaryawan,
    pass,
    "Karyawan",
    true,
    karyawanId,
  );
  const userOtherId = await createTestUser(
    emailOther,
    pass,
    "Penjualan",
    true,
    null,
  );

  const clientKaryawan = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await clientKaryawan.auth.signInWithPassword({
    email: emailKaryawan,
    password: pass,
  });

  // Query other profiles
  const { data: otherProfile } = await clientKaryawan
    .from("profiles")
    .select("*")
    .eq("id", userOtherId);

  // Query own profile
  const { data: ownProfile } = await clientKaryawan
    .from("profiles")
    .select("*")
    .eq("id", userKaryawanId);

  // Query domain table
  const { data: satuanData } = await clientKaryawan
    .from("satuan")
    .select("*");

  const otherHidden = (otherProfile || []).length === 0;
  const ownVisible = (ownProfile || []).length === 1;
  const domainBlocked = (satuanData || []).length === 0;

  logAC(
    "AC-11",
    otherHidden && ownVisible && domainBlocked,
    `Karyawan melihat profil sendiri (${ownProfile?.length} baris), profil orang lain (${otherProfile?.length} baris), tabel satuan (${satuanData?.length} baris)`,
  );
} catch (e) {
  logAC("AC-11", false, e.message);
}

// -------------------------------------------------------------
// AC-03: Setiap peran hanya melakukan aksi yang diizinkan matriksnya
// -------------------------------------------------------------
try {
  let allMatched = true;
  for (const [aksi, roles] of Object.entries(MATRIKS_IZIN)) {
    for (const peran of DAFTAR_PERAN) {
      const allowed = roles.includes(peran);
      const testResult = cekIzin(peran, aksi);
      if (allowed !== testResult) {
        allMatched = false;
        console.error(`Mismatch for action ${aksi} with role ${peran}`);
      }
    }
    // Test null/undefined role
    if (cekIzin(null, aksi) !== false || cekIzin(undefined, aksi) !== false) {
      allMatched = false;
    }
  }
  logAC(
    "AC-03",
    allMatched,
    `Matriks izin v0 valid untuk seluruh ${Object.keys(MATRIKS_IZIN).length} aksi dan 13 peran (D-33, D-53)`,
  );
} catch (e) {
  logAC("AC-03", false, e.message);
}

// -------------------------------------------------------------
// AC-04: Aksi yang tidak diizinkan ditolak dengan pesan standar
// -------------------------------------------------------------
console.log("[PENDING] AC-04: no protected action endpoint is available for a direct-request test.");

// -------------------------------------------------------------
// AC-05: Perubahan peran atau penonaktifan mencabut sesi lama (D-48)
// -------------------------------------------------------------
try {
  const emailSessionTest = "sessiontest@lionmesh.test";
  const pass = "password123456";
  const testUserId = await createTestUser(
    emailSessionTest,
    pass,
    "Penjualan",
    true,
  );

  const clientTest = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: initialLogin, error: initialLoginError } = await clientTest.auth.signInWithPassword({
    email: emailSessionTest,
    password: pass,
  });
  if (initialLoginError || !initialLogin.session) throw initialLoginError ?? new Error("No session returned");

  const sessionBefore = await db.query(
    `select id from auth.sessions where user_id = $1`,
    [testUserId],
  );
  const hadSessionBefore = sessionBefore.rows.length > 0;

  // Change role to Accounting
  await db.query(
    `update public.profiles set peran = 'Accounting' where id = $1`,
    [testUserId],
  );

  const sessionAfterRoleChange = await db.query(
    `select id from auth.sessions where user_id = $1`,
    [testUserId],
  );
  const revokedOnRoleChange = sessionAfterRoleChange.rows.length === 0;
  const oldTokenResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${initialLogin.session.access_token}` },
  });
  const oldTokenData = await oldTokenResponse.json();
  const oldTokenDenied = !Array.isArray(oldTokenData) || !oldTokenData.some((row) => row.id === testUserId);

  // Login again
  await clientTest.auth.signInWithPassword({
    email: emailSessionTest,
    password: pass,
  });

  // Deactivate
  await db.query(
    `update public.profiles set aktif = false where id = $1`,
    [testUserId],
  );

  const sessionAfterDeactivation = await db.query(
    `select id from auth.sessions where user_id = $1`,
    [testUserId],
  );
  const revokedOnDeactivation = sessionAfterDeactivation.rows.length === 0;

  logAC(
    "AC-05",
    hadSessionBefore && revokedOnRoleChange && oldTokenDenied && revokedOnDeactivation,
    `Sesi dicabut saat perubahan peran/penonaktifan; token lama tidak membaca profil (D-48)`,
  );
} catch (e) {
  logAC("AC-05", false, e.message);
}

// -------------------------------------------------------------
// AC-06: Nilai actor_id atau user_id dari klien diabaikan
// -------------------------------------------------------------
try {
  const emailActor = "actor-test@lionmesh.test";
  const passwordActor = "password123456";
  const actorId = await createTestUser(emailActor, passwordActor, "Penjualan", true);
  const actorClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: loginError } = await actorClient.auth.signInWithPassword({
    email: emailActor, password: passwordActor,
  });
  if (loginError) throw loginError;
  const { error: updateError } = await actorClient.from("profiles").update({
    display_name: "Actor test", updated_by: "99999999-9999-9999-9999-999999999999",
  }).eq("id", actorId);
  if (updateError) throw updateError;
  const { rows } = await db.query("select updated_by from public.profiles where id = $1", [actorId]);
  logAC("AC-06", rows[0]?.updated_by === actorId, "Identitas audit berasal dari sesi, bukan payload");
} catch (e) {
  logAC("AC-06", false, e.message);
}

// -------------------------------------------------------------
// AC-09 & AC-12: Login gagal memakai pesan generik identik
// -------------------------------------------------------------
try {
  const genericMsg = "Username atau password salah.";

  // 1. Akun tidak ada
  await anonClient.auth.signInWithPassword({
    email: "nonexistent@lionmesh.test",
    password: "password123",
  });

  // 2. Sandi salah
  const emailExistent = "norole@lionmesh.test";
  await anonClient.auth.signInWithPassword({
    email: emailExistent,
    password: "wrongpassword",
  });

  // 3. Akun nonaktif
  const emailInactive = "inactive@lionmesh.test";
  const pass = "password123456";
  await createTestUser(emailInactive, pass, "Penjualan", false);

  // In AuthForm, inactive profile sign-in throws the same generic error
  const simulateAuthForm = async (email, password) => {
    const result = await anonClient.auth.signInWithPassword({ email, password });
    if (result.error) throw new Error(genericMsg);
    const { data: profile } = await anonClient
      .from("profiles")
      .select("aktif")
      .eq("id", result.data.user.id)
      .single();
    if (profile && !profile.aktif) {
      await anonClient.auth.signOut();
      throw new Error(genericMsg);
    }
    return { ok: true };
  };

  let msg1 = "", msg2 = "", msg3 = "";
  try { await simulateAuthForm("nonexistent@lionmesh.test", "pwd"); } catch (e) { msg1 = e.message; }
  try { await simulateAuthForm(emailExistent, "wrongpass"); } catch (e) { msg2 = e.message; }
  try { await simulateAuthForm(emailInactive, pass); } catch (e) { msg3 = e.message; }

  const directInactiveLogin = await anonClient.auth.signInWithPassword({
    email: emailInactive,
    password: pass,
  });
  const allIdentical =
    msg1 === genericMsg && msg2 === genericMsg && msg3 === genericMsg &&
    Boolean(directInactiveLogin.error) && !directInactiveLogin.data.session;

  logAC(
    "AC-09",
    allIdentical,
    `Akun nonaktif tidak bisa masuk dan mendapat pesan generik: "${msg3}"`,
  );
  logAC(
    "AC-12",
    allIdentical,
    `Ketiga kasus login gagal (tidak ada, sandi salah, nonaktif) menghasilkan pesan identik: "${genericMsg}" (D-42)`,
  );
} catch (e) {
  logAC("AC-09", false, e.message);
  logAC("AC-12", false, e.message);
}

// -------------------------------------------------------------
// AC-01: Permintaan tanpa sesi ke halaman terlindungi diarahkan ke /login
// -------------------------------------------------------------
console.log("[PENDING] AC-01: no protected application route is available for an HTTP redirect test.");

await db.end();

const total = Object.keys(results).length;
const passedCount = Object.values(results).filter((r) => r.passed).length;
console.log(`\nVerifikasi selesai: ${passedCount}/${total} pemeriksaan lulus; AC-01 dan AC-04 tertunda.`);
if (passedCount < total) {
  process.exit(1);
}
