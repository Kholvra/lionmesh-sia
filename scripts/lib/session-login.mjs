import { createServerClient } from "@supabase/ssr";

// One session login for SSR cookie-jar scripts and REST-token scripts.
// `attempts` > 1 keeps the retry loop used by the C-009/C-010 verifiers.
export async function masukSesi({
  url,
  key,
  email,
  password,
  attempts = 1,
  delayMs = 1000,
  mode = "ssr",
  pesanGagal,
}) {
  if (mode === "rest") {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(pesanGagal ?? `login ${email} gagal`);
    return { token: (await res.json()).access_token };
  }

  const jar = new Map();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (items) =>
        items.forEach(({ name, value }) => jar.set(name, value)),
    },
  });

  let terakhir;
  for (let percobaan = 0; percobaan < attempts; percobaan += 1) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      const cookie = [...jar]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
      return { client, cookie, user: data.user };
    }
    terakhir = error;
    if (percobaan + 1 < attempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    pesanGagal ?? `Gagal masuk sebagai ${email}: ${terakhir?.message}`,
  );
}
