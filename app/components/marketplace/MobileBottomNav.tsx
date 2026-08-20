import Link from "next/link";
import type { ReactNode } from "react";

type MobileBottomNavProps = { active: "home" | "messages" | "my-jobs" };

export default function MobileBottomNav({ active }: MobileBottomNavProps) {
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e7ebef] bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-2px_10px_rgba(6,27,63,0.04)] backdrop-blur" aria-label="Mobile navigation"><div className="mx-auto grid max-w-md grid-cols-4 items-end"><MobileNavItem href="/" label="Home" active={active === "home"}><HomeIcon /></MobileNavItem><MobileNavItem href="/messages" label="Messages" active={active === "messages"}><MessageIcon /></MobileNavItem><MobileNavItem href="/#job-composer" label="Post a job" primary><PlusIcon /></MobileNavItem><MobileNavItem href="/my-jobs" label="My jobs" active={active === "my-jobs"}><JobsIcon /></MobileNavItem></div></nav>;
}

function MobileNavItem({ href, label, active, primary, children }: { href: string; label: string; active?: boolean; primary?: boolean; children: ReactNode }) {
  return <Link href={href} className={`flex min-h-16 flex-col items-center justify-end gap-1 text-[11px] font-black ${active ? "text-[#159548]" : "text-[#526078]"}`}><span className={`${primary ? "grid h-10 w-10 place-items-center rounded-full bg-[#23a955] text-white" : "h-7 w-7"}`}>{children}</span><span>{label}</span></Link>;
}

function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 7.8 7.8 0 0 1-3.6-.9L4 20l1.4-4.1A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" strokeLinecap="round" /></svg>; }
function JobsIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" strokeLinecap="round" /></svg>; }
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>; }
