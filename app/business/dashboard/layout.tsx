import Link from "next/link";
import Image from "next/image";
import { requireBusinessUser } from "@/lib/business/auth";
import { signOut } from "../actions";
import PortalNav from "../components/PortalNav";
import { formatDisplayName } from "@/lib/display-name";
import MobilePortalShell from "../components/MobilePortalShell";
import "../portal.css";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, accountId } = await requireBusinessUser();
  const [{ data: member }, { data: account }, { data: notifications }] =
    await Promise.all([
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
      supabase
        .from("notifications")
        .select("id,title,body,href,read_at,created_at")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
  const displayName =
    formatDisplayName(member?.full_name || account?.name) ||
    user.email ||
    "Business account";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "B";
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#071638] lg:grid lg:grid-cols-[216px_1fr]">
      <MobilePortalShell notifications={notifications || []} displayName={displayName} />
      <aside className="sticky top-0 z-40 hidden bg-[linear-gradient(165deg,#061d46,#021a38)] text-white lg:flex lg:h-screen lg:min-h-0 lg:flex-col">
        <div className="px-5 pt-6">
          <Link
            href="/business/dashboard"
            className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-.02em]"
            aria-label="Quickola business dashboard"
          >
            <Image
              src="/quickola/logo-mark.png"
              alt=""
              width={36}
              height={36}
              priority
            />
            Quickola
          </Link>
          <p className="ml-[46px] mt-1 max-w-[125px] text-[10px] font-semibold leading-4 text-white/62">Managed cleaning for STR properties</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          <PortalNav />
        </div>
        <div className="min-w-0 shrink-0 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2d67b2] text-sm font-extrabold text-white"
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
            <button className="mt-4 inline-flex min-h-11 w-full items-center rounded-lg border border-white/12 px-3 text-left text-sm font-bold text-white/80 hover:bg-white/10">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-8">{children}</main>
    </div>
  );
}
