"use client";

import Image from "next/image";
import { useState } from "react";
import ConsumerJobComposer from "@/app/components/marketplace/ConsumerJobComposer";
import PostingHelp from "@/app/components/marketplace/PostingHelp";

type Props = {
  initialService?: string;
  initialPostcode?: string;
  initialLocation?: string;
  initialJob?: string;
  error?: string;
};

export default function HomepageHero({
  initialService = "",
  initialPostcode = "",
  initialLocation = "",
  initialJob = "",
  error = "",
}: Props) {
  const [started, setStarted] = useState(Boolean(initialService && initialJob));

  return (
    <>
      <section
        className={`${started ? "hidden" : "block"} relative bg-[#061b3f] px-4 pb-[145px] pt-5 text-white md:min-h-0 md:px-5 md:py-10 lg:min-h-[560px] lg:px-8 lg:py-0`}
      >
        <div className="mx-auto grid max-w-[1240px] gap-0 lg:min-h-[560px] lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-12">
          <div className="relative z-10 min-w-0 md:max-w-none">
            <p className="text-[13px] font-black leading-tight uppercase tracking-[.12em] text-[#23dc63] md:text-sm md:tracking-[.14em]">FAIR PRICES. LOCAL HELP.</p>
            <h1 className="mt-2 max-w-[680px] text-balance text-[2.5rem] font-black leading-[1] tracking-[-.04em] md:mt-4 md:text-6xl md:tracking-[-.055em]">
              Help around the house, <span className="text-[#23dc63]">when you need it.</span>
            </h1>
            <p className="mt-3 max-w-[680px] text-[15.5px] leading-[1.45] text-white/90 md:mt-5 md:text-[18px] md:leading-8">
              Tell us what you need. Local people send you their prices, and you choose who you want.
            </p>
          </div>
          <div className="pointer-events-none absolute bottom-[-35px] right-[-16px] z-10 flex h-[315px] w-[68%] items-end justify-end md:hidden">
            <Image src="/quickola_koala_cutout.png" alt="Quickola koala" width={520} height={620} priority className="h-auto max-h-[300px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,.3)]" />
          </div>
          <div className="relative hidden min-h-[430px] items-end justify-center lg:flex">
            <Image
              src="/quickola_koala_cutout.png"
              alt="Quickola koala"
              width={650}
              height={760}
              priority
              className="relative z-10 h-auto max-h-[430px] w-auto object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,.3)]"
            />
            <div className="absolute bottom-6 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-[#23dc63]/20 blur-3xl" />
          </div>
        </div>
      </section>

      <div
        className={`${started ? "mt-0 bg-[#061b3f] md:bg-transparent" : "-mt-10 lg:-mt-36 xl:-mt-40"} relative z-20 mx-auto w-full max-w-[1120px] px-4 pb-8 md:px-8 lg:px-0 lg:pb-0`}
      >
        {started && (
          <div className="relative z-10 -mb-10 flex h-[205px] items-end justify-end md:hidden">
            <Image
              src="/quickola_koala_cutout.png"
              alt="Quickola koala"
              width={420}
              height={500}
              className="relative z-10 mr-1 h-auto max-h-[275px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,.3)]"
            />
          </div>
        )}
        <ConsumerJobComposer
          initialService={initialService}
          initialPostcode={initialPostcode}
          initialLocation={initialLocation}
          initialJob={initialJob}
          error={error}
          onStarted={() => setStarted(true)}
        />
        <div className={`${started ? "hidden" : "hidden lg:block"} mt-4 rounded-2xl border border-[#dce7df] bg-white p-4 text-[#061b3f] shadow-sm lg:p-5`}>
          <p className="text-base font-black">Simple. You stay in control.</p>
          <div className="mt-3 grid gap-2 text-sm font-semibold sm:grid-cols-3">
            <p>✓ See prices before choosing</p>
            <p>✓ Check who is offering to help</p>
            <p>✓ Only accept when you’re happy</p>
          </div>
        </div>
        <PostingHelp />
      </div>
    </>
  );
}
