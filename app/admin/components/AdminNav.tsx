"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Operations", "/admin"],
  ["Arrivals", "/admin/turnovers"],
  ["Properties", "/admin/properties"],
  ["Team", "/admin/cleaners"],
  ["Issues", "/admin/issues"],
  ["Customers", "/admin/accounts"],
  ["Activity", "/admin/activity"],
  ["Settings", "/admin/settings"],
];
export default function AdminNav() {
  const path = usePathname();
  return (
    <nav
      className="flex gap-1 overflow-x-auto lg:grid"
      aria-label="Admin navigation"
    >
      {items.map(([label, href]) => {
        const active =
          href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30 ${active ? "bg-[#183765] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
