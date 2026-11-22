export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(message: string): Result<T> {
  return { ok: false, message };
}
