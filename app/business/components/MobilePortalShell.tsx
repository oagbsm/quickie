"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationMenu from "./NotificationMenu";
import { signOut } from "../actions";
type Notification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};
const primary = [
  ["Home", "/business/dashboard", "home"],
  ["Turnovers", "/business/turnovers", "calendar"],
  ["Properties", "/business/properties", "building"],
  ["Cleaners", "/business/cleaners", "people"],
] as const;
function Icon({ name }: { name: string }) {
  const paths =
    name === "home"
      ? <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>
      : name === "calendar"
        ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" /></>
        : name === "building"
          ? <><path d="M4 21V5l8-3 8 3v16M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" /></>
          : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>;
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths}</svg>;
}
export default function MobilePortalShell({
  notifications,
  displayName,
}: {
  notifications: Notification[];
  displayName: string;
}) {
  const path = usePathname(),
    nested = ![
      "/business/dashboard",
      "/business/turnovers",
      "/business/properties",
      "/business/cleaners",
      "/business/issues",
      "/business/activity",
      "/business/settings",
    ].includes(path);
  const root = path.startsWith("/business/turnovers")
    ? ["Turnovers", "/business/turnovers"]
    : path.startsWith("/business/properties")
      ? ["Properties", "/business/properties"]
      : path.startsWith("/business/cleaners")
        ? ["Cleaners", "/business/cleaners"]
        : ["Quickola", "/business/dashboard"];
  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
        <Link
          href={nested ? root[1] : "/business/dashboard"}
          className="flex min-h-12 items-center gap-2 text-lg font-extrabold"
          aria-label={nested ? `Back to ${root[0]}` : "Quickola home"}
        >
          {nested && <span aria-hidden="true">←</span>}
          <span>{root[0]}</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationMenu notifications={notifications} />
          <details className="relative">
            <summary
              aria-label="Account menu"
              className="grid h-12 w-12 cursor-pointer list-none place-items-center rounded-full bg-[#e9eff8] font-extrabold text-[#16467e]"
            >
              {displayName.charAt(0)}
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/10">
              <p className="truncate px-3 py-2 text-sm font-bold">
                {displayName}
              </p>
              <Link
                href="/business/settings"
                className="flex min-h-12 items-center rounded-lg px-3 font-bold"
              >
                Account settings
              </Link>
              <form action={signOut}>
                <button className="min-h-12 w-full rounded-lg px-3 text-left font-bold text-red-700">
                  Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <nav
        aria-label="Mobile workspace navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid h-[72px] grid-cols-5 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(7,22,56,.08)] lg:hidden"
      >
        {primary.map(([label, href, icon]) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? "text-[#16467e]" : "text-[#657089]"}`}
            >
              <Icon name={icon} />
              {label}
            </Link>
          );
        })}
        <details className="group relative">
          <summary
            className={`flex h-full cursor-pointer list-none flex-col items-center justify-center gap-1 text-[11px] font-bold ${["/business/issues", "/business/activity", "/business/settings"].some((x) => path.startsWith(x)) ? "text-[#16467e]" : "text-[#657089]"}`}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              •••
            </span>
            More
          </summary>
          <div className="absolute bottom-[76px] right-2 w-56 rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/10">
            {[
              ["Issues", "/business/issues"],
              ["Activity", "/business/activity"],
              ["Notifications", "/business/dashboard"],
              ["Account", "/business/settings"],
              ["Help", "/contact"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex min-h-12 items-center rounded-lg px-3 font-bold hover:bg-[#f4f6f9]"
              >
                {label}
              </Link>
            ))}
            <form action={signOut}>
              <button className="min-h-12 w-full rounded-lg px-3 text-left font-bold text-red-700">
                Sign out
              </button>
            </form>
          </div>
        </details>
      </nav>
    </>
  );
}
