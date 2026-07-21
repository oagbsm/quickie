import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin/auth";
import { adminSignOut } from "@/app/admin/actions";
const nav = [
  ["Overview", "/admin"],
  ["Enquiries", "/admin/enquiries"],
  ["Bookings", "/admin/bookings"],
  ["Properties", "/admin/properties"],
  ["Customers", "/admin/customers"],
  ["Providers", "/admin/providers"],
  ["Settings", "/admin/settings"],
];
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f2f5f7] text-[#071638]">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-black">
            <Image
              src="/quickola/logo-mark.png"
              alt=""
              width={34}
              height={34}
            />
            Quickola Operations
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-bold text-[#657089] sm:block">
              {user.email}
            </span>
            <form action={adminSignOut}>
              <button className="text-sm font-black">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[220px_1fr]">
        <aside className="border-b bg-white p-3 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:p-5">
          <nav
            className="flex gap-2 overflow-x-auto lg:grid"
            aria-label="Admin navigation"
          >
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-extrabold hover:bg-[#edf7f1] hover:text-[#079448]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
