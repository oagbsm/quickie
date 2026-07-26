export default function Loading() {
  return (
    <div role="status" aria-label="Loading bookings" className="animate-pulse">
      <div className="h-9 w-40 rounded-lg bg-[#e2e7ee]" />
      <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#e2e7ee]" />
      <div className="mt-7 h-14 rounded-xl bg-white shadow-sm" />
      <div className="mt-7 grid gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-32 rounded-2xl border border-[#e2e7ee] bg-white"
          />
        ))}
      </div>
      <span className="sr-only">Loading bookings…</span>
    </div>
  );
}
