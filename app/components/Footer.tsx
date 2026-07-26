import Image from "next/image";
import Link from "next/link";
const groups = [
  [
    "Platform",
    [
      ["How it works", "/how-it-works"],
      ["Product", "/product"],
      ["Sign in", "/business/sign-in"],
    ],
  ],
  [
    "Product",
    [
      ["For STR operators", "/product"],
      ["Bring your own cleaner", "/product"],
      ["Property-ready proof", "/product"],
    ],
  ],
  [
    "Company",
    [
      ["Contact", "/contact"],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy", "/privacy-policy"],
      ["Terms", "/terms"],
      ["Cookies", "/cookies"],
    ],
  ],
];
export default function Footer() {
  return (
    <footer className="border-t border-[#dfe6eb] bg-white px-5 py-14 text-[#071638] sm:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Quickola homepage"
          >
            <Image
              src="/quickola/logo-mark.png"
              alt=""
              width={36}
              height={36}
            />
            <span className="text-[1.35rem] font-extrabold tracking-[-.02em]">
              Quickola
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-[.9375rem] leading-6 text-[#526078]">
            STR turnover coordination for operators and the cleaners they already use.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {groups.map(([heading, items]) => (
            <nav key={heading as string} aria-label={`${heading} links`}>
              <p className="text-xs font-extrabold uppercase tracking-[.1em] text-[#657089]">
                {heading as string}
              </p>
              <div className="mt-4 grid gap-3 text-[.9375rem] font-semibold">
                {(items as string[][]).map(([label, href]) => (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 grid max-w-[1120px] gap-2 border-t border-[#e5eaed] pt-6 text-[.8125rem] leading-5 text-[#657089] sm:grid-cols-2">
        <p>© {new Date().getFullYear()} Quickola.</p>
        <p className="sm:text-right">Know every property is ready before the next guest arrives.</p>
      </div>
    </footer>
  );
}
