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
    <div className="min-h-screen bg-[#f5f7fa] text-[#102342] lg:grid lg:grid-cols-[228px_1fr]">
      <header className="sticky top-0 z-30 border-b border-[#dce5e1] bg-[#0b294b] lg:hidden">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-black">
            <Image
              src="/quickola/logo-mark.png"
              alt=""
              width={34}
              height={34}
            />
            <span className="text-white">Quickola <small className="ml-1 text-[10px] font-bold text-white/55">Admin</small></span>
          </Link>
          <div className="flex items-center gap-4">
            <form action={adminSignOut}>
              <button className="text-sm font-black text-white/80">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <aside className="sticky top-0 hidden h-screen border-r border-[#1e3d5b] bg-[#0b294b] p-4 text-white lg:block">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-3 text-[20px] font-extrabold tracking-[-.04em]"><Image src="/quickola/logo-mark.png" alt="" width={30} height={30}/><span>Quickola<small className="ml-0.5 block text-[9px] font-bold tracking-normal text-white/48">Admin</small></span></Link>
        <AdminNav />
        <form action={adminSignOut} className="absolute inset-x-4 bottom-4"><button className="flex w-full items-center gap-3 rounded-lg border-t border-white/10 px-2 pt-4 text-left"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#18a957] text-[11px] font-black text-white">OA</span><span className="min-w-0"><strong className="block truncate text-xs font-bold text-white">Owen Admin</strong><small className="block text-[10px] text-white/50">Super Admin</small></span><span className="ml-auto text-white/50" aria-hidden="true">⌄</span></button></form>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-9 xl:p-10">{children}</main>
    </div>
  );
}
