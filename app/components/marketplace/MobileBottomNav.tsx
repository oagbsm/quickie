import Link from "next/link";
import type { ReactNode } from "react";

type MobileBottomNavProps = { active?: "home" | "messages" | "my-jobs" | "account" };

export default async function MobileBottomNav({ active }: MobileBottomNavProps) {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const { getMarketplaceUnreadMessageCount } = await import("@/lib/marketplace/message-read-state");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const unreadCount = user ? await getMarketplaceUnreadMessageCount(user.id, "customer") : 0;
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e7ebef] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-2px_10px_rgba(6,27,63,0.04)] backdrop-blur" aria-label="Customer navigation"><div className="mx-auto grid max-w-md grid-cols-5 items-end"><MobileNavItem href="/home" label="Home" active={active === "home"}><HomeIcon /></MobileNavItem><MobileNavItem href="/my-jobs" label="My jobs" active={active === "my-jobs"}><JobsIcon /></MobileNavItem><MobileNavItem href="/#job-composer" label="Post" primary><PlusIcon /></MobileNavItem><MobileNavItem href="/messages" label="Messages" active={active === "messages"} unreadCount={unreadCount}><MessageIcon /></MobileNavItem><MobileNavItem href="/account" label="Account" active={active === "account"}><AccountIcon /></MobileNavItem></div></nav>;
}

function MobileNavItem({ href, label, active, primary, unreadCount = 0, children }: { href: string; label: string; active?: boolean; primary?: boolean; unreadCount?: number; children: ReactNode }) {
  return <Link href={href} className={`flex min-h-16 flex-col items-center justify-end gap-1 pb-1.5 text-[11px] font-black ${active || primary ? "text-[#159548]" : "text-[#526078]"}`}><span className={`${primary ? "grid h-[30px] w-[30px] place-items-center rounded-full bg-[#23a955] text-white" : "relative h-7 w-7"}`}>{children}{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#159548] px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}</span><span>{label}</span></Link>;
}

function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 7.8 7.8 0 0 1-3.6-.9L4 20l1.4-4.1A7.5 7.5 0 1 1 20 11.5Z" /></svg>; }
function JobsIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" strokeLinecap="round" /></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>; }
function AccountIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.9-3.3 3.4-5 7.5-5s6.6 1.7 7.5 5" /></svg>; }
