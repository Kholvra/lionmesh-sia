import { NextResponse } from "next/server";

import {
  bacaKonfigurasiEmail,
  getNotifikasiQueueContext,
  prosesAntreanEmail,
} from "@/core/notifikasi";

/**
 * Pemroses antrean email (PT-03/PT-07). Dipanggil penjadwal dengan token, bukan
 * oleh browser pengguna; tanpa token yang dikonfigurasi endpoint ini menolak.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.NOTIFIKASI_KIRIM_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        data: null,
        message: "Pemroses antrean email belum dikonfigurasi.",
        ok: false,
      },
      { status: 503 },
    );
  }

  if (request.headers.get("x-notifikasi-token") !== token) {
    return NextResponse.json(
      { data: null, message: "Token pemroses tidak sah.", ok: false },
      { status: 401 },
    );
  }

  const konteks = await getNotifikasiQueueContext();
  if (!konteks.ok) {
    return NextResponse.json(
      { data: null, message: konteks.message, ok: false },
      { status: 503 },
    );
  }

  const hasil = await prosesAntreanEmail(konteks.data.supabase, {
    basisUrl: bacaKonfigurasiEmail().basisUrl,
    batas: 20,
  });

  if (!hasil.ok) {
    return NextResponse.json(
      { data: null, message: hasil.message, ok: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: hasil.data, ok: true });
}
