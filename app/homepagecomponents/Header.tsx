"use client";

const asset = (path: string) => `/quickola/${path}`;

function scrollToSection(sectionId: string, focusSelector?: string) {
  const section = document.getElementById(sectionId);

  section?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (!focusSelector) return;

  window.setTimeout(() => {
    const focusTarget = section?.querySelector<HTMLElement>(focusSelector);
    focusTarget?.focus();
  }, 400);
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
          <button type="button" onClick={() => scrollToSection("services-section")} className="transition hover:text-[#079448]">
            Services
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("business")}
            className="flex h-[42px] items-center justify-center rounded-[10px] bg-[#079448] px-[20px] text-[14px] font-black tracking-[-0.01em] text-white shadow-[0_10px_24px_rgba(7,148,72,0.24)] transition hover:-translate-y-0.5 hover:bg-[#087f40] sm:h-[46px] sm:px-[27px] sm:text-[15px]"
          >
            Providers
          </button>
        </nav>

        <button
          type="button"
          onClick={() => scrollToSection("services-section")}
          className="hidden h-[46px] items-center justify-center rounded-[10px] bg-[#079448] px-[27px] text-[15px] font-black tracking-[-0.01em] text-white shadow-[0_10px_24px_rgba(7,148,72,0.24)] transition hover:-translate-y-0.5 hover:bg-[#087f40] lg:flex"
        >
          Services
        </button>
      </div>
    </header>
  );
}