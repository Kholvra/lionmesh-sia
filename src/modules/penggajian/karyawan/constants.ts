export const PATH_KARYAWAN = "/penggajian/karyawan";

export const PATH_KARYAWAN_TAMBAH = `${PATH_KARYAWAN}/tambah`;

export function pathKaryawanDetail(id: string): string {
  return `${PATH_KARYAWAN}/${id}`;
}

export function pathKaryawanUbah(id: string): string {
  return `${pathKaryawanDetail(id)}/ubah`;
}

export function pathKaryawanStatus(id: string): string {
  return `${pathKaryawanDetail(id)}/status`;
}
