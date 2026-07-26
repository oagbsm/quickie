export default function Loading() {
  return (
    <div role="status" aria-label="Loading properties" className="animate-pulse">
      <div className="h-9 w-44 rounded-lg bg-[#e2e7ee]" />
      <div className="mt-3 h-4 w-64 max-w-full rounded bg-[#e2e7ee]" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-36 rounded-2xl border border-[#e2e7ee] bg-white"
          />
        ))}
      </div>
      <span className="sr-only">Loading properties…</span>
    </div>
  );
}
