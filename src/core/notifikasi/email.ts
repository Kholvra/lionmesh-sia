import { fail, ok, type Result } from "@/lib/result";

export interface PesanEmail {
  ke: string;
  subjek: string;
  teks: string;
}

export type PengirimEmail = (pesan: PesanEmail) => Promise<Result<void>>;

export interface KonfigurasiEmail {
  /** Endpoint penyedia email. Satu adaptor untuk seluruh aplikasi (PT-03). */
  url: string | null;
  apiKey: string | null;
  dari: string;
  /** Basis URL aplikasi untuk tautan absolut di email. */
  basisUrl: string | null;
}

const PENGIRIM_DEFAULT = "no-reply@lionmesh.local";
const BATAS_WAKTU_MS = 10_000;

function bersihkan(value: string | undefined): string | null {
  const teks = value?.trim();
  return teks && teks.length > 0 ? teks : null;
}

export function bacaKonfigurasiEmail(
  env: NodeJS.ProcessEnv = process.env,
): KonfigurasiEmail {
  return {
    apiKey: bersihkan(env.EMAIL_API_KEY),
    basisUrl: bersihkan(env.APP_URL),
    dari: bersihkan(env.EMAIL_FROM) ?? PENGIRIM_DEFAULT,
    url: bersihkan(env.EMAIL_API_URL),
  };
}

/**
 * Adaptor tunggal kanal email (PT-03, `[USULAN-AGEN]`). Vendor dipilih lewat
 * `EMAIL_API_URL`; modul tidak pernah memanggil kanal ini langsung (D-25).
 */
export function buatPengirimEmail(
  konfigurasi: KonfigurasiEmail = bacaKonfigurasiEmail(),
): PengirimEmail {
  return async (pesan) => {
    if (!konfigurasi.url) {
      return fail("Penyedia email belum dikonfigurasi.");
    }

    try {
      const respons = await fetch(konfigurasi.url, {
        body: JSON.stringify({
          from: konfigurasi.dari,
          subject: pesan.subjek,
          text: pesan.teks,
          to: pesan.ke,
        }),
        headers: {
          "content-type": "application/json",
          ...(konfigurasi.apiKey
            ? { authorization: `Bearer ${konfigurasi.apiKey}` }
            : {}),
        },
        method: "POST",
        signal: AbortSignal.timeout(BATAS_WAKTU_MS),
      });

      if (!respons.ok) {
        return fail(
          `Penyedia email menolak pengiriman (HTTP ${respons.status}).`,
        );
      }

      return ok(undefined);
    } catch (error) {
      const pesan_error =
        error instanceof Error ? error.message : "Koneksi penyedia email gagal.";
      return fail(`Penyedia email tidak dapat dihubungi: ${pesan_error}`);
    }
  };
}
