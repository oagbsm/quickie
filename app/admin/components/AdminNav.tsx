"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections: Array<[string, Array<[string, string, string]>]> = [
  ["OPERATIONS", [["Overview", "/admin", "▦"], ["Jobs", "/admin/jobs", "▤"], ["Bookings", "/admin/marketplace-bookings", "▣"], ["Providers", "/admin/providers", "♧"], ["Customers", "/admin/customers", "♙"]]],
  ["MONEY", [["Payments", "/admin/payments", "▤"]]],
  ["SUPPORT", [["Support", "/admin/support", "◌"], ["Audit log", "/admin/audit", "▥"]]],
  ["SYSTEM", [["Settings", "/admin/settings", "⚙"]]],
];

export default function AdminNav() {
  const path = usePathname();
  return <nav className="grid gap-5" aria-label="Admin navigation">
    {sections.map(([section, items]) => <div key={section}>
      <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[.12em] text-white/45">{section}</p>
      <div className="grid gap-1">
        {items.map(([label, href, icon]) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-bold transition ${active ? "bg-[#1c426d] text-white shadow-inner" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><span className="grid h-5 w-5 place-items-center text-base leading-none" aria-hidden="true">{icon}</span>{label}</Link>;
        })}
      </div>
    </div>)}
  </nav>;
}
