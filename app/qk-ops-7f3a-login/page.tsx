import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/qk-ops-7f3a");

  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is missing in .env.local");
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect(`/qk-ops-7f3a-login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();

  cookieStore.set("quickola_admin", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(next.startsWith("/qk-ops-7f3a") ? next : "/qk-ops-7f3a");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasError = params?.error === "1";
  const next = params?.next || "/qk-ops-7f3a";

  return (
    <main className="min-h-screen bg-[#fbfcfd] px-4 py-10 text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto mt-20 max-w-[420px] rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_18px_50px_rgba(7,22,56,0.08)]">
        <div className="flex items-center gap-3">
          <img
            src="/quickola/logo-mark.png"
            alt="Quickola"
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#071638]">
              Ops login
            </h1>
            <p className="text-[13px] font-medium text-[#657089]">
              Quickola private dashboard
            </p>
          </div>
        </div>

        <p className="mt-6 text-[14px] font-medium leading-[1.5] text-[#657089]">
          Enter the password to access Quickola requests and businesses.
        </p>

        {hasError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] font-bold text-red-700">
            Wrong password. Try again.
          </p>
        ) : null}

        <form action={login} className="mt-5 space-y-4">
          <input type="hidden" name="next" value={next} />

          <label className="block">
            <span className="mb-2 block text-[13px] font-bold text-[#657089]">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              placeholder="Enter password"
              className="h-12 w-full rounded-xl border border-[#dfe5ee] bg-white px-4 text-[15px] font-semibold text-[#071638] outline-none focus:border-[#08783f]"
            />
          </label>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#071638] px-5 text-[15px] font-bold text-white"
          >
            Enter ops
          </button>
        </form>
      </section>
    </main>
  );
}