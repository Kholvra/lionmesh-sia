"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createGudang,
  createKategoriProduk,
  createKonversiSatuan,
  createKurs,
  createMataUang,
  createProduk,
  createSatuan,
  setStatusGudang,
  setStatusKategoriProduk,
  setStatusMataUang,
  setStatusProduk,
  setStatusSatuan,
  updateGudang,
  updateKategoriProduk,
  updateKonversiSatuan,
  updateKurs,
  updateMataUang,
  updateProduk,
  updateSatuan,
  type EntitasMaster,
  type GudangInput,
  type KategoriProdukInput,
  type KonversiSatuanInput,
  type KursInput,
  type MataUangInput,
  type ProdukInput,
  type SatuanInput,
} from "@/core/master";
import { cekIzin, type AksiDomain } from "@/lib/auth/permissions";
import { getSesiUser } from "@/lib/auth/server";
import type { Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import {
  PATH_MASTER_GUDANG,
  PATH_MASTER_MATA_UANG,
  PATH_MASTER_PRODUK,
  PATH_MASTER_SATUAN,
} from "./constants";
import type { MasterActionState } from "./form-state";
import {
  isValidMasterId,
  parseGudangForm,
  parseKategoriProdukForm,
  parseKonversiSatuanForm,
  parseKursForm,
  parseMataUangForm,
  parseProdukForm,
  parseSatuanForm,
} from "./schema";

const IZIN_ENTITAS: Record<EntitasMaster, AksiDomain> = {
  produk: "kelola_data_produk",
  kategori_produk: "kelola_kategori_produk",
  gudang: "kelola_gudang",
  satuan: "kelola_satuan",
  mata_uang: "kelola_mata_uang",
};

const PATH_ENTITAS: Record<EntitasMaster, string> = {
  produk: PATH_MASTER_PRODUK,
  kategori_produk: PATH_MASTER_PRODUK,
  gudang: PATH_MASTER_GUDANG,
  satuan: PATH_MASTER_SATUAN,
  mata_uang: PATH_MASTER_MATA_UANG,
};

const LABEL_ENTITAS: Record<EntitasMaster, string> = {
  produk: "produk",
  kategori_produk: "kategori produk",
  gudang: "gudang",
  satuan: "satuan",
  mata_uang: "mata uang",
};

function cekEntitas(value: unknown): value is EntitasMaster {
  return (
    value === "produk" ||
    value === "kategori_produk" ||
    value === "gudang" ||
    value === "satuan" ||
    value === "mata_uang"
  );
}

/** PT-06: setiap master dikelola peran yang paling dekat dengan pemakainya. */
async function pastikanIzin(
  entitas: EntitasMaster,
): Promise<Result<{ peran: string }>> {
  const sesi = await getSesiUser();
  if (!sesi) {
    return { ok: false, message: "Sesi Anda sudah berakhir. Silakan masuk lagi." };
  }

  if (!cekIzin(sesi.profile.peran, IZIN_ENTITAS[entitas])) {
    return {
      ok: false,
      message: `Anda tidak punya izin mengubah master ${LABEL_ENTITAS[entitas]}.`,
    };
  }

  return { ok: true, data: { peran: sesi.profile.peran ?? "—" } };
}

type KonfigSimpan<TInput> = {
  entitas: EntitasMaster;
  label: string;
  path: string;
  parse: (formData: FormData) => {
    input: TInput | null;
    fieldErrors: Record<string, string>;
  };
  create: (client: SupabaseClient, input: TInput) => Promise<Result<{ id: string }>>;
  update: (
    client: SupabaseClient,
    id: string,
    input: TInput,
  ) => Promise<Result<{ id: string }>>;
  /** Baris baru langsung dipilih di layar; panel pendukung cukup memberi pesan. */
  pilihSetelahSimpan: boolean;
};

async function simpanMaster<TInput>(
  konfig: KonfigSimpan<TInput>,
  formData: FormData,
): Promise<MasterActionState> {
  const izin = await pastikanIzin(konfig.entitas);
  if (!izin.ok) {
    return { status: "error", message: izin.message };
  }

  const parsed = konfig.parse(formData);
  if (!parsed.input) {
    return {
      status: "error",
      message: `Periksa kembali data ${konfig.label.toLowerCase()}.`,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createClient();
  const id = formData.get("id");

  if (typeof id === "string" && id.length > 0) {
    if (!isValidMasterId(id)) {
      return { status: "error", message: `${konfig.label} tidak ditemukan.` };
    }

    const hasil = await konfig.update(supabase, id, parsed.input);
    if (!hasil.ok) {
      return { status: "error", message: hasil.message };
    }

    revalidatePath(konfig.path);
    return {
      status: "success",
      message: `Data ${konfig.label.toLowerCase()} berhasil diperbarui.`,
    };
  }

  const hasil = await konfig.create(supabase, parsed.input);
  if (!hasil.ok) {
    return { status: "error", message: hasil.message };
  }

  revalidatePath(konfig.path);

  if (konfig.pilihSetelahSimpan) {
    redirect(`${konfig.path}?id=${hasil.data.id}`);
  }

  return {
    status: "success",
    message: `Data ${konfig.label.toLowerCase()} berhasil disimpan.`,
  };
}

export async function simpanProdukAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<ProdukInput>(
    {
      entitas: "produk",
      label: "Produk",
      path: PATH_MASTER_PRODUK,
      parse: parseProdukForm,
      create: createProduk,
      update: updateProduk,
      pilihSetelahSimpan: true,
    },
    formData,
  );
}

export async function simpanKategoriProdukAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<KategoriProdukInput>(
    {
      entitas: "kategori_produk",
      label: "Kategori produk",
      path: PATH_MASTER_PRODUK,
      parse: parseKategoriProdukForm,
      create: createKategoriProduk,
      update: updateKategoriProduk,
      pilihSetelahSimpan: false,
    },
    formData,
  );
}

export async function simpanGudangAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<GudangInput>(
    {
      entitas: "gudang",
      label: "Gudang",
      path: PATH_MASTER_GUDANG,
      parse: parseGudangForm,
      create: createGudang,
      update: updateGudang,
      pilihSetelahSimpan: true,
    },
    formData,
  );
}

