export default function AppLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        padding: "var(--space-8)",
        color: "var(--text-secondary)",
        fontSize: "var(--font-size-body)",
      }}
    >
      Memuat…
    </div>
  );
}
