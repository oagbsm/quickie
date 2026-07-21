import Image from "next/image";
import Link from "next/link";

export default function PublicHeader() {
  return <header className="border-b border-white/10 bg-[#061a3d] text-white">
    <div className="mx-auto flex h-18 max-w-[1180px] items-center justify-between px-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2 text-xl font-black"><Image src="/quickola/logo-mark.png" alt="" width={38} height={38} />Quickola</Link>
      <nav className="flex items-center gap-3 text-sm font-extrabold sm:gap-6" aria-label="Business navigation">
        <Link href="/#booking" className="hidden hover:text-[#4bd35f] sm:block">Book a clean</Link>
        <Link href="/business/sign-in" className="hover:text-[#4bd35f]">Sign in</Link>
        <Link href="/business/sign-up" className="rounded-xl bg-[#4bd35f] px-4 py-2.5 text-[#061a3d]">Create account</Link>
      </nav>
    </div>
  </header>;
}
