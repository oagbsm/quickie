import Link from "next/link";
import Image from "next/image";
import { requireBusinessUser } from "@/lib/business/auth";
import { signOut } from "../actions";
import PortalNav from "../components/PortalNav";
import NotificationMenu from "../components/NotificationMenu";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, accountId } = await requireBusinessUser();
  const [{ data: member }, { data: account }, { data: notifications }] = await Promise.all([
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
    supabase.from("notifications").select("id,title,body,href,read_at,created_at")
      .eq("recipient_user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const displayName =
    member?.full_name || account?.name || user.email || "Business account";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "B";
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#071638] lg:grid lg:grid-cols-[236px_1fr]">
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
          <div className="flex items-center gap-2 lg:hidden"><NotificationMenu notifications={notifications || []}/><span className="text-sm font-bold text-white/60">Operations</span></div>
        </div>
        <details className="group border-t border-white/10 lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-bold">
            Menu <span aria-hidden="true" className="group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-white/10 p-3">
            <PortalNav />
            <form action={signOut}><button className="mt-2 min-h-11 w-full rounded-lg px-4 text-left text-sm font-bold text-white/72 hover:bg-white/10">Sign out</button></form>
          </div>
        </details>
        <div className="hidden border-t border-white/10 p-2 lg:block lg:border-0 lg:px-4 lg:pt-10">
          <PortalNav />
        </div>
        <div className="absolute inset-x-0 bottom-0 hidden min-w-0 border-t border-white/10 p-5 lg:block">
          <div className="mb-4 flex justify-end"><NotificationMenu notifications={notifications || []}/></div>
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#25ae5c] text-sm font-extrabold text-white"
              aria-hidden="true"
            >
              {displayInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{displayName}</p>
              <p className="mt-1 truncate text-xs capitalize text-white/58">
                {member?.role?.replaceAll("_", " ") || "Business user"}
              </p>
            </div>
          </div>
          <form action={signOut}>
            <button className="mt-4 inline-flex min-h-11 w-full items-center rounded-lg border border-white/15 px-3 text-left text-sm font-bold text-white/72 hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-8 xl:p-10">{children}</main>
    </div>
  );
}
