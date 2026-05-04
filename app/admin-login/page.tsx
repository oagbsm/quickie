import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin-login?error=1");
  }

  const cookieStore = await cookies();

  cookieStore.set("quickola_admin", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasError = params?.error === "1";
  const next = params?.next || "/admin";

  return (
    <main className="min-h-screen bg-[#fbfcfd] px-4 py-10 text-[#071638]">
      <div className="mx-auto mt-16 max-w-[420px] rounded-[24px] border border-[#e1e6ee] bg-white p-6 shadow-[0_18px_50px_rgba(7,22,56,0.08)]">
        <img
          src="/quickola/logo-mark.png"
          alt="Quickola"
          className="h-12 w-12 rounded-full object-contain"
        />

        <h1 className="mt-5 text-[30px] font-extrabold tracking-[-0.04em]">
          Admin login
        </h1>

        <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#657089]">
          Enter the admin password to access Quickola requests and businesses.
        </p>

        {hasError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] font-extrabold text-red-700">
            Wrong password.
          </p>
        ) : null}

        <form action={login} className="mt-5">
          <input type="hidden" name="next" value={next} />

          <label className="block">
            <span className="mb-2 block text-[13px] font-extrabold text-[#657089]">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              className="h-12 w-full rounded-xl border border-[#dfe5ee] bg-white px-4 text-[15px] font-bold text-[#071638] outline-none focus:border-[#08783f]"
            />
          </label>

          <button
            type="submit"
            className="mt-4 h-12 w-full rounded-xl bg-[#071638] px-5 text-[15px] font-extrabold text-white"
          >
            Open admin
          </button>
        </form>
      </div>
    </main>
  );
}