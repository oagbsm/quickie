"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl rounded-xl border bg-white p-7">
      <p className="text-sm font-extrabold text-red-700">SOMETHING WENT WRONG</p>
      <h1 className="mt-2 text-2xl font-extrabold">We couldn’t load this part of your workspace.</h1>
      <p className="mt-3 text-[#657089]">Your saved records have not been changed. Check your connection and try again.</p>
      <button onClick={reset} className="mt-5 min-h-12 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">
        Try again
      </button>
    </main>
  );
}
