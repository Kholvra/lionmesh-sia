"use server";

import { revalidatePath } from "next/cache";

import {
  batalkanDokumen,
  buatDokumen,
  getDokumen,
  pindahStatusDokumen,
} from "@/core/dokumen";
import { postJournal, reverseJournal } from "@/core/ledger";
import { requireIzin } from "@/lib/auth/server";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  hitungBarisFaktur,
  hitungJatuhTempo,
  hitungTotalFaktur,
} from "./calc";
import { PATH_FAKTUR, PATH_PIUTANG } from "./constants";
import { getTarifPpnUntukTanggal } from "./queries";
import { fakturFormSchema, isValidUuid, type FakturFormInput } from "./schema";

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

export async function createFakturAction(
  input: FakturFormInput,
): Promise<Result<{ id: string; nomor: string }>> {
  let profile;
  try {
    const sesi = await requireIzin("terbitkan_faktur");
    profile = sesi.profile;
  } catch {
    return fail("Anda tidak berwenang menerbitkan faktur.");
  }

  const parsed = fakturFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data faktur tidak valid.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  // AC-01: Pengiriman harus DIKIRIM atau DITERIMA
  const { data: pengiriman, error: sjErr } = await supabase
    .from("pengiriman")
    .select(
      `
      id, status, pesanan_id,
      pesanan:pesanan_id (id, pelanggan_id, termin_hari),
      pengiriman_item (
        id, pesanan_item_id, produk_id, qty::text,
        pesanan_item:pesanan_item_id (harga_satuan::text, diskon_persen::text)
      )
    `,
    )
    .eq("id", parsed.data.pengirimanId)
    .maybeSingle();

  if (sjErr || !pengiriman) return fail("Pengiriman tidak ditemukan.");

  if (pengiriman.status !== "DIKIRIM" && pengiriman.status !== "DITERIMA") {
    return fail("Faktur hanya dapat dibuat dari pengiriman yang sudah dikirim.");
  }

  // AC-02: Pastikan pengiriman belum punya faktur aktif
  const { data: existingFaktur } = await supabase
    .from("faktur")
    .select("id")
    .eq("pengiriman_id", parsed.data.pengirimanId)
    .neq("status", "DIBATALKAN")
    .maybeSingle();

  if (existingFaktur) {
    return fail("Pengiriman ini sudah memiliki faktur.");
  }

  // AC-03: Tarif PPN pada tanggal faktur
  const tarifPpn = await getTarifPpnUntukTanggal(
    supabase,
    parsed.data.tanggalFaktur,
  );
  if (tarifPpn === null) {
    return fail("Tarif PPN belum tersedia untuk tanggal ini.");
  }

  const pes = pengiriman.pesanan as unknown as Row | null;
  if (!pes) return fail("Pesanan asal tidak ditemukan.");

  const rawItems = (pengiriman.pengiriman_item ?? []) as unknown as Row[];
  if (rawItems.length === 0) {
    return fail("Pengiriman tidak memiliki rincian barang.");
  }

  const lineSpecs = rawItems.map((it) => {
    const pi = it.pesanan_item as Row | null;
    return {
      pengirimanItemId: String(it.id),
      pesananItemId: String(it.pesanan_item_id),
      produkId: String(it.produk_id),
      qty: Number(it.qty ?? 0),
      hargaSatuan: pi ? Number(pi.harga_satuan ?? 0) : 0,
      diskonPersen: pi ? Number(pi.diskon_persen ?? 0) : 0,
    };
  });

  const totals = hitungTotalFaktur(lineSpecs, tarifPpn);
  const jatuhTempo = hitungJatuhTempo(
    parsed.data.tanggalFaktur,
    parsed.data.terminHari,
  );

  const dokRes = await buatDokumen(supabase, {
    tipe: "FP",
    actorId: profile.id,
    nominal: totals.total.toFixed(2),
    tanggal: parsed.data.tanggalFaktur,
  });

  if (!dokRes.ok) return fail(dokRes.message);
  const dokumen = dokRes.data.dokumen;

  const { data: header, error: insertErr } = await supabase
    .from("faktur")
    .insert({
      dokumen_id: dokumen.id,
      nomor: dokumen.nomor,
      pengiriman_id: parsed.data.pengirimanId,
      pesanan_id: String(pengiriman.pesanan_id),
      pelanggan_id: String(pes.pelanggan_id),
      tanggal_faktur: parsed.data.tanggalFaktur,
      termin_hari: parsed.data.terminHari,
      jatuh_tempo: jatuhTempo,
      nomor_faktur_pajak: parsed.data.nomorFakturPajak?.trim() || null,
      dpp: totals.dpp,
      tarif_ppn: tarifPpn,
      ppn: totals.ppn,
      total: totals.total,
      sisa_piutang: 0,
      status: "DRAFT",
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id, nomor")
    .single();

  if (insertErr || !header) {
    return fail(insertErr?.message ?? "Gagal menyimpan draf faktur.");
  }

  const itemRows = lineSpecs.map((spec) => {
    const calc = hitungBarisFaktur(
      spec.qty,
      spec.hargaSatuan,
      spec.diskonPersen,
      tarifPpn,
    );
    return {
      faktur_id: header.id,
      pengiriman_item_id: spec.pengirimanItemId,
      pesanan_item_id: spec.pesananItemId,
      produk_id: spec.produkId,
      qty: spec.qty,
      harga_satuan: spec.hargaSatuan,
      diskon_persen: spec.diskonPersen,
      nilai_kotor: calc.nilaiKotor,
      nilai_diskon: calc.nilaiDiskon,
      dpp: calc.dpp,
      ppn: calc.ppn,
      total: calc.total,
    };
  });

  const { error: itemErr } = await supabase.from("faktur_item").insert(itemRows);
  if (itemErr) return fail("Gagal menyimpan rincian barang faktur.");

  revalidatePath(PATH_FAKTUR);
  return ok({ id: String(header.id), nomor: String(header.nomor) });
}

export async function terbitkanFakturAction(
  id: string,
  nomorFakturPajak: string,
): Promise<Result<{ status: string; message: string }>> {
  if (!isValidUuid(id)) return fail("ID faktur tidak valid.");

  let profile;
  try {
    const sesi = await requireIzin("terbitkan_faktur");
    profile = sesi.profile;
  } catch {
    return fail("Anda tidak berwenang menerbitkan faktur.");
  }

  // AC-10: Nomor faktur pajak wajib diisi (tanpa validasi format, AC-06)
  if (!nomorFakturPajak || !nomorFakturPajak.trim()) {
    return fail("Nomor faktur pajak wajib diisi sebelum faktur diterbitkan.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: faktur, error: fetchErr } = await supabase
    .from("faktur")
    .select(
      "id, dokumen_id, nomor, pesanan_id, tanggal_faktur, dpp::text, ppn::text, total::text, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !faktur) return fail("Faktur tidak ditemukan.");
  if (faktur.status !== "DRAFT") {
    return fail("Faktur ini sudah diproses dan tidak berstatus DRAFT.");
  }

  // AC-09: Cek apakah periode akuntansi terkunci
  const parts = String(faktur.tanggal_faktur).split("-").map(Number);
  const tahun = parts[0];
  const bulan = parts[1];

  const { data: periodeRow } = await supabase
    .from("periode_akuntansi")
    .select("status")
    .eq("tahun", tahun)
    .eq("bulan", bulan)
    .maybeSingle();

  if (periodeRow && periodeRow.status === "kunci") {
    const namaBulan = NAMA_BULAN[bulan - 1] ?? String(bulan);
    return fail(
      `Periode ${namaBulan} ${tahun} sudah ditutup. Faktur tidak dapat diterbitkan.`,
    );
  }

  const dppNum = Number(faktur.dpp ?? 0);
  const ppnNum = Number(faktur.ppn ?? 0);
  const totalNum = Number(faktur.total ?? 0);

  const barisJurnal = [
    {
      akunPeran: "piutang_usaha",
      debit: totalNum.toFixed(2),
      kredit: "0.00",
    },
    {
      akunPeran: "penjualan",
      debit: "0.00",
      kredit: dppNum.toFixed(2),
    },
  ];

  if (ppnNum > 0) {
    barisJurnal.push({
      akunPeran: "ppn_keluaran",
      debit: "0.00",
      kredit: ppnNum.toFixed(2),
    });
  }

  // AC-05: Bentuk jurnal via postJournal() (D-07, D-43)
  const journalRes = await postJournal(supabase, {
    tanggal: String(faktur.tanggal_faktur),
    sumberTipe: "FAKTUR",
    sumberId: id,
    sumberNomor: String(faktur.nomor),
    sumberPemicu: "TERBITKAN_FAKTUR",
    baris: barisJurnal,
    actorId: profile.id,
  });

  if (!journalRes.ok) {
    return fail(journalRes.message);
  }

  if (faktur.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(faktur.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      await pindahStatusDokumen(supabase, {
        dokumenId: String(faktur.dokumen_id),
        versi: dokRes.data.versi,
        statusTujuan: "DITERBITKAN",
        aksi: "TERBITKAN",
        actorId: profile.id,
      });
    }
  }

  await supabase
    .from("faktur")
    .update({
      status: "DITERBITKAN",
      nomor_faktur_pajak: nomorFakturPajak.trim(),
      sisa_piutang: totalNum,
      jurnal_id: journalRes.data.jurnalId,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // AC-14: Cek apakah seluruh pengiriman pesanan sudah difakturkan
  const pesananId = String(faktur.pesanan_id);
  const [{ data: pes }, { data: sjList }, { data: fakList }] = await Promise.all([
    supabase
      .from("pesanan")
      .select("id, dokumen_id, status")
      .eq("id", pesananId)
      .maybeSingle(),
    supabase
      .from("pengiriman")
      .select("id")
      .eq("pesanan_id", pesananId)
      .in("status", ["DIKIRIM", "DITERIMA"]),
    supabase
      .from("faktur")
      .select("pengiriman_id")
      .eq("pesanan_id", pesananId)
      .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS", "LUNAS"]),
  ]);

  if (pes && pes.status === "TERKIRIM" && sjList && fakList) {
    const invoicedIds = new Set(fakList.map((f) => String(f.pengiriman_id)));
    const allInvoiced = sjList.every((sj) => invoicedIds.has(String(sj.id)));

    if (allInvoiced && pes.dokumen_id) {
      const pesDokRes = await getDokumen(supabase, String(pes.dokumen_id));
      if (pesDokRes.ok && pesDokRes.data) {
        const transPes = await pindahStatusDokumen(supabase, {
          dokumenId: String(pes.dokumen_id),
          versi: pesDokRes.data.versi,
          statusTujuan: "DIFAKTURKAN",
          aksi: "FAKTURKAN",
          actorId: profile.id,
        });
        if (transPes.ok) {
          await supabase
            .from("pesanan")
            .update({
              status: "DIFAKTURKAN",
              updated_by: profile.id,
            })
            .eq("id", pesananId);
        }
      }
    }
  }

  revalidatePath(PATH_FAKTUR);
  revalidatePath(`${PATH_FAKTUR}/${faktur.nomor}`);
  revalidatePath(PATH_PIUTANG);
  return ok({
    status: "DITERBITKAN",
    message: `Faktur ${faktur.nomor} diterbitkan. Piutang dan jurnal berhasil dicatat.`,
  });
}

export async function batalkanFakturAction(
  id: string,
  alasan: string,
): Promise<Result<{ status: string }>> {
  if (!isValidUuid(id)) return fail("ID faktur tidak valid.");
  if (!alasan || !alasan.trim()) {
    return fail("Alasan pembatalan wajib diisi.");
  }

  let profile;
  try {
    const sesi = await requireIzin("terbitkan_faktur");
    profile = sesi.profile;
  } catch {
    return fail("Anda tidak berwenang membatalkan faktur.");
  }

  const supabase = createAdminClient();
  if (!supabase) return fail("Layanan basis data tidak tersedia.");

  const { data: faktur } = await supabase
    .from("faktur")
    .select(
      "id, dokumen_id, nomor, status, total::text, sisa_piutang::text, jurnal_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!faktur) return fail("Faktur tidak ditemukan.");

  if (faktur.status === "DIBATALKAN") {
    return fail("Faktur sudah dibatalkan.");
  }

  // AC-11: Faktur yang sudah berpembayaran tidak bisa dibatalkan
  const total = Number(faktur.total ?? 0);
  const sisa = Number(faktur.sisa_piutang ?? 0);
  if (
    faktur.status === "SEBAGIAN_LUNAS" ||
    faktur.status === "LUNAS" ||
    (faktur.status === "DITERBITKAN" && sisa < total - 0.01)
  ) {
    return fail(
      "Faktur yang sudah menerima pembayaran tidak dapat dibatalkan.",
    );
  }

  let jurnalPembalikId: string | null = null;

  // AC-12: Faktur DITERBITKAN tanpa pembayaran dibatalkan lewat jurnal pembalik
  if (faktur.status === "DITERBITKAN" && faktur.jurnal_id) {
    const today = new Date().toISOString().split("T")[0];
    const revRes = await reverseJournal(supabase, {
      jurnalId: String(faktur.jurnal_id),
      tanggal: today,
      sumberId: id,
      sumberNomor: String(faktur.nomor),
      sumberPemicu: "BATAL_FAKTUR",
      actorId: profile.id,
    });
    if (!revRes.ok) return fail(revRes.message);
    jurnalPembalikId = revRes.data.jurnalId;
  }

  if (faktur.dokumen_id) {
    const dokRes = await getDokumen(supabase, String(faktur.dokumen_id));
    if (dokRes.ok && dokRes.data) {
      const trans = await batalkanDokumen(supabase, {
        dokumenId: String(faktur.dokumen_id),
        versi: dokRes.data.versi,
        actorId: profile.id,
        alasan: alasan.trim(),
      });
      if (!trans.ok) return fail(trans.message);
    }
  }

  await supabase
    .from("faktur")
    .update({
      status: "DIBATALKAN",
      sisa_piutang: 0,
      alasan_batal: alasan.trim(),
      jurnal_pembalik_id: jurnalPembalikId,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(PATH_FAKTUR);
  revalidatePath(`${PATH_FAKTUR}/${faktur.nomor}`);
  revalidatePath(PATH_PIUTANG);
  return ok({ status: "DIBATALKAN" });
}
