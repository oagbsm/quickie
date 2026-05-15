import type { ReactNode } from "react";

const asset = (path: string) => `/quickola/${path}`;

export default function BusinessCTA() {
  return (
    <section
      id="business"
      className="bg-white px-[20px] pb-[18px] pt-[8px] sm:px-8 sm:pb-8 sm:pt-5 lg:px-[60px] lg:pb-10 lg:pt-6"
    >
      <div className="mx-auto max-w-[1220px] rounded-[16px] border border-[#dcebdc] bg-[linear-gradient(180deg,#f7fcf8_0%,#ffffff_100%)] p-[14px] shadow-[0_10px_28px_rgba(7,22,56,0.06)] sm:rounded-[22px] sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:bg-[linear-gradient(90deg,#f3fbf4_0%,#ffffff_50%,#f3fbf4_100%)] lg:px-[45px] lg:py-[28px]"
      >
        <div className="flex items-start gap-[12px] sm:items-center sm:gap-4 lg:w-auto">
          <img
            src={asset("business-shop.png")}
            alt=""
            className="mt-[2px] h-[44px] w-[56px] shrink-0 object-contain sm:h-[64px] sm:w-[82px]"
          />

          <div className="min-w-0 flex-1">
            <p className="mb-[5px] inline-flex rounded-full bg-white px-[8px] py-[4px] text-[8.5px] font-black uppercase tracking-[0.08em] text-[#08783f] ring-1 ring-[#dcebdc] sm:text-[10px]">
              For providers
            </p>

            <h2 className="text-[20px] font-black leading-[1.02] tracking-[-0.045em] text-[#071638] sm:text-[28px] lg:text-[30px]">
              Are you a local service provider?
            </h2>

            <p className="mt-[7px] max-w-[690px] text-[12.5px] font-bold leading-[1.45] tracking-[-0.01em] text-[#172545] sm:mt-2 sm:text-[16px]">
              Join Quickola for free and get local job requests when customers check fair prices in your area.
            </p>
          </div>
        </div>

        <div className="mt-[13px] grid grid-cols-2 gap-[8px] text-[10.5px] font-black text-[#172545] sm:mt-4 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:text-[12px] lg:mt-0 lg:max-w-[420px] lg:gap-x-8 lg:text-[13px]">
          <Tick>Free profile</Tick>
          <Tick>No contracts</Tick>
          <Tick>No win, no fee</Tick>
          <Tick>Local requests</Tick>
        </div>

        <div className="mt-[14px] lg:mt-0 lg:w-auto lg:text-center">
          <a
            href="/for-providers"
            className="inline-flex h-[44px] w-full items-center justify-center gap-[12px] rounded-[9px] bg-[#061536] px-[18px] text-[14px] font-black tracking-[-0.03em] text-white shadow-[0_12px_24px_rgba(6,21,54,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(6,21,54,0.22)] sm:h-[48px] sm:max-w-[260px] sm:text-[16px] lg:h-[52px] lg:w-auto lg:min-w-[210px]"
          >
            Join as a provider
            <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#9adc36] text-[18px] leading-none text-[#061536] sm:h-8 sm:w-8 sm:text-[22px]">
              →
            </span>
          </a>

          <p className="mt-[7px] text-center text-[11px] font-bold text-[#172545] sm:text-[13px]">
            Free to join. Pay only after completed jobs.
          </p>
        </div>
      </div>
    </section>
  );
}

function Tick({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-[9px] bg-white px-[8px] py-[7px] ring-1 ring-[#e5efe5] sm:bg-transparent sm:px-0 sm:py-0 sm:ring-0">
      <span className="grid h-[15px] w-[15px] place-items-center rounded-full border border-[#08783f] text-[9px] font-black leading-none text-[#08783f] sm:h-auto sm:w-auto sm:border-0 sm:text-[16px]">
        ✓
      </span>
      {children}
    </span>
  );
}