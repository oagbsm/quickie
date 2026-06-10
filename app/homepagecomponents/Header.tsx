"use client";

const asset = (path: string) => `/quickola/${path}`;

const whatsappHref =
  "https://wa.me/447347962272?text=Hi%20Quickola%2C%20I%20need%20help%20checking%20a%20fair%20local%20price.%0A%0AService%3A%0APostcode%3A%0AWhen%20needed%3A%0AJob%20details%3A";

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function Header() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full bg-[#061a3d] text-white lg:bg-white lg:text-[#071638]">
      <div className="mx-auto flex h-[64px] max-w-[1180px] items-center justify-start px-5 sm:h-[72px] sm:px-6 lg:h-[84px] lg:justify-between lg:px-10">
        <a href="/" className="flex items-center gap-2.5" aria-label="Quickola homepage">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-white sm:h-[46px] sm:w-[46px] lg:h-auto lg:w-auto lg:bg-transparent">
            <img
              src={asset("logo-mark.png")}
              alt=""
              className="h-[30px] w-[30px] object-contain sm:h-[33px] sm:w-[33px] lg:h-[42px] lg:w-[42px]"
            />
          </span>
          <div className="leading-none">
            <span className="block text-[28px] font-black uppercase leading-[0.86] tracking-[0.015em] text-white sm:text-[31px] lg:text-[36px] lg:text-[#071638]">
              Quickola  
            </span>
            <span className="mt-0.5 block text-[8.5px] font-black uppercase leading-none tracking-[0.08em] text-white/85 sm:text-[9.5px] lg:mt-1 lg:text-[10px] lg:tracking-[0.12em] lg:text-[#071638]">
              <span className="text-[#13b75f]">Fair prices.</span> Local pros.
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-10 text-[14px] font-bold tracking-[-0.015em] text-[#071638] lg:flex">
          <button type="button" onClick={() => scrollToSection("how")} className="transition hover:text-[#079448]">
            How it works
          </button>
          <button type="button" onClick={() => scrollToSection("popular-services")} className="transition hover:text-[#079448]">
            Services
          </button>
          <button type="button" onClick={() => scrollToSection("business")} className="transition hover:text-[#079448]">
            For providers
          </button>
        </nav>

        <div className="hidden items-center lg:flex">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Quickola"
            className="inline-flex h-[42px] items-center justify-center rounded-[10px] bg-[#079448] px-6 text-[13px] font-black tracking-[-0.01em] text-white transition hover:-translate-y-0.5 hover:bg-[#087f40]"
          >
            WhatsApp us
          </a>
        </div>
      </div>
    </header>
  );
}