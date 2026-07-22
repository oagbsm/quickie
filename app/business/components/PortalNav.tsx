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
      className="grid w-full min-w-0 grid-cols-4 gap-1 lg:grid-cols-1 lg:gap-2"
      aria-label="Business account navigation"
    >
      {items.map(([label, href]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`min-h-11 min-w-0 rounded-xl px-1 py-3 text-center text-xs font-extrabold outline-none focus:ring-4 focus:ring-[#079448]/20 sm:px-2 sm:text-sm lg:px-4 lg:text-left ${active ? "bg-[#071638] text-white" : "hover:bg-[#edf7f1] hover:text-[#079448]"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
