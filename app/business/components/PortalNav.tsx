"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Overview", "/business/dashboard", "home"],
  ["Properties", "/business/properties", "building"],
  ["Turnovers", "/business/turnovers", "calendar"],
  ["Cleaners", "/business/cleaners", "people"],
  ["Issues", "/business/issues", "alert"],
  ["Activity", "/business/activity", "activity"],
  ["Settings", "/business/settings", "settings"],
] as const;

export default function PortalNav() {
  const path = usePathname();
  return (
    <nav
      className="grid w-full min-w-0 gap-1.5"
      aria-label="Workspace navigation"
    >
      {items.map(([label, href, icon]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 min-w-0 items-center gap-4 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-[#2e68bb]/30 lg:min-h-13 lg:text-[.9375rem] ${active ? "bg-[#183765] text-white" : "text-white/72 hover:bg-white/7 hover:text-white"}`}
          >
            <NavIcon name={icon} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    building: (
      <>
        <path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2M11 8h1M11 12h1M11 16h1" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" /><path d="M3 20c.4-4 2.4-6 6-6s5.6 2 6 6M16 5a3 3 0 0 1 0 6M17 14c2.5.4 3.8 2.4 4 5" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.2h.01" />
      </>
    ),
    activity: (
      <path d="M3 12h4l2.2-6 4.2 12 2.2-6H21" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
