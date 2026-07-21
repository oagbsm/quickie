"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  ["Overview", "/business/dashboard"],
  ["Properties", "/business/properties"],
  ["Bookings", "/business/bookings"],
  ["Account", "/business/account"],
] as const;
export default function PortalNav() {
  const path = usePathname();
  return (
    <nav
      className="flex gap-2 overflow-x-auto lg:grid"
      aria-label="Business account navigation"
    >
      {items.map(([label, href]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`min-h-11 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-extrabold outline-none focus:ring-4 focus:ring-[#079448]/20 ${active ? "bg-[#071638] text-white" : "hover:bg-[#edf7f1] hover:text-[#079448]"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
