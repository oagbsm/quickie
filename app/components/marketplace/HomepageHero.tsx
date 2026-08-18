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
        className={`${started ? "hidden" : "block"} relative bg-[#061b3f] px-4 pb-[68px] pt-4 text-white md:min-h-0 md:px-5 md:py-10 lg:min-h-[600px] lg:px-8 lg:py-0`}
      >
        <div className="mx-auto grid max-w-[1240px] gap-0 lg:min-h-[600px] lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:gap-12 lg:pt-[88px]">
          <div className="relative z-10 min-w-0 max-w-[340px] md:max-w-none">
            <p className="text-[13px] font-black leading-tight uppercase tracking-[.12em] text-[#23dc63] md:text-sm md:tracking-[.14em]">FAIR PRICES. LOCAL HELP.</p>
            <h1 className="mt-2 max-w-[680px] text-balance text-[2.5rem] font-black leading-[1] tracking-[-.04em] md:mt-4 md:text-6xl md:tracking-[-.055em]">
              Help around the house, <span className="text-[#23dc63]">when you need it.</span>
            </h1>
            <p className="mt-3 max-w-[245px] text-[15.5px] leading-[1.45] text-white/90 md:mt-5 md:max-w-[680px] md:text-[18px] md:leading-8">
              Tell us what you need. Local people send you their prices, and you choose who you want.
            </p>
          </div>
          <div className="pointer-events-none absolute bottom-[55px] right-0 z-10 flex h-[220px] w-[48%] items-end justify-end md:hidden">
            <Image src="/quickola_koala_cutout.png" alt="Quickola koala" width={520} height={620} priority className="h-auto max-h-[210px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,.3)]" />
          </div>
          <div className="relative hidden min-h-[430px] items-end justify-center lg:flex">
            <Image
              src="/quickola_koala_cutout.png"
              alt="Quickola koala"
              width={650}
              height={760}
              priority
              className="relative z-10 h-auto w-[330px] max-w-full max-h-none -translate-y-[103px] object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,.3)]"
            />
            <div className="absolute bottom-6 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-[#23dc63]/20 blur-3xl" />
          </div>
        </div>
      </section>

      <div
        className={`${started ? "mt-0 bg-[#061b3f] md:bg-transparent" : "-mt-14 lg:-mt-[120px] xl:-mt-[120px]"} relative z-20 mx-auto w-full max-w-[1200px] px-4 pb-8 md:px-8 lg:px-0 lg:pb-0`}
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
        <div className={`${started ? "hidden" : "hidden lg:grid"} mt-4 rounded-2xl border border-[#dce7df] bg-white text-[#061b3f] shadow-sm lg:mt-12 lg:min-h-[130px] lg:grid-cols-3 lg:rounded-[24px]`}>
          <div className="p-4 lg:p-6">
            <p className="text-base font-black">Simple. You stay in control.</p>
            <p className="mt-2 text-sm font-semibold">See prices before choosing</p>
          </div>
          <div className="border-t border-[#dce7df] p-4 lg:border-l lg:border-t-0 lg:p-6">
            <p className="text-base font-black">Check who is offering to help</p>
            <p className="mt-2 text-sm font-semibold">Profiles, reviews and ratings</p>
          </div>
          <div className="border-t border-[#dce7df] p-4 lg:border-l lg:border-t-0 lg:p-6">
            <p className="text-base font-black">Only accept when you’re happy</p>
            <p className="mt-2 text-sm font-semibold">You’re in control from start to finish</p>
          </div>
        </div>
        <PostingHelp />
      </div>
    </>
  );
}
