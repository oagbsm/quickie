"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "dashboard" | "jobs" | "bookings" | "providers" | "customers" | "payments" | "support" | "audit" | "settings";
const sections: Array<[string, Array<[string, string, IconName]>]> = [
  ["OPERATIONS", [["Overview", "/admin", "dashboard"], ["Jobs", "/admin/jobs", "jobs"], ["Bookings", "/admin/marketplace-bookings", "bookings"], ["Providers", "/admin/providers", "providers"], ["Customers", "/admin/customers", "customers"]]],
  ["FINANCE", [["Payments", "/admin/payments", "payments"]]],
  ["SUPPORT", [["Support", "/admin/support", "support"], ["Audit log", "/admin/audit", "audit"]]],
  ["SYSTEM", [["Settings", "/admin/settings", "settings"]]],
];

function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    jobs: <><path d="M5 7.5h14v12H5z" /><path d="M9 7.5V5h6v2.5M8 12h8M8 15.5h5" /></>,
    bookings: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 15l2 2 5-5" /></>,
    providers: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5M16 5.5a3 3 0 0 1 0 5.8M17 15c2.1.5 3.3 2.1 3.5 5" /></>,
    customers: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.7-3.4 3-5 7-5s6.3 1.6 7 5" /></>,
    payments: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    support: <><circle cx="12" cy="12" r="9" /><path d="M8.5 9a3.5 3.5 0 1 1 6.2 2.2c-1.2 1.2-2.7 1.6-2.7 3.3M12 18h.01" /></>,
    audit: <><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h4" /></>,
    settings: <><circle cx="12" cy="12" r="3.5" /><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4V19a2 2 0 0 1-4 0v-.1a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 11H1.5a2 2 0 0 1 0-4h.1A2 2 0 0 0 3 3.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2 0H9a2 2 0 0 1 4 0h-.2a2 2 0 0 0 3.4.8l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.4 7h.1a2 2 0 0 1 0 4h-.1a2 2 0 0 0-1 4Z" transform="translate(1.5 2) scale(.83)" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function AdminNav() {
  const path = usePathname();
  return <nav className="grid gap-4" aria-label="Admin navigation">
    {sections.map(([section, items]) => <div key={section}>
      <p className="mb-1.5 px-3 text-[10px] font-extrabold tracking-[.14em] text-white/40">{section}</p>
      <div className="grid gap-1">
        {items.map(([label, href, icon]) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`relative flex min-h-9 items-center gap-3 rounded-md px-3 text-[13px] font-bold transition ${active ? "bg-white/[.09] text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[#43d879]" : "text-white/70 hover:bg-white/[.06] hover:text-white"}`}><span className={active ? "text-[#72e39a]" : "text-white/55"}><Icon name={icon} /></span>{label}</Link>;
        })}
      </div>
    </div>)}
  </nav>;
}
