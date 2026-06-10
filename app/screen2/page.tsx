"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const checkItems = [
  "Checking local price data",
  "Comparing similar jobs",
  "Preparing your guide price",
];

function LogoMark() {
  return (
    <div className="grid h-[28px] w-[28px] place-items-center rounded-[7px] bg-[#071638] shadow-[0_6px_14px_rgba(7,22,56,0.10)]">
      <svg viewBox="0 0 32 32" className="h-[21px] w-[21px]" aria-hidden="true">
        <path
          d="M16 3.8 26.5 8v8.2c0 6.8-4.5 10.8-10.5 12.5C10 27 5.5 23 5.5 16.2V8L16 3.8Z"
          fill="white"
        />
        <path
          d="m10.6 16.2 3.5 3.5 7.5-8"
          fill="none"
          stroke="#07833f"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Screen2Content() {
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (!params.get("service")) params.set("service", "man-and-van");
    if (!params.get("postcode")) params.set("postcode", "SL1 1AA");

    const timers = [
      window.setTimeout(() => setActiveStep(1), 650),
      window.setTimeout(() => setActiveStep(2), 1700),
      window.setTimeout(() => setActiveStep(3), 2900),
      window.setTimeout(() => {
        router.push(`/results?${params.toString()}`);
      }, 3600),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-white text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <section className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_62%,#eef9f3_100%)] px-[22px] pb-[24px] pt-[14px]">
        <header className="relative flex h-[34px] items-center justify-center">
          <Link
            href="/"
            aria-label="Go back"
            className="absolute left-[-8px] top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[#071638]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[24px] w-[24px] fill-none stroke-current stroke-[2.4]"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>

          <div className="flex items-center gap-[8px]">
            <LogoMark />
            <span className="text-[21px] font-black uppercase leading-none tracking-[-0.065em] text-[#071638]">
              QUICKOLA
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center text-center">
          <h1 className="mt-[30px] max-w-[320px] text-[27px] font-black leading-[1.18] tracking-[-0.045em] text-[#071638]">
            Quicko is checking
            <br />
            your fair price...
          </h1>

          <p className="mt-[18px] max-w-[270px] text-[19px] font-extrabold leading-[1.28] tracking-[-0.025em] text-[#071638]">
            This only takes
            <br />
            a <span className="text-[#07833f]">few seconds.</span>
          </p>

          <div className="mt-[25px] w-full max-w-[292px] space-y-[13px] text-left">
            {checkItems.map((item, index) => {
              const stepNumber = index + 1;
              const isDone = activeStep >= stepNumber;
              const isCurrent = activeStep === index;
              const isPending = activeStep < stepNumber;

              return (
                <div
                  key={item}
                  className={`flex items-center gap-[12px] transition-all duration-700 ${
                    isDone ? "translate-y-0 opacity-100" : "translate-y-1 opacity-50"
                  }`}
                >
                  <span
                    className={`grid h-[23px] w-[23px] shrink-0 place-items-center rounded-full shadow-[0_5px_12px_rgba(7,131,63,0.16)] transition-all duration-700 ${
                      isDone
                        ? "scale-100 bg-[#07833f] text-white"
                        : isCurrent
                          ? "scale-100 bg-white text-[#07833f] ring-2 ring-[#dceee2]"
                          : "scale-95 bg-[#eef5f1] text-[#a7b8ad]"
                    } ${isCurrent ? "quickola-loading-dot" : ""}`}
                  >
                    {isDone ? (
                      <svg
                        viewBox="0 0 20 20"
                        className="h-[14px] w-[14px] fill-none stroke-current stroke-[3]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m5 10 3 3 7-7" />
                      </svg>
                    ) : isCurrent ? (
                      <svg viewBox="0 0 24 24" className="quickola-spinner h-[16px] w-[16px]" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.5" className="fill-none stroke-[#dceee2] stroke-[3]" />
                        <circle
                          cx="12"
                          cy="12"
                          r="8.5"
                          className="quickola-spinner-ring fill-none stroke-[#07833f] stroke-[3]"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <span className="h-[7px] w-[7px] rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={`text-[15.5px] font-extrabold leading-none tracking-[-0.02em] transition-colors duration-500 ${
                      isDone ? "text-[#071638]" : isCurrent ? "text-[#071638]" : "text-[#8a97aa]"
                    }`}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="relative mt-[45px] flex w-full flex-col items-center justify-center overflow-visible">
            <div className="absolute top-[72px] h-[110px] w-[220px] rounded-full bg-[#e8f6ef] blur-3xl" />
            <img
              src="/quickola-koala-only.png"
              alt="Quickola koala checking prices"
              className="quickola-koala-float relative z-10 h-auto max-h-[188px] w-[210px] max-w-full object-contain object-bottom drop-shadow-[0_12px_22px_rgba(7,22,56,0.12)]"
            />

            <div className="relative z-20 mt-[10px] h-[6px] w-full max-w-[300px] overflow-hidden rounded-full bg-[#e6eaf1]">
              <div
                className="h-full rounded-full bg-[#07833f] transition-all duration-700 ease-out"
                style={{ width: `${Math.round((Math.min(activeStep, 3) / 3) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <p className="relative z-20 mb-[8px] mt-[14px] text-center text-[16px] font-extrabold leading-tight tracking-[-0.018em] text-[#071638]">
          Almost there — your price guide is loading.
        </p>
      </section>
    </main>
  );
}

export default function Screen2Page() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <Screen2Content />
    </Suspense>
  );
}