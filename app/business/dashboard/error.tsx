"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[#dfe5e9] bg-white p-8 text-center">
      <h1 className="text-2xl font-extrabold">
        We couldn’t load your dashboard
      </h1>
      <p className="mt-3 text-[#526078]">
        Your account data is safe. Try loading the dashboard again.
      </p>
      <button
        onClick={reset}
        className="mt-6 min-h-11 rounded-xl bg-[#071f49] px-5 font-bold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#2e68bb]/30"
      >
        Try again
      </button>
    </section>
  );
}
