// NEW FILE CONTENTS BELOW
"use client";

import CumarIntakeForm, { CumarIcon, cumarServices } from "./CumarIntakeForm";

function TrustPoint({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe6f4] bg-white text-[#075cff] shadow-[0_8px_18px_rgba(7,22,56,0.05)]">
        <CumarIcon type={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[13px] font-black leading-[1.1] text-[#071638]">
          {title}
        </p>
        <p className="mt-1 text-[12px] font-semibold leading-[1.2] text-[#40506a]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function Hero() {
  function scrollToPopularServices() {
    document.getElementById("popular-services")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function selectPopularService(serviceValue: string) {
    const url = `/check-price?service=${serviceValue}`;
    window.location.href = url;
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#f8fbff] pt-[72px] lg:pt-[84px]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(0,98,255,0.08),transparent_28%),radial-gradient(circle_at_86%_14%,rgba(7,148,72,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f7fbff_58%,#ffffff_100%)]" />

      <div className="mx-auto max-w-[1440px] px-4 pb-9 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="grid items-center gap-6 rounded-[26px] border border-[#e6edf7] bg-white/82 p-4 shadow-[0_24px_70px_rgba(7,22,56,0.08)] backdrop-blur lg:grid-cols-[minmax(0,0.95fr)_minmax(430px,0.74fr)] lg:gap-8 lg:p-7 xl:grid-cols-[minmax(0,0.9fr)_minmax(500px,0.78fr)]">
          <div className="pb-1 pt-1 lg:py-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf8f1] px-3.5 py-1.5 text-[11px] font-extrabold tracking-[-0.01em] text-[#07833f] sm:text-[12px]">
              <CumarIcon type="pin" className="h-3.5 w-3.5 stroke-[2.4]" />
              #1 Local Price Discovery Platform in Slough
            </div>

            <h1 className="mt-5 max-w-[670px] text-[42px] font-black leading-[0.98] tracking-[-0.065em] text-[#071638] sm:text-[58px] lg:mt-7 lg:text-[76px] xl:text-[82px]">
              Know the Fair Price{" "}
              <span className="relative inline-block text-[#079448]">
                Before
                <span className="absolute -bottom-1 left-0 h-[5px] w-[72%] rounded-full bg-[#0b63ff] sm:h-[6px]" />
              </span>{" "}
              You Pay
            </h1>

            <p className="mt-5 max-w-[590px] text-[16px] font-medium leading-[1.55] tracking-[-0.02em] text-[#273651] sm:text-[19px] lg:text-[21px]">
              Compare real local service prices in Slough before you book, call
              or pay — from man and van to MOTs, plumbers and cleaners.
            </p>

            <div className="mt-5 flex max-w-[560px] items-start gap-3 text-[#071638]">
              <CumarIcon
                type="pin"
                className="mt-0.5 h-6 w-6 shrink-0 text-[#079448]"
              />
              <p className="text-[16px] font-black leading-[1.25] tracking-[-0.02em] sm:text-[18px]">
                Built for Slough, Wexham, Langley, Cippenham and nearby areas.
              </p>
            </div>

            <CumarIntakeForm
              variant="mobile"
              className="mt-7 max-w-[520px] lg:hidden"
            />

            <div className="mt-5 grid max-w-[520px] grid-cols-2 gap-2 rounded-[16px] bg-[#effaf3] px-3 py-3 text-center sm:grid-cols-4 lg:hidden">
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> Free
              </div>
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> No spam calls
              </div>
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> No payment today
              </div>
              <div className="text-[11px] font-extrabold text-[#071638]">
                <span className="text-[#079448]">✓</span> No paid ranking
              </div>
            </div>

            <div className="mt-8 hidden items-stretch gap-4 lg:flex">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("desktop-price-check-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  document.getElementById("desktop-postcode-input")?.focus();
                }}
                className="group relative flex h-[64px] items-center justify-center overflow-hidden rounded-[17px] bg-[#075cff] px-10 text-[18px] font-black text-white shadow-[0_16px_30px_rgba(0,92,255,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#004fe6] hover:shadow-[0_22px_44px_rgba(0,92,255,0.34)] active:translate-y-0 active:scale-[0.985] active:bg-[#003fc2] focus:outline-none focus:ring-4 focus:ring-[#075cff]/25"
              >
                <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.26)_45%,transparent_72%)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
                <span className="relative z-10 flex items-center gap-3">
                  See fair Slough price
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/16 text-[25px] leading-none transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-2">
                    →
                  </span>
                </span>
              </button>

              <a
                href="#popular-services"
                className="flex h-[64px] items-center justify-center gap-3 rounded-[17px] border border-[#dce5f2] bg-white px-8 text-[17px] font-black text-[#071638] shadow-[0_10px_22px_rgba(7,22,56,0.04)] transition hover:-translate-y-0.5"
              >
                See Local Deals
                <span className="rounded-full border border-[#cfd8e7] px-1.5 py-0.5 text-[13px]">
                  ◇
                </span>
              </a>
            </div>

            <div className="mt-8 hidden grid-cols-3 gap-8 lg:grid lg:max-w-[650px]">
              <TrustPoint
                icon="chart"
                title="100% local data"
                subtitle="Based on real local jobs"
              />
              <TrustPoint
                icon="refresh"
                title="Updated regularly"
                subtitle="Prices change. We keep it accurate"
              />
              <TrustPoint
                icon="shield"
                title="No paid ranking"
                subtitle="Fair guidance first"
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <CumarIntakeForm variant="desktop" />
          </div>
        </div>

        <div id="popular-services" className="mt-7 lg:mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#071638] lg:text-[27px]">
              Check fair prices for local services
            </h2>
            <span className="hidden text-[13px] font-black text-[#075cff] lg:block">
              Choose a service to start
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cumarServices.slice(0, 12).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => selectPopularService(item.value)}
                className="rounded-[18px] border border-[#e2e9f4] bg-white p-4 text-left shadow-[0_12px_26px_rgba(7,22,56,0.045)] transition hover:-translate-y-0.5 hover:border-[#bcd2ff] hover:bg-[#fbfdff]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f3f7ff] text-[#075cff]">
                  <CumarIcon type={item.icon} className="h-5 w-5" />
                </span>

                <p className="mt-4 text-[13px] font-black leading-[1.15] text-[#071638]">
                  {item.label}
                </p>

                <p className="mt-2 min-h-[38px] text-[12px] font-semibold leading-[1.35] text-[#52627a]">
                  {item.description}
                </p>

                <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-black text-[#075cff]">
                  Check price <span aria-hidden="true">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-[24px] bg-[#061a3d] p-5 text-white shadow-[0_24px_55px_rgba(7,22,56,0.18)] lg:mt-10 lg:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr_260px]">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white text-[#075cff]">
                <CumarIcon type="shield" className="h-7 w-7" />
              </span>

              <div>
                <h2 className="text-[25px] font-black leading-[1.05] tracking-[-0.045em] lg:text-[32px]">
                  Stop overpaying. Start saving.
                </h2>
                <p className="mt-3 max-w-[430px] text-[15px] font-medium leading-[1.55] text-white/78">
                  QuickOla shows you what local provider services should cost in
                  Slough before you book.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Save money", "Avoid overpaying with fair price guidance"],
                ["Save time", "Compare local prices in seconds"],
                ["Choose better", "Make smarter choices with confidence"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[16px] border border-white/10 bg-white/5 p-3 lg:border-0 lg:bg-transparent lg:p-0 lg:text-left"
                >
                  <p className="text-[13px] font-black text-white">{title}</p>
                  <p className="mt-2 text-[11px] font-medium leading-[1.4] text-white/66">
                    {body}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={scrollToPopularServices}
              className="h-[56px] rounded-[15px] bg-[#075cff] px-6 text-[16px] font-black text-white shadow-[0_18px_36px_rgba(0,92,255,0.28)]"
            >
              See Services →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}