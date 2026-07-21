import Link from "next/link";
import Image from "next/image";
import { requireBusinessUser } from "@/lib/business/auth";
import { signOut } from "../actions";
import PortalNav from "../components/PortalNav";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireBusinessUser();
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#071638]">
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/business/dashboard"
            className="flex items-center gap-2 font-black"
          >
            <Image
              src="/quickola/logo-mark.png"
              alt=""
              width={34}
              height={34}
            />
            Quickola Business
          </Link>
          <form action={signOut}>
            <button className="min-h-11 rounded-lg px-3 text-sm font-black text-[#657089] hover:bg-[#f2f4f7] focus:outline-none focus:ring-4 focus:ring-[#079448]/20">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] lg:grid-cols-[220px_1fr]">
        <aside className="border-b bg-white p-3 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:p-5">
          <PortalNav />
        </aside>
        <main className="min-w-0 p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
