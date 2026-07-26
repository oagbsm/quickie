import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin/auth";
import { adminSignOut } from "@/app/admin/actions";
import AdminNav from "@/app/admin/components/AdminNav";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#071638] lg:grid lg:grid-cols-[236px_1fr]">
      <header className="sticky top-0 z-30 border-b bg-white lg:hidden">
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
            <form action={adminSignOut}>
              <button className="text-sm font-black">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <aside className="sticky top-0 hidden h-screen bg-[linear-gradient(160deg,#061b40,#031a36)] p-4 text-white lg:block">
        <Link href="/admin" className="flex items-center gap-3 px-3 py-5 text-xl font-extrabold"><Image src="/quickola/logo-mark.png" alt="" width={38} height={38}/>Quickola</Link>
        <p className="mb-5 px-3 text-xs font-extrabold uppercase tracking-[.14em] text-white/45">Operations console</p>
        <AdminNav />
        <form action={adminSignOut} className="absolute inset-x-4 bottom-5"><button className="min-h-11 w-full rounded-lg border border-white/15 px-3 text-left text-sm font-bold text-white/70">Sign out</button></form>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-9 xl:p-10">{children}</main>
    </div>
  );
}
