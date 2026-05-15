"use client";

const asset = (path: string) => `/quickola/${path}`;

function scrollToPriceForm() {
  const form = document.getElementById("price-check-form") ?? document.getElementById("hero-price-form");
  const input = document.getElementById("service-input") as HTMLInputElement | null;

  form?.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    input?.focus();
  }, 450);
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[19px] w-[19px] fill-none stroke-[#071638] stroke-[2.1]"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex h-[78px] max-w-[1366px] items-center justify-between px-[20px] pt-[8px] sm:px-8 lg:h-[92px] lg:px-[48px] lg:pt-0">
        <a href="/" className="flex items-center gap-[8px] lg:gap-[13px]" aria-label="Quickola homepage">
          <img
            src={asset("logo-mark.png")}
            alt="Quickola"
            className="h-[31px] w-[31px] object-contain lg:h-[48px] lg:w-[48px]"
          />
          <span className="text-[22px] font-black leading-none tracking-[-0.04em] text-[#071638] lg:text-[30px] lg:font-extrabold lg:tracking-[-0.035em]">
            Quickola
          </span>
        </a>

        <nav className="hidden items-center gap-[54px] text-[15px] font-semibold tracking-[0.01em] text-[#172545] lg:flex">
          <a className="transition hover:text-[#08783f]" href="#how">
            How it works
          </a>
          <button type="button" onClick={scrollToPriceForm} className="transition hover:text-[#08783f]">
            Services
          </button>
          <a className="transition hover:text-[#08783f]" href="#trust">
            Why price-first
          </a>
        </nav>

        <button
          type="button"
          onClick={scrollToPriceForm}
          className="hidden h-[47px] items-center gap-[13px] rounded-[12px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-[20px] text-[15px] font-extrabold tracking-[-0.005em] text-white shadow-[0_10px_22px_rgba(0,104,47,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,104,47,0.28)] sm:flex"
        >
          Check price
          <span className="grid h-[27px] w-[27px] place-items-center rounded-full bg-white text-[19px] leading-none text-[#08783f]">
            →
          </span>
        </button>

        <button
          type="button"
          onClick={scrollToPriceForm}
          className="relative grid h-[31px] w-[31px] place-items-center rounded-full bg-white text-[#071638] shadow-[0_5px_14px_rgba(7,22,56,0.08)] ring-1 ring-[#e5eaf1] sm:hidden"
          aria-label="Check fair price"
        >
          <BellIcon />
          <span className="absolute right-[3px] top-[3px] h-[7px] w-[7px] rounded-full bg-[#ef233c] ring-[2px] ring-white" />
        </button>
      </div>
    </header>
  );
}