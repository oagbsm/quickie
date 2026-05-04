"use client";

const asset = (path: string) => `/quickola/${path}`;

function scrollToPriceForm() {
  const form = document.getElementById("price-check-form");
  const input = document.getElementById("service-input") as HTMLInputElement | null;

  form?.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    input?.focus();
  }, 450);
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-[#dfe5ee] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1366px] items-center justify-between px-5 sm:px-8 lg:px-[48px]">
        <a href="/" className="flex items-center gap-[13px]" aria-label="Quickola homepage">
          <img
            src={asset("logo-mark.png")}
            alt="Quickola"
            className="h-[48px] w-[48px] object-contain"
          />
          <span className="text-[31px] font-bold leading-none tracking-[0.035em] text-[#071638]">
            Quickola
          </span>
        </a>

        <nav className="hidden items-center gap-[54px] text-[15px] font-semibold tracking-[0.01em] text-[#172545] lg:flex">
          <a className="transition hover:text-[#08783f]" href="#how">
            How it works
          </a>
          <a className="transition hover:text-[#08783f]" href="/cleaning-london">
            Cleaning prices
          </a>
          <a className="transition hover:text-[#08783f]" href="#trust">
            Why Quickola
          </a>
        </nav>

        <button
          type="button"
          onClick={scrollToPriceForm}
          className="hidden h-[47px] items-center gap-[13px] rounded-[11px] bg-[linear-gradient(180deg,#079940_0%,#00672e_100%)] px-[20px] text-[15px] font-bold tracking-[0.01em] text-white shadow-[0_10px_22px_rgba(0,104,47,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,104,47,0.28)] sm:flex"
        >
          Check fair price
          <span className="grid h-[27px] w-[27px] place-items-center rounded-full bg-white text-[19px] leading-none text-[#08783f]">
            →
          </span>
        </button>
      </div>
    </header>
  );
}