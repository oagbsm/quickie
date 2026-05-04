import type { ReactNode } from "react";
const asset = (path: string) => `/quickola/${path}`;

export default function BusinessCTA() {
  return (
    <section
      id="business"
      className="bg-white px-5 pb-8 pt-5 sm:px-8 lg:px-[60px] lg:pb-10 lg:pt-6"
    >
      <div className="mx-auto flex max-w-[1220px] flex-col items-center justify-between gap-6 rounded-[22px] border border-[#dcebdc] bg-[linear-gradient(90deg,#f3fbf4_0%,#ffffff_50%,#f3fbf4_100%)] px-5 py-6 shadow-[0_16px_40px_rgba(7,22,56,0.06)] sm:px-8 lg:flex-row lg:px-[45px] lg:py-[28px]">
        <div className="flex w-full flex-col items-center gap-4 text-center sm:flex-row sm:text-left lg:w-auto">
          <img
            src={asset("business-shop.png")}
            alt=""
            className="h-[64px] w-[82px] shrink-0 object-contain"
          />

          <div>
            <h2 className="text-[26px] font-bold leading-none tracking-[-0.015em] text-[#071638] sm:text-[28px]">
              Are you a cleaner?
            </h2>

            <p className="mt-2 text-[15px] font-semibold tracking-[0em] text-[#172545] sm:text-[16px]">
              Join Quickola for free and receive local cleaning requests when customers need help.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] font-extrabold text-[#172545] sm:justify-start lg:gap-x-8 lg:text-[13px]">
              <Tick>Free cleaner profile</Tick>
              <Tick>No contracts</Tick>
              <Tick>No monthly fees</Tick>
              <Tick>Local cleaning requests</Tick>
            </div>
          </div>
        </div>

        <div className="w-full text-center lg:w-auto">
          <a
            href="/for-cleaners"
            className="inline-flex h-[48px] w-full max-w-[260px] items-center justify-center gap-[22px] rounded-[10px] bg-[#061536] px-[22px] text-[16px] font-black tracking-[-0.03em] text-white shadow-[0_14px_28px_rgba(6,21,54,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(6,21,54,0.22)] lg:h-[52px] lg:w-auto lg:min-w-[210px]"
          >
            Join as a cleaner
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#9adc36] text-[22px] leading-none text-[#061536]">
              →
            </span>
          </a>

          <p className="mt-2 text-[12px] font-bold text-[#172545] sm:text-[13px]">
            Free to join while we launch.
          </p>
        </div>
      </div>
    </section>
  );
}

function Tick({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[16px] font-black text-[#08783f]">✓</span>
      {children}
    </span>
  );
}