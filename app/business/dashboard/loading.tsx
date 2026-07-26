export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading business dashboard"
      className="mx-auto max-w-[1320px] animate-pulse"
    >
      <div className="h-10 w-72 max-w-full rounded-lg bg-[#e2e7ee]" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#e2e7ee]" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-40 rounded-xl border border-[#e2e7ee] bg-white"
          />
        ))}
      </div>
      <div className="mt-6 h-48 rounded-xl border border-[#e2e7ee] bg-white" />
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
