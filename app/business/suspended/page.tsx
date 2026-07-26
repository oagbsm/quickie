import { signOut } from "../actions";

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-5">
      <section className="w-full max-w-lg rounded-xl border bg-white p-7">
        <p className="text-sm font-extrabold text-red-700">ACCOUNT SUSPENDED</p>
        <h1 className="mt-2 text-3xl font-extrabold">
          This workspace is temporarily unavailable.
        </h1>
        <p className="mt-4 leading-7 text-[#657089]">
          Contact Quickola support if you believe this restriction was applied
          in error.
        </p>
        <form action={signOut}>
          <button className="mt-6 min-h-12 rounded-lg border px-5 font-extrabold">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
