import Link from "next/link";
import Image from "next/image";
import { requireBusinessUser } from "@/lib/business/auth";
import { signOut } from "../actions";
import PortalNav from "../components/PortalNav";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, accountId } = await requireBusinessUser();
  const [{ data: member }, { data: account }] = await Promise.all([
    supabase
      .from("business_members")
      .select("full_name,role")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("business_accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle(),
  ]);
  const displayName =
    member?.full_name || account?.name || user.email || "Business account";
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#071638] lg:grid lg:grid-cols-[246px_1fr]">
      <aside className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(160deg,#061b40,#031a36)] text-white lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:px-7 lg:py-8">
          <Link
            href="/business/dashboard"
            className="flex items-center gap-3 text-xl font-extrabold tracking-[-.02em]"
            aria-label="Quickola business dashboard"
          >
            <Image
              src="/quickola/logo-mark.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            Quickola
          </Link>
          <form action={signOut} className="lg:hidden">
            <button className="min-h-11 rounded-lg px-3 text-sm font-bold text-white/72 hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>
        <div className="border-t border-white/10 p-2 lg:border-0 lg:px-4 lg:pt-10">
          <PortalNav />
        </div>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-white/10 p-5 lg:block">
          <p className="truncate text-sm font-bold">{displayName}</p>
          <p className="mt-1 truncate text-xs capitalize text-white/58">
            {member?.role?.replaceAll("_", " ") || "Business user"}
          </p>
          <form action={signOut}>
            <button className="mt-4 min-h-11 w-full rounded-lg border border-white/15 px-3 text-left text-sm font-bold text-white/72 hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-8 xl:p-10">{children}</main>
    </div>
  );
}
