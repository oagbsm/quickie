import Image from "next/image";
import Link from "next/link";

const links = [
  ["How it works", "/how-it-works"],
  ["For businesses", "/#for-businesses"],
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dfe6eb] bg-white/95 text-[#071638] backdrop-blur">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex min-h-18 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Quickola homepage"
        >
          <Image
            src="/quickola/logo-mark.png"
            alt=""
            width={40}
            height={40}
            priority
          />
          <span className="text-[1.35rem] font-extrabold tracking-[-.02em]">
            Quickola
          </span>
        </Link>
        <nav
          className="hidden items-center gap-8 text-[.9375rem] font-bold lg:flex"
          aria-label="Primary navigation"
        >
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/business/sign-in" className="text-[.9375rem] font-bold">
            Sign in
          </Link>
          <Link
            href="/business/sign-up"
            className="button-primary text-[.9375rem]"
          >
            Create account
          </Link>
        </div>
        <details className="public-menu relative lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-[#ccd6df] px-3 font-black [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav
            className="absolute right-0 top-13 grid w-[min(19rem,calc(100vw-2.5rem))] gap-1 rounded-xl border border-[#dfe6eb] bg-white p-3 shadow-xl"
            aria-label="Mobile navigation"
          >
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-3 font-bold"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/business/sign-in"
              className="rounded-lg px-3 py-3 font-bold"
            >
              Sign in
            </Link>
            <Link
              href="/business/sign-up"
              className="button-primary mt-1 text-center"
            >
              Create account
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
