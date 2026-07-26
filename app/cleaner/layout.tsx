import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationMenu from "@/app/business/components/NotificationMenu";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");
  const { data: worker } = await supabase.from("workers").select("display_name").eq("user_id", user.id).maybeSingle();
  if (!worker) redirect("/business/dashboard");
  const { data: notifications } = await supabase.from("notifications")
    .select("id,title,body,href,read_at,created_at").eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false }).limit(20);
  return <div className="min-h-screen bg-[#f4f6f9] text-[#071638]">
    <header className="sticky top-0 z-30 border-b bg-[#071a3a] text-white"><div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4"><Link href="/cleaner/today" className="flex items-center gap-2 text-lg font-extrabold"><Image src="/quickola/logo-mark.png" alt="" width={32} height={32}/>Quickola</Link><div className="flex items-center gap-3"><NotificationMenu notifications={notifications || []}/><span className="hidden text-sm font-bold text-white/70 sm:inline">{worker.display_name}</span></div></div></header>
    <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6">{children}</main>
    <nav aria-label="Cleaner navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-white px-2 py-2 sm:static sm:mx-auto sm:mb-8 sm:max-w-4xl sm:rounded-xl sm:border">
      {[["Today","/cleaner/today"],["Upcoming","/cleaner/upcoming"],["Completed","/cleaner/completed"],["Profile","/cleaner/profile"]].map(([label,href]) => <Link key={href} href={href} className="flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-extrabold hover:bg-[#edf2f8] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20">{label}</Link>)}
    </nav>
  </div>;
}
