import Image from "next/image";
import Link from "next/link";
import NotificationMenu from "@/app/business/components/NotificationMenu";
import { requireCleanerUser } from "@/lib/cleaner/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { supabase, user, displayName } = await requireCleanerUser();
  const { data: notifications } = await supabase.from("notifications").select("id,title,body,href,read_at,created_at").eq("recipient_user_id", user.id).order("created_at", { ascending: false }).limit(20);
  return <div className="min-h-screen bg-[#f4f6f9] text-[#071638]">
    <header className="sticky top-0 z-30 border-b bg-[#071a3a] text-white"><div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4"><Link href="/cleaner/today" className="flex items-center gap-2 text-lg font-extrabold"><Image src="/quickola/logo-mark.png" alt="" width={32} height={32}/>Quickola</Link><div className="flex items-center gap-3"><NotificationMenu notifications={notifications || []}/><span className="hidden text-sm font-bold text-white/70 sm:inline">{displayName}</span></div></div></header>
    <main className="mx-auto max-w-4xl px-4 py-5 pb-24 sm:px-6 sm:pb-8">{children}</main>
  </div>;
}
