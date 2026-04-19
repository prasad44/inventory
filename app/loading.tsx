export default function RootLoading() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-muted"
    >
      <div className="h-full w-1/3 animate-pulse bg-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
