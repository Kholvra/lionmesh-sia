"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        display: "grid",
        gap: "var(--space-3)",
        padding: "var(--space-8)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "var(--font-size-section)",
          lineHeight: "var(--line-height-section)",
        }}
      >
        Halaman gagal dimuat
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: "60ch",
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-body)",
        }}
      >
        Terjadi kesalahan saat memuat halaman ini. Coba muat ulang; bila tetap
        gagal, hubungi administrator sistem.
      </p>
      <button
        onClick={reset}
        style={{
          justifySelf: "start",
          minHeight: "var(--control-height)",
          paddingInline: "var(--space-4)",
          border: 0,
          borderRadius: "var(--radius-md)",
          background: "var(--brand-500)",
          color: "var(--text-on-brand)",
          fontWeight: 600,
          cursor: "pointer",
        }}
        type="button"
      >
        Coba lagi
      </button>
      {error.digest ? (
        <p
          style={{
            margin: 0,
            color: "var(--text-muted)",
            fontSize: "var(--font-size-caption)",
          }}
        >
          Kode kesalahan: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
