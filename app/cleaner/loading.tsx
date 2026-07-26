export default function Loading() {
  return (
    <div aria-label="Loading turnovers" aria-busy="true" className="animate-pulse">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="mt-6 grid gap-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-32 rounded-xl border bg-white" />
        ))}
      </div>
    </div>
  );
}
