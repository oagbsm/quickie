"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/work", label: "Jobs", match: (path: string) => path === "/work" || path.startsWith("/work/jobs/") },
  { href: "/work/offers", label: "My work", match: (path: string) => path === "/work/offers" },
  { href: "/work/messages", label: "Messages", match: (path: string) => path === "/work/messages" || path.startsWith("/work/messages/") },
  { href: "/work/payments", label: "Payments", match: (path: string) => path === "/work/payments" },
  { href: "/work/profile", label: "Profile", match: (path: string) => path === "/work/profile" },
];

export default function ProviderMobileBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname() || "";
  return <nav aria-label="Provider mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dbe1ea] bg-white/95 px-2 pt-1.5 shadow-[0_-4px_18px_rgba(6,27,63,.08)] backdrop-blur sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
    <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
      {items.map((item) => {
        const active = item.match(pathname);
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-black leading-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23a955]/30 ${active ? "bg-[#eef8f1] text-[#167d3c]" : "text-[#657089]"}`}>
          <ProviderNavIcon label={item.label} active={active} />
          <span>{item.label}</span>
          {item.label === "Messages" && unreadCount > 0 && <span aria-label={`${unreadCount} unread messages`} className="absolute right-[calc(50%-1.5rem)] top-1 min-w-4 rounded-full bg-[#159548] px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Link>;
      })}
    </div>
  </nav>;
}

function ProviderNavIcon({ label, active }: { label: string; active: boolean }) {
  const stroke = active ? "#167d3c" : "#657089";
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (label === "Jobs") return <svg {...common}><path d="M4 5h16v14H4z" /><path d="M8 5V3h8v2M8 10h8M8 14h5" /></svg>;
  if (label === "My work") return <svg {...common}><path d="M4 7h16v13H4z" /><path d="M9 7V5h6v2M8 12h8M8 16h5" /></svg>;
  if (label === "Messages") return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.2-.6L4 20l1.6-4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>;
  if (label === "Payments") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
}
