import { Suspense } from "react";

import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { createKaryawan, deactivateKaryawan, updateKaryawan } from "@/modules/penggajian/karyawan/actions";
import { KaryawanForm } from "@/modules/penggajian/karyawan/components/karyawan-form";
import { NonaktifForm } from "@/modules/penggajian/karyawan/components/nonaktif-form";
import { PATH_KARYAWAN, pathKaryawanDetail } from "@/modules/penggajian/karyawan/constants";
import { getDaftarAktif, getKaryawanUntukUbah } from "@/modules/penggajian/karyawan/queries";
import { aksesSesi } from "@/modules/penggajian/karyawan/sesi";
import { ui } from "@/modules/penggajian/ui/kelas";

function Memuat({ title }: { title: string }) {
  return <PageHeader description="Memuat formulir…" title={title} />;
}

async function TambahKonten() {
  const akses = await aksesSesi();
  const header = (
    <PageHeader
      description="Data harus unik dan setiap perubahan tercatat dengan pelaku dan waktunya."
      title="Tambah karyawan"
    />
  );
  if (!akses.bolehMengubah) return (<>{header}<ErrorState judul="Anda tidak punya akses ke data karyawan" teks="Data karyawan hanya bisa dibuka oleh HR, Accounting, dan Finance. Hubungi HR bila Anda membutuhkannya." variant="compact" /></>);

  return (
    <>
      {header}
      <KaryawanForm aksi={createKaryawan} batalHref={PATH_KARYAWAN} daftar={await getDaftarAktif()} />
    </>
  );
}

export function KaryawanTambahScreen() {
  return (
    <Suspense fallback={<Memuat title="Tambah karyawan" />}>
      <TambahKonten />
    </Suspense>
  );
}

async function UbahKonten({ id }: { id: string }) {
  const akses = await aksesSesi();
  if (!akses.bolehMengubah) {
    return (<><PageHeader title="Ubah data karyawan" /><ErrorState judul="Anda tidak punya akses ke data karyawan" teks="Data karyawan hanya bisa dibuka oleh HR, Accounting, dan Finance. Hubungi HR bila Anda membutuhkannya." variant="compact" /></>);
  }
  const karyawan = await getKaryawanUntukUbah(id, akses);
  if (!karyawan) {
    return (<><PageHeader title="Ubah data karyawan" /><EmptyState judul="Karyawan tidak ditemukan" teks="Data mungkin sudah dipindahkan atau tautannya salah." variant="compact" /></>);
  }

  return (
    <>
      <PageHeader
        description="NIK tetap. Perubahan gaji pokok dicatat sebagai entri baru di halaman detail."
        title={`Ubah data karyawan / ${karyawan.nama}`}
      />
      {karyawan.status === "NONAKTIF" ? (
        <Notice title="Karyawan nonaktif tidak bisa diubah." tone="warning" />
      ) : (
        <KaryawanForm
          aksi={updateKaryawan.bind(null, id)}
          batalHref={pathKaryawanDetail(id)}
          daftar={await getDaftarAktif()}
          karyawan={karyawan}
        />
      )}
    </>
  );
}

export function KaryawanUbahScreen({ id }: { id: string }) {
  return (
    <Suspense fallback={<Memuat title="Ubah data karyawan" />}>
      <UbahKonten id={id} />
    </Suspense>
  );
}

async function StatusKonten({ id }: { id: string }) {
  const akses = await aksesSesi();
  if (!akses.bolehMengubah) {
    return (<><PageHeader title="Nonaktifkan karyawan" /><ErrorState judul="Anda tidak punya akses ke data karyawan" teks="Data karyawan hanya bisa dibuka oleh HR, Accounting, dan Finance. Hubungi HR bila Anda membutuhkannya." variant="compact" /></>);
  }
  const karyawan = await getKaryawanUntukUbah(id, akses);
  if (!karyawan) {
    return (<><PageHeader title="Nonaktifkan karyawan" /><EmptyState judul="Karyawan tidak ditemukan" teks="Data mungkin sudah dipindahkan atau tautannya salah." variant="compact" /></>);
  }

  return (
    <>
      <PageHeader
        description="Nonaktif bukan hapus. Data, riwayat gaji, dan presensi tetap tersimpan."
        title={`Nonaktifkan karyawan / ${karyawan.nama}`}
      />
      <div className={ui.stack}>
        {karyawan.status === "NONAKTIF" ? (
          <Notice title="Karyawan ini sudah nonaktif." tone="info" />
        ) : (
          <>
            <NonaktifForm aksi={deactivateKaryawan.bind(null, id)} batalHref={pathKaryawanDetail(id)} nama={karyawan.nama} />
            <Notice title="Dampak perubahan" tone="info">
              <p>Karyawan nonaktif tidak bisa dipilih untuk dokumen baru, misalnya presensi.</p>
              <p>Gaji karyawan yang keluar di tengah periode dihitung prorata saat perhitungan gaji.</p>
            </Notice>
          </>
        )}
      </div>
    </>
  );
}

export function KaryawanStatusScreen({ id }: { id: string }) {
  return (
    <Suspense fallback={<Memuat title="Nonaktifkan karyawan" />}>
      <StatusKonten id={id} />
    </Suspense>
  );
}
