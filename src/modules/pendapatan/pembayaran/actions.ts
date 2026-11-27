"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanDokumen,
  buatDokumen,
  getDokumen,
  pindahStatusDokumen,
} from "@/core/dokumen";
import { postJournal, reverseJournal } from "@/core/ledger";
import { requireIzin, requireSesi } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  alokasiFifoPembayaran,
  hitungStatusFakturSetelahAlokasi,
  round2,
} from "./calc";
import { PATH_PEMBAYARAN } from "./constants";
import {
  isValidUuid,
  pembayaranFormSchema,
  type PembayaranFormInput,
} from "./schema";

type Row = Record<string, unknown>;

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

async function isPeriodeTerkunci(
  supabase: ReturnType<typeof createAdminClient>,
  tanggal: string,
): Promise<string | null> {
  if (!supabase) return null;
  const parts = tanggal.split("-").map(Number);
  const tahun = parts[0];
  const bulan = parts[1];

  const { data } = await supabase
    .from("periode_akuntansi")
    .select("status")
    .eq("tahun", tahun)
    .eq("bulan", bulan)
    .maybeSingle();

  if (data && data.status === "kunci") {
    const namaBulan = NAMA_BULAN[bulan - 1] ?? String(bulan);
    return `Periode ${namaBulan} ${tahun} sudah ditutup. Penerimaan tidak dapat dicatat.`;
  }
  return null;
}

