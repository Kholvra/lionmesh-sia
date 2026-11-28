import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { authorizeKoreksi } from "@/modules/penggajian/periode/actions";
import { listPeriodeTerbaru } from "@/modules/penggajian/periode/queries";
import { labelStatusPeriode, rentangPeriode } from "@/modules/penggajian/periode/rules";
import { STATUS_PERIODE } from "@/modules/penggajian/periode/status";
import type { PeriodeGaji } from "@/modules/penggajian/periode/types";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { TidakBerwenang } from "@/modules/penggajian/shared/states";

const PESAN: Record<string, string> = {
  diotorisasi: "Otorisasi koreksi tersimpan. HR bisa membuka kembali periode dengan alasan.",
  dibuka: "Periode dibuka kembali. Perbaiki data lalu simpan rekap ulang, atau tunggu validasi ulang Supervisor.",
};

function KartuPeriode({ periode }: { periode: PeriodeGaji }) {
  const otorisasi = periode.otorisasi.filter((o) => o.dipakaiPada === null);
  return (
    <section className={ui.card}>
      <div className={ui.cardHeader}>
        <h2 className={ui.cardTitle}>{periode.nama} · {rentangPeriode(periode)}</h2>
        <StatusBadge status={periode.status} statuses={STATUS_PERIODE} />
      </div>
      {otorisasi.length > 0 ? (
        <p className={ui.cardHint}>Otorisasi koreksi dari {otorisasi[0].oleh}: {otorisasi[0].alasan}</p>
      ) : null}
      <ol className={ui.timeline}>
        {[...periode.riwayat].reverse().map((r) => (
          <li key={r.id}>
            <span>{r.dari ? `${labelStatusPeriode(r.dari as PeriodeGaji["status"])} → ` : ""}{labelStatusPeriode(r.ke as PeriodeGaji["status"])}</span>
            {r.alasan ? <span>Alasan: {r.alasan}</span> : null}
            <span className={ui.timelineMeta}>{r.oleh} · {formatWaktu(r.pada)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function KontenPeriode({ pesan }: { pesan?: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR" && sesi.peran !== "Manajemen") {
    return <TidakBerwenang pesan="Status periode penggajian dikelola HR; otorisasi koreksi diberikan Manajemen." />;
  }
  const periode = (await listPeriodeTerbaru());
  const tertutup = periode.filter((p) => p.status !== "TERBUKA").map((p) => ({ value: p.id, label: p.nama }));
  return (
    <div className={ui.stack}>
      {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
      {sesi.peran === "Manajemen" ? (
        <FormAksi
          aksi={authorizeKoreksi}
          isian={[
            { name: "periodeId", label: "Periode tertutup", jenis: "pilihan", wajib: true, pilihan: tertutup },
            { name: "alasan", label: "Alasan otorisasi", wajib: true },
          ]}
          judul="Beri otorisasi koreksi periode tertutup"
          kirimLabel="Beri otorisasi"
        />
      ) : (
        <div className={ui.stack}>
        <div>
          <Link className={ui.buttonPrimary} href="/penggajian/presensi/koreksi">Koreksi presensi periode tertutup</Link>
        </div>
        </div>
      )}
      {periode.map((p) => (
        <KartuPeriode key={p.id} periode={p} />
      ))}
    </div>
  );
}

export function PeriodeScreen({ pesan }: { pesan?: string }) {
  return (
    <>
      <PageHeader
        description="Periode tertutup hanya bisa dibuka kembali oleh HR dengan otorisasi Manajemen dan alasan."
        item="GJ-002 Mencatat presensi dan lembur"
        title="Periode penggajian"
      />
      <Suspense fallback={null}>
        <KontenPeriode pesan={pesan} />
      </Suspense>
    </>
  );
}
