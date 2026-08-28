"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections: Array<[string, Array<[string, string]>]> = [
  ["OPERATIONS", [["Overview", "/admin"], ["Jobs", "/admin/jobs"], ["Bookings", "/admin/marketplace-bookings"], ["Providers", "/admin/providers"], ["Customers", "/admin/customers"]]],
  ["MONEY", [["Payments", "/admin/payments"]]],
  ["SUPPORT", [["Support", "/admin/support"], ["Audit log", "/admin/audit"]]],
  ["SYSTEM", [["Settings", "/admin/settings"]]],
];
export default function AdminNav() {
  const path = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto lg:grid"
      aria-label="Admin navigation"
    >
      {sections.map(([section, items]) => (
        <div key={section} className="mb-5">
          <p className="mb-2 px-3 text-[10px] font-black tracking-[.16em] text-white/40">{section}</p>
          {items.map(([label, href]) => {
            const active = href === "/admin" ? path === href : path.startsWith(href);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`block min-h-11 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30 ${active ? "bg-[#183765] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{label}</Link>;
          })}
        </div>
      ))}
    </nav>
  );
}