export async function simpanSatuanAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<SatuanInput>(
    {
      entitas: "satuan",
      label: "Satuan",
      path: PATH_MASTER_SATUAN,
      parse: parseSatuanForm,
      create: createSatuan,
      update: updateSatuan,
      pilihSetelahSimpan: true,
    },
    formData,
  );
}

export async function simpanKonversiSatuanAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<KonversiSatuanInput>(
    {
      entitas: "satuan",
      label: "Konversi satuan",
      path: PATH_MASTER_SATUAN,
      parse: parseKonversiSatuanForm,
      create: createKonversiSatuan,
      update: updateKonversiSatuan,
      pilihSetelahSimpan: false,
    },
    formData,
  );
}

export async function simpanMataUangAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<MataUangInput>(
    {
      entitas: "mata_uang",
      label: "Mata uang",
      path: PATH_MASTER_MATA_UANG,
      parse: parseMataUangForm,
      create: createMataUang,
      update: updateMataUang,
      pilihSetelahSimpan: true,
    },
    formData,
  );
}

export async function simpanKursAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;
  return simpanMaster<KursInput>(
    {
      entitas: "mata_uang",
      label: "Kurs",
      path: PATH_MASTER_MATA_UANG,
      parse: parseKursForm,
      create: createKurs,
      update: updateKurs,
      pilihSetelahSimpan: false,
    },
    formData,
  );
}

const STATUS_SERVICE: Record<
  EntitasMaster,
  (client: SupabaseClient, id: string, aktif: boolean) => Promise<Result<void>>
> = {
  produk: setStatusProduk,
  kategori_produk: setStatusKategoriProduk,
  gudang: setStatusGudang,
  satuan: setStatusSatuan,
  mata_uang: setStatusMataUang,
};

export async function ubahStatusMasterAction(
  prevState: MasterActionState,
  formData: FormData,
): Promise<MasterActionState> {
  void prevState;

  const entitas = formData.get("entitas");
  if (!cekEntitas(entitas)) {
    return { status: "error", message: "Jenis master tidak dikenal." };
  }

  const izin = await pastikanIzin(entitas);
  if (!izin.ok) {
    return { status: "error", message: izin.message };
  }

  const id = formData.get("id");
  if (!isValidMasterId(id)) {
    return { status: "error", message: "Entri master tidak ditemukan." };
  }

  const aktifValue = formData.get("aktif");
  if (aktifValue !== "true" && aktifValue !== "false") {
    return { status: "error", message: "Status master tidak valid." };
  }

  const supabase = await createClient();
  const hasil = await STATUS_SERVICE[entitas](supabase, id, aktifValue === "true");
  if (!hasil.ok) {
    return { status: "error", message: hasil.message };
  }

  revalidatePath(PATH_ENTITAS[entitas]);

  return {
    status: "success",
    message:
      aktifValue === "true"
        ? `Data ${LABEL_ENTITAS[entitas]} berhasil diaktifkan.`
        : `Data ${LABEL_ENTITAS[entitas]} berhasil dinonaktifkan.`,
  };
}