export async function createPembayaranAction(
  input: PembayaranFormInput,
): Promise<Result<{ id: string; nomor: string }>> {
  let profile;
  try {
    const sesi = await requireIzin("catat_pembayaran_piutang");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const parsed = pembayaranFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Data penerimaan tidak valid.",
    );
  }

  const nominal = round2(Number(parsed.data.nominalStr.replace(",", ".")));

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  // AC-09: Cek periode terkunci
  const lockMsg = await isPeriodeTerkunci(supabase, parsed.data.tanggal);
  if (lockMsg) return fail(lockMsg);

  // Cek tagihan terbuka pelanggan
  const { data: openFakturs } = await supabase
    .from("faktur")
    .select("id, sisa_piutang::text")
    .eq("pelanggan_id", parsed.data.pelangganId)
    .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS"])
    .gt("sisa_piutang", 0);

  if (!openFakturs || openFakturs.length === 0) {
    return fail("Pelanggan ini tidak memiliki tagihan terbuka.");
  }

  const totalTagihan = round2(
    openFakturs.reduce((acc, f) => acc + Number(f.sisa_piutang ?? 0), 0),
  );

  // AC-04: Tolak kelebihan bayar
  if (nominal > totalTagihan) {
    return fail(
      "Nominal pembayaran melebihi total tagihan terbuka pelanggan. Kelebihan bayar belum didukung.",
    );
  }

  const dokRes = await buatDokumen(supabase, {
    tipe: "BKM",
    actorId: profile.id,
    nominal: nominal.toFixed(2),
    tanggal: parsed.data.tanggal,
  });

  if (!dokRes.ok) return fail(dokRes.message);
  const dokumen = dokRes.data.dokumen;

  const { data: header, error: insertErr } = await supabase
    .from("pembayaran")
    .insert({
      dokumen_id: dokumen.id,
      nomor: dokumen.nomor,
      pelanggan_id: parsed.data.pelangganId,
      tanggal: parsed.data.tanggal,
      nominal,
      metode: parsed.data.metode,
      nomor_referensi: parsed.data.nomorReferensi || null,
      status: "DICATAT",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, nomor")
    .single();

  if (insertErr || !header) {
    return fail(insertErr?.message ?? "Gagal mencatat penerimaan pembayaran.");
  }

  revalidatePath(PATH_PEMBAYARAN);
  return ok({ id: String(header.id), nomor: String(header.nomor) });
}

export async function verifikasiPembayaranAction(
  id: string,
): Promise<Result<{ status: string; message: string }>> {
  if (!isValidUuid(id)) return fail("ID penerimaan tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("verifikasi_pembayaran_piutang");
    profile = sesi.profile;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err.message : "Akses ditolak.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pembayaran, error: fetchErr } = await supabase
    .from("pembayaran")
    .select(
      "id, dokumen_id, nomor, pelanggan_id, tanggal, nominal::text, status, created_by",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !pembayaran) return fail("Penerimaan tidak ditemukan.");

  if (pembayaran.status !== "DICATAT") {
    return fail("Penerimaan ini tidak dalam status yang bisa diverifikasi.");
  }

  // AC-11: Pemisahan tugas
  if (pembayaran.created_by === profile.id) {
    return fail(
      "Pencatat penerimaan tidak dapat memverifikasi penerimaannya sendiri.",
    );
  }

  // AC-09: Cek periode terkunci
  const lockMsg = await isPeriodeTerkunci(supabase, String(pembayaran.tanggal));
  if (lockMsg) return fail(lockMsg);

  const nominal = Number(pembayaran.nominal ?? 0);

  // Ambil faktur terbuka pelanggan yang sama, diurutkan tertua dulu (AC-03, AC-05)
  const { data: openFakturs } = await supabase
    .from("faktur")
    .select(
      "id, dokumen_id, pesanan_id, tanggal_faktur, total::text, sisa_piutang::text, status",
    )
    .eq("pelanggan_id", String(pembayaran.pelanggan_id))
    .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS"])
    .gt("sisa_piutang", 0)
    .order("tanggal_faktur", { ascending: true });

  const candidates = (openFakturs ?? []).map((f) => ({
    id: String(f.id),
    tanggalFaktur: String(f.tanggal_faktur),
    sisaPiutang: Number(f.sisa_piutang ?? 0),
  }));

  const fifo = alokasiFifoPembayaran(nominal, candidates);
  if (fifo.totalAllocated < nominal - 0.01) {
    return fail(
      "Nominal pembayaran melebihi total tagihan terbuka pelanggan. Kelebihan bayar belum didukung.",
    );
  }

  // AC-06: Posting jurnal kas masuk via postJournal()
  const journalRes = await postJournal(supabase, {
    tanggal: String(pembayaran.tanggal),
    sumberTipe: "PENERIMAAN",
    sumberId: id,
    sumberNomor: String(pembayaran.nomor),
    sumberPemicu: "VERIFIKASI_PEMBAYARAN",
    baris: [
      {
        akunPeran: "kas_bank",
        debit: nominal.toFixed(2),
        kredit: "0.00",
      },
      {
        akunPeran: "piutang_usaha",
        debit: "0.00",
        kredit: nominal.toFixed(2),
      },
    ],
    actorId: profile.id,
  });

  if (!journalRes.ok) return fail(journalRes.message);

  // Simpan alokasi & perbarui sisa_piutang + status faktur
  const fakturMap = new Map<string, Row>();
  for (const f of openFakturs ?? []) {
    fakturMap.set(String(f.id), f as unknown as Row);
  }

  const touchedPesananIds = new Set<string>();

  for (const alloc of fifo.allocations) {
    await supabase.from("pembayaran_alokasi").insert({
      pembayaran_id: id,
      faktur_id: alloc.fakturId,
      nominal: alloc.nominal,
    });

    const fRow = fakturMap.get(alloc.fakturId);
    if (fRow) {
      const totalFak = Number(fRow.total ?? 0);
      const sisaLama = Number(fRow.sisa_piutang ?? 0);
      const sisaBaru = Math.max(0, round2(sisaLama - alloc.nominal));
      const statusBaru = hitungStatusFakturSetelahAlokasi(totalFak, sisaBaru);

      await supabase
        .from("faktur")
        .update({
          sisa_piutang: sisaBaru,
          status: statusBaru,
          updated_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alloc.fakturId);

      if (fRow.dokumen_id && statusBaru !== fRow.status) {
        const fDokRes = await getDokumen(supabase, String(fRow.dokumen_id));
        if (fDokRes.ok && fDokRes.data) {
          await pindahStatusDokumen(supabase, {
            dokumenId: String(fRow.dokumen_id),
            versi: fDokRes.data.versi,
            statusTujuan: statusBaru,
            aksi: "BAYAR",
            actorId: profile.id,
            alasan: `Alokasi penerimaan ${pembayaran.nomor}`,
          });
        }
      }

      if (statusBaru === "LUNAS" && fRow.pesanan_id) {
        touchedPesananIds.add(String(fRow.pesanan_id));
      }
    }
  }

  // AC-14: Cek apakah pesanan menjadi SELESAI jika seluruh fakturnya LUNAS
  for (const pesananId of touchedPesananIds) {
    const [{ data: pes }, { data: fakPes }] = await Promise.all([
      supabase
        .from("pesanan")
        .select("id, dokumen_id, status")
        .eq("id", pesananId)
        .maybeSingle(),
      supabase
        .from("faktur")
        .select("status")
        .eq("pesanan_id", pesananId)
        .neq("status", "DIBATALKAN"),
    ]);

    if (
      pes &&
      pes.status === "DIFAKTURKAN" &&
      fakPes &&
      fakPes.length > 0 &&
      fakPes.every((f) => f.status === "LUNAS")
    ) {
      if (pes.dokumen_id) {
        const pDokRes = await getDokumen(supabase, String(pes.dokumen_id));
        if (pDokRes.ok && pDokRes.data) {
          const transPes = await pindahStatusDokumen(supabase, {
            dokumenId: String(pes.dokumen_id),
            versi: pDokRes.data.versi,
            statusTujuan: "SELESAI",
            aksi: "SELESAI",
            actorId: profile.id,
          });
          if (transPes.ok) {
            await supabase
              .from("pesanan")
              .update({
                status: "SELESAI",
                updated_by: profile.id,
              })
              .eq("id", pesananId);
          }
        }
      }
    }
  }

  // AC-08: Catat TERVERIFIKASI pada dokumen BKM
  if (pembayaran.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(pembayaran.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      await pindahStatusDokumen(supabase, {
        dokumenId: String(pembayaran.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "TERVERIFIKASI",
        aksi: "VERIFIKASI",
        actorId: profile.id,
      });
    }
  }

  await supabase
    .from("pembayaran")
    .update({
      status: "TERVERIFIKASI",
      jurnal_id: journalRes.data.jurnalId,
      diverifikasi_oleh: profile.id,
      diverifikasi_at: new Date().toISOString(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(PATH_PEMBAYARAN);
  revalidatePath(`${PATH_PEMBAYARAN}/${pembayaran.nomor}`);
  revalidatePath("/pendapatan/faktur");
  revalidatePath("/pendapatan/piutang");
  return ok({
    status: "TERVERIFIKASI",
    message: `Penerimaan ${pembayaran.nomor} diverifikasi. Jurnal kas dan alokasi piutang tercatat.`,
  });
}

export async function batalkanPembayaranAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID penerimaan tidak valid.");
  if (!alasan || !alasan.trim()) {
    return fail("Alasan pembatalan wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireSesi();
    profile = sesi.profile;
  } catch {
    return fail("Sesi Anda sudah berakhir.");
  }

  if (profile.peran !== "Finance" && profile.peran !== "Accounting") {
    return fail("Anda tidak berwenang membatalkan penerimaan ini.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: pembayaran } = await supabase
    .from("pembayaran")
    .select("id, dokumen_id, nomor, status, jurnal_id")
    .eq("id", id)
    .maybeSingle();

  if (!pembayaran) return fail("Penerimaan tidak ditemukan.");
  if (pembayaran.status === "DIBATALKAN") {
    return fail("Penerimaan sudah dibatalkan.");
  }

  let jurnalPembalikId: string | null = null;

  if (pembayaran.status === "TERVERIFIKASI") {
    if (profile.peran !== "Accounting") {
      return fail(
        "Hanya Accounting yang dapat membatalkan penerimaan terverifikasi.",
      );
    }

    // AC-12: Jurnal pembalik & pelepasan alokasi
    if (pembayaran.jurnal_id) {
      const today = new Date().toISOString().split("T")[0];
      const revRes = await reverseJournal(supabase, {
        jurnalId: String(pembayaran.jurnal_id),
        tanggal: today,
        sumberId: id,
        sumberNomor: String(pembayaran.nomor),
        sumberPemicu: "BATAL_PEMBAYARAN",
        actorId: profile.id,
      });
      if (!revRes.ok) return fail(revRes.message);
      jurnalPembalikId = revRes.data.jurnalId;
    }

    const { data: allocRows } = await supabase
      .from("pembayaran_alokasi")
      .select("id, faktur_id, nominal::text")
      .eq("pembayaran_id", id);

    for (const a of allocRows ?? []) {
      const { data: f } = await supabase
        .from("faktur")
        .select("id, dokumen_id, total::text, sisa_piutang::text, status")
        .eq("id", String(a.faktur_id))
        .maybeSingle();

      if (f) {
        const totalFak = Number(f.total ?? 0);
        const sisaBaru = Math.min(
          totalFak,
          round2(Number(f.sisa_piutang ?? 0) + Number(a.nominal ?? 0)),
        );
        const statusBaru = hitungStatusFakturSetelahAlokasi(totalFak, sisaBaru);

        await supabase
          .from("faktur")
          .update({
            sisa_piutang: sisaBaru,
            status: statusBaru,
            updated_by: profile.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", f.id);
      }
    }
  }

  if (pembayaran.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(pembayaran.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trans = await batalkanDokumen(supabase, {
        dokumenId: String(pembayaran.dokumen_id),
        versi: dokRes.data.versi,
        actorId: profile.id,
        alasan: alasan.trim(),
      });
      if (!trans.ok) return fail(trans.message);
    }
  }

  await supabase
    .from("pembayaran")
    .update({
      status: "DIBATALKAN",
      alasan_batal: alasan.trim(),
      jurnal_pembalik_id: jurnalPembalikId,
      dibatalkan_oleh: profile.id,
      dibatalkan_at: new Date().toISOString(),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(PATH_PEMBAYARAN);
  revalidatePath(`${PATH_PEMBAYARAN}/${pembayaran.nomor}`);
  revalidatePath("/pendapatan/faktur");
  revalidatePath("/pendapatan/piutang");
  return ok({ status: "DIBATALKAN" });
}
