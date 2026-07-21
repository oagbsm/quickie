import Image from "next/image";
import Link from "next/link";
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dfe6eb] bg-white/95 text-[#071638] backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Quickola homepage"
        >
          <Image src="/quickola/logo-mark.png" alt="" width={40} height={40} />
          <span className="text-2xl font-black tracking-tight">Quickola</span>
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm font-extrabold lg:flex"
          aria-label="Primary navigation"
        >
          <Link href="/#services" className="hover:text-[#08783f]">
            Services
          </Link>
          <Link href="/#how-it-works" className="hover:text-[#08783f]">
            How it works
          </Link>
          <Link href="/#who-we-serve" className="hover:text-[#08783f]">
            Who we serve
          </Link>
          <Link href="/#service-area" className="hover:text-[#08783f]">
            Service area
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/business/sign-in"
            className="text-sm font-black hover:text-[#08783f]"
          >
            Business login
          </Link>
          <Link
            href="/business/enquire"
            className="rounded-xl bg-[#08783f] px-4 py-3 text-center text-sm font-black text-white hover:bg-[#075f31]"
          >
            Request cleaning
          </Link>
        </div>
      </div>
    </header>
  );
}
