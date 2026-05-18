"use client";

const asset = (path: string) => `/quickola/${path}`;

function scrollToPriceForm() {
  const form = document.getElementById("hero-price-form") ?? document.getElementById("price-check-form");
  const input = document.getElementById("service-input") as HTMLInputElement | null;

  form?.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    input?.focus();
  }, 400);
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[25px] w-[25px] fill-none stroke-[#071638] stroke-[2.45]"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full border-b border-[#e8edf4] bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:h-[82px] lg:px-10">
        <a href="/" className="flex items-center gap-2.5" aria-label="Quickola homepage">
          <img
            src={asset("logo-mark.png")}
            alt=""
            className="h-[34px] w-[34px] object-contain lg:h-[42px] lg:w-[42px]"
          />
          <span className="text-[26px] font-black leading-none tracking-[-0.045em] text-[#071638] lg:text-[32px]">
            Quick<span className="text-[#079448]">ola</span>
          </span>
        </a>

        <nav className="hidden items-center gap-[44px] text-[15px] font-semibold tracking-[-0.015em] text-[#071638] lg:flex">
          <a className="transition hover:text-[#079448]" href="#how">
            How it works
          </a>
          <button type="button" onClick={scrollToPriceForm} className="transition hover:text-[#079448]">
            Prices
          </button>
          <a className="transition hover:text-[#079448]" href="#reviews">
            Reviews
          </a>
          <a className="transition hover:text-[#079448]" href="#blog">
            Blog
          </a>
          <a className="transition hover:text-[#079448]" href="#about">
            About
          </a>
        </nav>

        <button
          type="button"
          onClick={scrollToPriceForm}
          className="hidden h-[46px] items-center justify-center rounded-[10px] bg-[#079448] px-[27px] text-[15px] font-black tracking-[-0.01em] text-white shadow-[0_10px_24px_rgba(7,148,72,0.24)] transition hover:-translate-y-0.5 hover:bg-[#087f40] lg:flex"
        >
          Check Prices
        </button>

        <button
          type="button"
          onClick={scrollToPriceForm}
          className="grid h-[40px] w-[40px] place-items-center rounded-[12px] bg-white lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}