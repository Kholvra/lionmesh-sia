// Default endpoint of the local Supabase Docker stack.
export const DB_URL_DEFAULT =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
export const DB_URL = process.env.SUPABASE_DB_URL ?? DB_URL_DEFAULT;
